import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migrations = new URL("../supabase/migrations/", import.meta.url);
const user = n => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
let serial = 0;
function event(n, state="paid", overrides={}) {
  return { digest:createHash("sha256").update(String(++serial)).digest("hex"),event_name:state === "refunded" ? "order_refunded" : "order_created",store_id:"1",order_id:String(n),variant_id:"10",test_mode:false,user_id:user(n),state,total_minor:5000,currency:"GBP",updated_at:"2026-09-26T10:00:00Z",...overrides };
}
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon,service_role;
    grant execute on function auth.uid() to authenticated,anon,service_role;
    alter default privileges in schema public grant all on tables to authenticated,service_role;`);
  return db;
}
async function migrate(db, from, to) {
  for(const file of (await readdir(migrations)).sort().slice(from,to)) {
    const sql = (await readFile(new URL(file,migrations),"utf8")).replace("create extension if not exists pgcrypto;","");
    await db.exec(sql);
  }
}
async function as(db,id,fn,role="authenticated") {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id ?? ""]);
  try { return await fn(); } finally { await db.exec("reset role"); }
}
async function ingest(db,e) { return as(db,null,()=>db.query("select public.record_lemon_order($1::jsonb) as result",[JSON.stringify(e)]),"service_role"); }
async function status(db,id) { return as(db,id,async()=> (await db.query("select public.my_lifetime_access() as result")).rows[0].result); }

test("fresh schema replay and restrictive policies",async()=>{
  const db=await setup();
  try {
    await migrate(db,0,6);
    const {rows}=await db.query("select count(*)::int as n from pg_policies where policyname='lifetime_access_required'");
    assert.equal(rows[0].n,10);
    assert.equal((await db.query("select enforced from commerce_private.settings")).rows[0].enforced,true);
  } finally { await db.close(); }
});

test("upgrade, receipts, refunds and role/tenant isolation on actual PostgreSQL",async t=>{
  const db=await setup();
  try {
    await migrate(db,0,3);
    for(let n=1;n<=12;n++) await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",[user(n),`fixture-${n}@example.test`]);
    const workspaceA=(await as(db,user(1),()=>db.query("select public.create_workspace('Tenant A') as id"))).rows[0].id;
    const workspaceB=(await as(db,user(5),()=>db.query("select public.create_workspace('Tenant B') as id"))).rows[0].id;
    for(const [base,w] of [[1,workspaceA],[5,workspaceB]]) {
      for(const [offset,role] of [[1,"admin"],[2,"member"],[3,"viewer"]]) await db.query("insert into public.memberships(workspace_id,user_id,role) values($1,$2,$3)",[w,user(base+offset),role]);
      await db.query("insert into public.clients(workspace_id,name,created_by) values($1,'Same name',$2)",[w,user(base)]);
      await db.query("insert into public.money_entries(workspace_id,direction,amount,created_by) values($1,'income',100,$2)",[w,user(base)]);
    }
    await migrate(db,3,5);
    await t.test("upgrade preserves data and existing pre-launch users",async()=>{
      assert.equal((await status(db,user(1))).allowed,true);
      assert.equal((await status(db,user(1))).state,"pending");
      assert.equal((await db.query("select count(*)::int as n from public.clients")).rows[0].n,2);
    });
    await migrate(db,5,6);
    await t.test("unpaid callers cannot read REST tables or invoke workspace creation",async()=>{
      for(let n=1;n<=8;n++) await as(db,user(n),async()=>{
        for(const table of ["clients","leads","projects","tasks","followups","invoices","money_entries","workspaces","memberships","notifications"]) assert.equal((await db.query(`select * from public.${table}`)).rows.length,0);
        await assert.rejects(db.query("select public.create_workspace('Denied')"),/Access denied/);
        assert.equal((await db.query("select public.workspace_role($1) as role",[workspaceA])).rows[0].role,null);
      });
    });
    await t.test("browser roles cannot mint purchases or read/change private commerce",async()=>{
      for(const role of ["anon","authenticated"]) await as(db,user(1),async()=>{
        await assert.rejects(db.query("select public.record_lemon_order($1::jsonb)",[JSON.stringify(event(1))]),/permission denied/);
        for(const table of ["purchases","entitlements","webhook_events","settings","access_exemptions"]) await assert.rejects(db.query(`select * from commerce_private.${table}`),/permission denied/);
        await assert.rejects(db.query("update commerce_private.settings set enforced=false"),/permission denied/);
      },role);
      await as(db,null,()=>assert.rejects(db.query("select public.my_lifetime_access()"),/permission denied/),"anon");
    });
    await t.test("duplicate and parallel submissions create one purchase and receipt",async()=>{
      const e=event(1);
      // PGlite serializes a single connection; true multi-connection races remain a staging gate.
      await as(db,null,()=>Promise.all(Array.from({length:8},()=>db.query("select public.record_lemon_order($1::jsonb)",[JSON.stringify(e)]))),"service_role");
      assert.equal((await db.query("select count(*)::int as n from commerce_private.purchases")).rows[0].n,1);
      assert.equal((await db.query("select count(*)::int as n from commerce_private.webhook_events")).rows[0].n,1);
      assert.equal((await status(db,user(1))).state,"verified");
      assert.equal((await status(db,user(2))).state,"pending");
    });
    for(let n=2;n<=8;n++) await ingest(db,event(n));
    await t.test("paid owner/admin/member/viewer stay within their tenant and roles",async()=>{
      for(let n=1;n<=8;n++) await as(db,user(n),async()=>{
        const own=n<=4?workspaceA:workspaceB, foreign=n<=4?workspaceB:workspaceA;
        const clients=(await db.query("select * from public.clients")).rows;
        assert.equal(clients.length,1);assert.equal(clients[0].workspace_id,own);
        assert.equal((await db.query("select * from public.clients where workspace_id=$1",[foreign])).rows.length,0);
        await assert.rejects(db.query("insert into public.clients(workspace_id,name,created_by) values($1,'forged',$2)",[foreign,user(n)]),/row-level security/);
        const role=(n-1)%4;
        assert.equal((await db.query("select * from public.money_entries")).rows.length,role<2?1:0);
        if(role===3) await assert.rejects(db.query("insert into public.clients(workspace_id,name,created_by) values($1,'viewer write',$2)",[own,user(n)]),/row-level security/);
      });
    });
    await t.test("logout and a new authenticated session preserve paid access",async()=>{
      assert.equal((await status(db,user(2))).allowed,true);
      await as(db,null,()=>assert.rejects(db.query("select public.my_lifetime_access()"),/permission denied/),"anon");
      assert.equal((await status(db,user(2))).allowed,true);
      assert.equal((await status(db,user(9))).allowed,false);
    });    await t.test("refund revokes access and stale paid deliveries cannot restore it",async()=>{
      await ingest(db,event(1,"refunded",{updated_at:"2026-09-27T10:00:00Z",user_id:null}));
      await ingest(db,event(1));
      await ingest(db,event(1,"paid",{updated_at:"2026-09-28T10:00:00Z"}));
      assert.equal((await status(db,user(1))).state,"refunded");
      assert.equal((await status(db,user(1))).allowed,false);
      await as(db,user(1),async()=>assert.equal((await db.query("select * from public.clients")).rows.length,0));
      assert.equal((await status(db,user(2))).allowed,true);
    });
    await t.test("refund before paid is a terminal tombstone, including unbound orders",async()=>{
      await ingest(db,event(9,"refunded",{user_id:null}));await ingest(db,event(9));
      assert.equal((await status(db,user(9))).allowed,false);
    });
    await t.test("unpaid and fraudulent orders never grant access",async()=>{
      for(const state of ["pending","failed","fraudulent"]) { await ingest(db,event(10,state,{order_id:String(100+serial)}));assert.equal((await status(db,user(10))).allowed,false); }
    });
    await t.test("test purchases excluded until explicit staging switch",async()=>{
      await ingest(db,event(11,"paid",{test_mode:true}));assert.equal((await status(db,user(11))).allowed,false);
      await db.exec("update commerce_private.settings set allow_test_purchases=true");assert.equal((await status(db,user(11))).purchase.test_mode,true);
      await db.exec("update commerce_private.settings set allow_test_purchases=false");
    });
    await t.test("exemptions expire, never report a verified purchase",async()=>{
      await db.query("insert into commerce_private.access_exemptions(user_id,reason,expires_at) values($1,'test',now()+interval '1 day')",[user(12)]);
      assert.equal((await status(db,user(12))).allowed,true);assert.equal((await status(db,user(12))).purchase,null);
      await db.query("update commerce_private.access_exemptions set expires_at=now()-interval '1 day' where user_id=$1",[user(12)]);
      assert.equal((await status(db,user(12))).allowed,false);
    });
    await t.test("failed receipt rolls back purchase and entitlement atomically",async()=>{
      await assert.rejects(ingest(db,event(12,"paid",{order_id:"999",digest:"invalid"})),/check constraint/);
      assert.equal((await db.query("select * from commerce_private.purchases where order_id='999'")).rows.length,0);
      assert.equal((await status(db,user(12))).allowed,false);
    });
    await t.test("order identity cannot be reassigned; independent purchases preserve access",async()=>{
      await assert.rejects(ingest(db,event(2,"paid",{user_id:user(12)})),/identity conflict/);
      await ingest(db,event(1,"paid",{order_id:"1001"}));
      assert.equal((await status(db,user(1))).allowed,true);
    });
  } finally { await db.close(); }
});


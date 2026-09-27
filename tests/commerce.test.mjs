import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { checkoutDestination } from "../lib/commerce/checkout.ts";
import { verifyLemonSignature } from "../lib/commerce/lemon-signature.ts";
import { lemonConfig, accountBinding, normalizeLemonOrder } from "../lib/commerce/lemon-order.ts";
import { handleLemonWebhook } from "../lib/commerce/lemon-webhook.ts";
import { paidAccessDecision } from "../lib/commerce/access-policy.ts";
import { parseLifetimeStatus } from "../lib/commerce/access-status.ts";
import { verifiedPurchaseEvent } from "../lib/commerce/meta-event.ts";
import { authDestination } from "../lib/commerce/auth-destination.ts";

test("checkout auth preserves only allowlisted return destinations",()=>{
 for(const path of ["/checkout","/thank-you"]) assert.equal(authDestination(path),path);
 for(const path of ["https://evil.test","//evil.test","/\\evil.test","javascript:alert(1)",null,["/checkout"]]) assert.equal(authDestination(path),"/account");
});

export const env = {
 LEMON_SQUEEZY_WEBHOOK_SECRET:"synthetic-webhook-secret",
 LEMON_SQUEEZY_CHECKOUT_SECRET:"synthetic-account-secret",
 LEMON_SQUEEZY_STORE_ID:"1", LEMON_SQUEEZY_VARIANT_IDS:"10",
 LEMON_SQUEEZY_MODE:"live", LEMON_SQUEEZY_CURRENCY:"GBP",
 LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR:"5000",
};
const config = lemonConfig(env);
const userId = "10000000-0000-4000-8000-000000000001";
function payload() { return { meta:{event_name:"order_created",test_mode:false,custom_data:{account_id:userId,account_binding:accountBinding(userId,config)}},
 data:{type:"orders",id:"100",attributes:{store_id:1,first_order_item:{variant_id:10},status:"paid",refunded:false,refunded_amount:0,total:5000,currency:"GBP",test_mode:false,updated_at:"2026-09-26T10:00:00Z"}} }; }
function request(value, secret=env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
 const body = typeof value === "string" ? value : JSON.stringify(value);
 return new Request("https://example.test/api/lemonsqueezy/webhook",{method:"POST",body,headers:{"x-signature":createHmac("sha256",secret).update(body).digest("hex")}});
}
function normalize(value) { return normalizeLemonOrder(value,Buffer.from(JSON.stringify(value)),config); }

test("checkout is restricted to the original HTTPS host",()=>{
 const host="business-client-os.lemonsqueezy.com";
 assert.equal(checkoutDestination("https://"+host+"/checkout/buy/example",host),"https://"+host+"/checkout/buy/example");
 for(const url of ["http://"+host,"https://evil.test","https://"+host+".evil.test","https://user:pass@"+host,"https://"+host+":8443","https://"+host+"/#fragment","javascript:alert(1)"]) assert.equal(checkoutDestination(url,host),null);
 assert.equal(checkoutDestination(undefined,undefined),null);
});
test("strict hex HMAC verifies exact bytes and rejects tampering",()=>{
 const raw=Buffer.from('{"name":"é"}'), secret="synthetic";
 const sig=createHmac("sha256",secret).update(raw).digest("hex");
 assert.equal(verifyLemonSignature(raw,sig,secret),true);
 for(const bad of [null,"",sig.slice(1),"x".repeat(64),sig+"00"]) assert.equal(verifyLemonSignature(raw,bad,secret),false);
 for(const missing of [undefined,""," "]) assert.equal(verifyLemonSignature(raw,sig,missing),false);
 assert.equal(verifyLemonSignature(Buffer.from('{}'),sig,secret),false);
 assert.equal(verifyLemonSignature(raw,sig,"wrong"),false);
});
test("webhook rejects unconfigured, forged, malformed and oversized input without persistence",async()=>{
 let calls=0; const persist=async()=>{calls++;};
 assert.equal((await handleLemonWebhook(request(payload()),{},persist)).status,503);
 assert.equal((await handleLemonWebhook(request(payload(),"forged"),env,persist)).status,401);
 assert.equal((await handleLemonWebhook(request("{"),env,persist)).status,422);
 assert.equal((await handleLemonWebhook(request("a".repeat(65537)),env,persist)).status,413);
 assert.equal(calls,0);
});
test("webhook awaits committed persistence and returns retryable errors",async()=>{
 let completed=false;
 const result=await handleLemonWebhook(request(payload()),env,async order=>{assert.equal(order.user_id,userId);await Promise.resolve();completed=true;});
 assert.equal(completed,true); assert.equal(result.status,200);
 assert.equal((await handleLemonWebhook(request(payload()),env,async()=>{throw Error("db");})).status,503);
});
test("unsupported signed event is ignored, unsigned event is not trusted",async()=>{
 const event=payload(); event.meta.event_name="customer_updated";
 assert.equal((await handleLemonWebhook(request(event),env,async()=>{assert.fail();})).status,200);
});
test("configuration requires explicit provider identifiers, mode and positive threshold",()=>{
 for(const key of Object.keys(env).filter(x=>x!=="LEMON_SQUEEZY_WEBHOOK_SECRET")) assert.equal(lemonConfig({...env,[key]:""}),null,key);
 assert.equal(lemonConfig({...env,LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR:"NaN"}),null);
});
for(const [name,mutate] of [
 ["wrong store",p=>p.data.attributes.store_id=2],
 ["wrong variant",p=>p.data.attributes.first_order_item.variant_id=20],
 ["test order in live",p=>p.data.attributes.test_mode=true],
 ["test metadata in live",p=>p.meta.test_mode=true],
 ["wrong currency",p=>p.data.attributes.currency="USD"],
 ["underpaid",p=>p.data.attributes.total=1],
 ["free",p=>p.data.attributes.total=0],
 ["fractional money",p=>p.data.attributes.total=5000.5],
 ["forged account",p=>p.meta.custom_data.account_id="20000000-0000-4000-8000-000000000002"],
 ["unsigned account",p=>delete p.meta.custom_data.account_binding],
 ["invalid timestamp",p=>p.data.attributes.updated_at="tomorrow"],
 ["missing refund marker",p=>delete p.data.attributes.refunded],
]) test(name+" is rejected",()=>{const p=payload();mutate(p);assert.throws(()=>normalize(p));});
test("unpaid/fraud/refund states never normalize to paid",()=>{
 for(const status of ["pending","failed","fraudulent","refunded","partial_refund"]){
 const p=payload();p.data.attributes.status=status;assert.notEqual(normalize(p).state,"paid");
 }
 const p=payload();p.data.attributes.refunded_amount=1;assert.equal(normalize(p).state,"refunded");
 p.meta.event_name="order_refunded";delete p.meta.custom_data;assert.equal(normalize(p).state,"refunded");
});
test("a test-bound account HMAC cannot be replayed into a live order",()=>{
 const p=payload();p.meta.custom_data.account_binding=accountBinding(userId,{...config,testMode:true});assert.throws(()=>normalize(p));
});
test("access allows pre-launch only on an explicitly missing migration; outages deny",()=>{
 assert.equal(paidAccessDecision(null,"PGRST202",false).allowed,true);
 for(const code of ["PGRST202","TIMEOUT","42501"]) assert.equal(paidAccessDecision(null,code,true).allowed,false);
 assert.equal(paidAccessDecision(null,"TIMEOUT",false).allowed,false);
 assert.equal(paidAccessDecision({state:"pending",enforced:false,allowed:true},undefined,false).allowed,true);
 assert.equal(paidAccessDecision({state:"pending",enforced:false,allowed:true},undefined,true).allowed,false);
 for(const state of ["pending","refunded"]) assert.equal(paidAccessDecision({state,enforced:true,allowed:false},undefined,true).allowed,false);
});
test("Meta purchase requires a validated non-test persisted purchase",()=>{
 const good={state:"verified",allowed:true,enforced:true,purchase:{id:userId,total_minor:5000,currency:"GBP",test_mode:false}};
 assert.deepEqual(verifiedPurchaseEvent(parseLifetimeStatus(good)),{eventId:"bcos-lifetime-"+userId,value:50,currency:"GBP"});
 for(const state of ["pending","refunded","unavailable"]) assert.equal(verifiedPurchaseEvent(parseLifetimeStatus({...good,state})),null);
 assert.equal(verifiedPurchaseEvent(parseLifetimeStatus({...good,purchase:{...good.purchase,test_mode:true}})),null);
 assert.equal(verifiedPurchaseEvent(parseLifetimeStatus({...good,purchase:null})),null);
 assert.equal(verifiedPurchaseEvent(parseLifetimeStatus({state:"pending",enforced:false,allowed:true})),null);
});

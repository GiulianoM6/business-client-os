"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type ModuleSlug = "projects" | "tasks" | "follow-ups" | "money" | "invoices";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type ClientOption = { id:string; name:string };
type ProjectOption = { id:string; name:string };
type Currency = "GBP" | "EUR" | "USD";

function formatMoney(value:number,currency:string){
  try{return new Intl.NumberFormat("en-GB",{style:"currency",currency,maximumFractionDigits:0}).format(value)}catch{return `${currency} ${value.toLocaleString()}`}
}

const config = {
  projects: { eyebrow:"Delivery", title:"Projects", description:"Track active work, deadlines and progress.", action:"New project", table:"projects" },
  tasks: { eyebrow:"Focus", title:"Tasks", description:"Keep priorities, deadlines and completion in one place.", action:"Add task", table:"tasks" },
  "follow-ups": { eyebrow:"Relationships", title:"Follow-ups", description:"Keep important conversations moving at the right time.", action:"Schedule follow-up", table:"followups" },
  money: { eyebrow:"Financial overview", title:"Money", description:"Track real income and expenses for this workspace.", action:"Add entry", table:"money_entries" },
  invoices: { eyebrow:"Billing", title:"Invoices", description:"Create invoices and keep payment status visible.", action:"New invoice", table:"invoices" },
} as const;

function blank(slug:ModuleSlug, defaultCurrency:Currency):Row {
  if(slug==="projects") return {name:"",client_id:"",status:"planned",due_date:"",notes:""};
  if(slug==="tasks") return {title:"",project_id:"",client_id:"",status:"todo",priority:"normal",due_at:"",notes:""};
  if(slug==="follow-ups") return {title:"",client_id:"",due_at:"",status:"pending",notes:""};
  if(slug==="money") return {direction:"income",amount:"0",currency:defaultCurrency,category:"Other",description:"",occurred_on:new Date().toISOString().slice(0,10)};
  return {number:"",client_id:"",amount:"0",currency:defaultCurrency,status:"draft",issue_date:new Date().toISOString().slice(0,10),due_date:"",notes:""};
}

export function OperationalManager({slug,workspaceId,initialRows,clients,projects=[],defaultCurrency="GBP"}:{slug:ModuleSlug;workspaceId:string;initialRows:Row[];clients:ClientOption[];projects?:ProjectOption[];defaultCurrency?:Currency}) {
  const c=config[slug];
  const [rows,setRows]=useState(initialRows);
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Row|null>(null);
  const [form,setForm]=useState<Row>(()=>blank(slug,defaultCurrency));
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const filtered=useMemo(()=>{const q=query.trim().toLowerCase(); if(!q)return rows; return rows.filter(r=>[r.name,r.title,r.number,r.description,r.category].some(v=>String(v??"").toLowerCase().includes(q)));},[rows,query]);
  const clientName=(id?:string)=>clients.find(c=>c.id===id)?.name;
  const projectName=(id?:string)=>projects.find(p=>p.id===id)?.name;

  function startCreate(){setEditing(null);setForm(blank(slug,defaultCurrency));setError(null);setOpen(true)}
  function startEdit(row:Row){setEditing(row); const next={...row}; if(next.due_at)next.due_at=String(next.due_at).slice(0,16); setForm(next);setError(null);setOpen(true)}

  function payload(){
    if(slug==="projects") return {name:String(form.name||"").trim(),client_id:form.client_id||null,status:form.status,due_date:form.due_date||null,notes:String(form.notes||"").trim()||null};
    if(slug==="tasks") return {title:String(form.title||"").trim(),project_id:form.project_id||null,client_id:form.client_id||null,status:form.status,priority:form.priority,due_at:form.due_at?new Date(form.due_at).toISOString():null,notes:String(form.notes||"").trim()||null};
    if(slug==="follow-ups") return {title:String(form.title||"").trim(),client_id:form.client_id||null,lead_id:null,due_at:form.due_at?new Date(form.due_at).toISOString():null,status:form.status,notes:String(form.notes||"").trim()||null};
    if(slug==="money") return {direction:form.direction,amount:Math.max(0,Math.round(Number(form.amount)||0)),currency:String(form.currency||"GBP").toUpperCase(),category:String(form.category||"Other").trim(),description:String(form.description||"").trim()||null,occurred_on:form.occurred_on};
    return {number:String(form.number||"").trim(),client_id:form.client_id||null,amount:Math.max(0,Math.round(Number(form.amount)||0)),currency:String(form.currency||"GBP").toUpperCase(),status:form.status,issue_date:form.issue_date||null,due_date:form.due_date||null,notes:String(form.notes||"").trim()||null};
  }

  async function save(e:FormEvent){e.preventDefault();setPending(true);setError(null);const supabase=createClient();const p=payload();
    const required=slug==="projects"?p.name:slug==="tasks"||slug==="follow-ups"?p.title:slug==="invoices"?p.number:true;
    if(!required){setError("Please complete the required field.");setPending(false);return}
    if(slug==="follow-ups"&&!p.due_at){setError("A follow-up date is required.");setPending(false);return}
    if(editing){
      const {data,error}=await supabase.from(c.table).update(p).eq("id",editing.id).eq("workspace_id",workspaceId).select("*").single();
      if(error){setError(error.message);setPending(false);return} setRows(r=>r.map(x=>x.id===data.id?data:x));
    }else{
      const {data:auth}=await supabase.auth.getUser(); if(!auth.user){setError("Your session expired.");setPending(false);return}
      const {data,error}=await supabase.from(c.table).insert({...p,workspace_id:workspaceId,created_by:auth.user.id}).select("*").single();
      if(error){setError(error.message);setPending(false);return} setRows(r=>[data,...r]);
    }
    setPending(false);setOpen(false);
  }

  async function remove(row:Row){if(!window.confirm("Delete this item? This cannot be undone."))return;const supabase=createClient();const {error}=await supabase.from(c.table).delete().eq("id",row.id).eq("workspace_id",workspaceId);if(error)return window.alert(error.message);setRows(r=>r.filter(x=>x.id!==row.id))}
  async function quickDone(row:Row){
    const status=slug==="tasks"?"done":slug==="follow-ups"?"done":null;if(!status)return;
    const supabase=createClient();const {data,error}=await supabase.from(c.table).update({status}).eq("id",row.id).eq("workspace_id",workspaceId).select("*").single();
    if(error)return window.alert(error.message);setRows(r=>r.map(x=>x.id===data.id?data:x));
  }

  const moneyIncome=slug==="money"?rows.filter(r=>r.direction==="income"&&r.currency===defaultCurrency).reduce((s,r)=>s+Number(r.amount||0),0):0;
  const moneyExpense=slug==="money"?rows.filter(r=>r.direction==="expense"&&r.currency===defaultCurrency).reduce((s,r)=>s+Number(r.amount||0),0):0;

  return <div className="page-enter space-y-7">
    <PageHeading eyebrow={c.eyebrow} title={c.title} description={c.description} action={<Button onClick={startCreate}><Plus/>{c.action}</Button>}/>
    <section className="grid gap-4 sm:grid-cols-3">
      <Card className="p-5"><p className="text-xs text-muted-foreground">Total</p><p className="mt-3 text-3xl font-semibold">{rows.length}</p></Card>
      {slug==="money"?<><Card className="p-5"><p className="text-xs text-muted-foreground">Income</p><p className="mt-3 text-3xl font-semibold">{formatMoney(moneyIncome,defaultCurrency)}</p></Card><Card className="p-5"><p className="text-xs text-muted-foreground">Net</p><p className="mt-3 text-3xl font-semibold">{formatMoney(moneyIncome-moneyExpense,defaultCurrency)}</p></Card></>:<>
      <Card className="p-5"><p className="text-xs text-muted-foreground">Active / open</p><p className="mt-3 text-3xl font-semibold">{rows.filter(r=>!["done","completed","cancelled","paid","void"].includes(r.status)).length}</p></Card>
      <Card className="p-5"><p className="text-xs text-muted-foreground">Completed / paid</p><p className="mt-3 text-3xl font-semibold">{rows.filter(r=>["done","completed","paid"].includes(r.status)).length}</p></Card></>}
    </section>
    <Card className="overflow-hidden">
      <div className="border-b bg-[#fbfcfa] p-4"><div className="flex max-w-md items-center gap-2 rounded-xl border bg-white px-3 py-2.5"><Search className="size-4 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${c.title.toLowerCase()}`} className="w-full bg-transparent text-xs outline-none"/></div></div>
      {!filtered.length?<div className="px-6 py-14 text-center"><p className="text-sm font-semibold">No {c.title.toLowerCase()} yet.</p><Button className="mt-5" onClick={startCreate}><Plus/>{c.action}</Button></div>:
      <div>{filtered.map(row=><div key={row.id} className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{row.name||row.title||row.number||row.description||row.category}</p><p className="mt-1 text-[11px] text-muted-foreground">{clientName(row.client_id)||projectName(row.project_id)||row.category||row.occurred_on||"Workspace item"}</p></div>
        {row.amount!==undefined&&<p className="text-xs font-semibold">{formatMoney(Number(row.amount),row.currency||defaultCurrency)}</p>}
        {row.status&&<Badge className="w-fit text-muted-foreground">{row.status}</Badge>}
        {row.direction&&<Badge className="w-fit text-muted-foreground">{row.direction}</Badge>}
        {(slug==="tasks"||slug==="follow-ups")&&row.status!=="done"&&<Button variant="outline" size="sm" onClick={()=>quickDone(row)}><Check/>Done</Button>}
        <Button variant="outline" size="sm" onClick={()=>startEdit(row)}><MoreHorizontal/>Edit</Button>
        <Button variant="ghost" size="icon" onClick={()=>remove(row)}><Trash2/></Button>
      </div>)}</div>}
    </Card>
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={e=>{if(e.currentTarget===e.target&&!pending)setOpen(false)}}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{editing?"Edit":"Create"}</p><h2 className="mt-2 text-2xl font-semibold">{editing?"Update item":c.action}</h2></div><Button variant="ghost" size="icon" onClick={()=>setOpen(false)}><X/></Button></div>
        <form onSubmit={save} className="mt-6 space-y-4"><Fields slug={slug} form={form} setForm={setForm} clients={clients} projects={projects} defaultCurrency={defaultCurrency}/>
        {error&&<p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending?"Saving...":"Save"}</Button></div></form>
      </div>
    </div>}
  </div>
}

function Fields({slug,form,setForm,clients,projects,defaultCurrency}:{slug:ModuleSlug;form:Row;setForm:(v:Row)=>void;clients:ClientOption[];projects:ProjectOption[];defaultCurrency:Currency}){
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const set=(key:string,value:any)=>setForm({...form,[key]:value});
 const clientSelect=<Select label="Client" value={form.client_id||""} onChange={v=>set("client_id",v)} options={[["","No client"],...clients.map(c=>[c.id,c.name])]}/>;
 if(slug==="projects")return <><Field label="Project name" value={form.name||""} onChange={v=>set("name",v)} required/>{clientSelect}<Select label="Status" value={form.status} onChange={v=>set("status",v)} options={[["planned","Planned"],["active","Active"],["on_hold","On hold"],["completed","Completed"],["cancelled","Cancelled"]]}/><Field label="Due date" type="date" value={form.due_date||""} onChange={v=>set("due_date",v)}/><Notes value={form.notes||""} onChange={v=>set("notes",v)}/></>;
 if(slug==="tasks")return <><Field label="Task title" value={form.title||""} onChange={v=>set("title",v)} required/><Select label="Project" value={form.project_id||""} onChange={v=>set("project_id",v)} options={[["","No project"],...projects.map(p=>[p.id,p.name])]}/>{clientSelect}<div className="grid gap-4 sm:grid-cols-2"><Select label="Status" value={form.status} onChange={v=>set("status",v)} options={[["todo","To do"],["in_progress","In progress"],["done","Done"],["cancelled","Cancelled"]]}/><Select label="Priority" value={form.priority} onChange={v=>set("priority",v)} options={[["low","Low"],["normal","Normal"],["high","High"],["urgent","Urgent"]]}/></div><Field label="Due" type="datetime-local" value={form.due_at||""} onChange={v=>set("due_at",v)}/><Notes value={form.notes||""} onChange={v=>set("notes",v)}/></>;
 if(slug==="follow-ups")return <><Field label="Follow-up title" value={form.title||""} onChange={v=>set("title",v)} required/>{clientSelect}<Field label="Due" type="datetime-local" value={form.due_at||""} onChange={v=>set("due_at",v)} required/><Select label="Status" value={form.status} onChange={v=>set("status",v)} options={[["pending","Pending"],["done","Done"],["cancelled","Cancelled"]]}/><Notes value={form.notes||""} onChange={v=>set("notes",v)}/></>;
 if(slug==="money")return <><div className="grid gap-4 sm:grid-cols-2"><Select label="Type" value={form.direction} onChange={v=>set("direction",v)} options={[["income","Income"],["expense","Expense"]]}/><Field label="Amount" type="number" value={String(form.amount??0)} onChange={v=>set("amount",v)} required/></div><div className="grid gap-4 sm:grid-cols-2"><Select label="Currency" value={form.currency||defaultCurrency} onChange={v=>set("currency",v)} options={[["GBP","GBP (£)"],["EUR","EUR (€)"],["USD","USD ($)"]]}/><Field label="Category" value={form.category||""} onChange={v=>set("category",v)} required/></div><Field label="Date" type="date" value={form.occurred_on||""} onChange={v=>set("occurred_on",v)} required/><Field label="Description" value={form.description||""} onChange={v=>set("description",v)}/></>;
 return <><div className="grid gap-4 sm:grid-cols-2"><Field label="Invoice number" value={form.number||""} onChange={v=>set("number",v)} required/><Field label="Amount" type="number" value={String(form.amount??0)} onChange={v=>set("amount",v)} required/></div>{clientSelect}<div className="grid gap-4 sm:grid-cols-2"><Select label="Currency" value={form.currency||defaultCurrency} onChange={v=>set("currency",v)} options={[["GBP","GBP (£)"],["EUR","EUR (€)"],["USD","USD ($)"]]}/><Select label="Status" value={form.status} onChange={v=>set("status",v)} options={[["draft","Draft"],["sent","Sent"],["paid","Paid"],["void","Void"]]}/></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Issue date" type="date" value={form.issue_date||""} onChange={v=>set("issue_date",v)}/><Field label="Due date" type="date" value={form.due_date||""} onChange={v=>set("due_date",v)}/></div><Notes value={form.notes||""} onChange={v=>set("notes",v)}/></>;
}
function Field({label,value,onChange,type="text",required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label className="block"><span className="mb-2 block text-xs font-medium">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required} min={type==="number"?"0":undefined} className="w-full rounded-xl border px-3 py-3 text-sm outline-none"/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[][]}){return <label className="block"><span className="mb-2 block text-xs font-medium">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
function Notes({value,onChange}:{value:string;onChange:(v:string)=>void}){return <label className="block"><span className="mb-2 block text-xs font-medium">Notes</span><textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} className="w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none"/></label>}

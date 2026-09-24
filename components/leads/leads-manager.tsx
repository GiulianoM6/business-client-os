"use client";

import { FormEvent, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, Target, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type Currency = "GBP" | "EUR" | "USD";
type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
type LeadRow = {
  id:string; name:string; company:string|null; email:string|null; phone:string|null;
  status:LeadStatus; estimated_value:number; currency:string; notes:string|null; created_at:string
};

const statuses: LeadStatus[] = ["new","contacted","qualified","proposal","negotiation","won","lost"];

function formatMoney(value:number,currency:string){
  try{
    return new Intl.NumberFormat("en-GB",{style:"currency",currency,maximumFractionDigits:0}).format(value);
  }catch{
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function LeadsManager({
  workspaceId,
  initialLeads,
  defaultCurrency,
}: {
  workspaceId:string;
  initialLeads:LeadRow[];
  defaultCurrency:Currency;
}) {
  const emptyForm = { name:"", company:"", email:"", phone:"", status:"new" as LeadStatus, estimated_value:"0", currency:defaultCurrency, notes:"" };
  const [leads,setLeads]=useState(initialLeads);
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<LeadRow|null>(null);
  const [form,setForm]=useState(emptyForm);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const filtered=useMemo(()=>{const q=query.trim().toLowerCase(); return q ? leads.filter(l=>[l.name,l.company,l.email,l.phone].some(v=>v?.toLowerCase().includes(q))) : leads;},[leads,query]);
  const openLeads=leads.filter(l=>!["won","lost"].includes(l.status));
  const pipeline=openLeads.filter(l=>l.currency===defaultCurrency).reduce((sum,l)=>sum+l.estimated_value,0);

  function startCreate(){
    setEditing(null);
    setError(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(lead:LeadRow){
    setEditing(lead);
    setError(null);
    setForm({
      name:lead.name,
      company:lead.company??"",
      email:lead.email??"",
      phone:lead.phone??"",
      status:lead.status,
      estimated_value:String(lead.estimated_value??0),
      currency:(["GBP","EUR","USD"].includes(lead.currency)?lead.currency:defaultCurrency) as Currency,
      notes:lead.notes??"",
    });
    setOpen(true);
  }

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!form.name.trim()) return setError("Lead name is required.");

    setPending(true);
    setError(null);
    const supabase=createClient();
    const value=Math.max(0,Math.round(Number(form.estimated_value)||0));

    const payload={
      name:form.name.trim(),
      company:form.company.trim()||null,
      email:form.email.trim()||null,
      phone:form.phone.trim()||null,
      status:form.status,
      estimated_value:value,
      currency:form.currency,
      notes:form.notes.trim()||null,
    };

    if(editing){
      const {data,error:updateError}=await supabase
        .from("leads")
        .update(payload)
        .eq("id",editing.id)
        .eq("workspace_id",workspaceId)
        .select("*")
        .single();

      if(updateError){setError(updateError.message);setPending(false);return;}
      setLeads(current=>current.map(lead=>lead.id===data.id?data:lead));
    }else{
      const {data:authData}=await supabase.auth.getUser();
      if(!authData.user){setError("Your session expired. Please sign in again.");setPending(false);return;}

      const {data,error:insertError}=await supabase
        .from("leads")
        .insert({...payload,workspace_id:workspaceId,created_by:authData.user.id})
        .select("*")
        .single();

      if(insertError){setError(insertError.message);setPending(false);return;}
      setLeads(current=>[data,...current]);
    }

    setPending(false);
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function changeStatus(lead:LeadRow,status:LeadStatus){
    const supabase=createClient();
    const {data,error}=await supabase.from("leads").update({status}).eq("id",lead.id).eq("workspace_id",workspaceId).select("*").single();
    if(error) return window.alert(error.message);
    setLeads(c=>c.map(l=>l.id===data.id?data:l));
  }

  async function remove(lead:LeadRow){
    if(!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;
    const supabase=createClient();
    const {error}=await supabase.from("leads").delete().eq("id",lead.id).eq("workspace_id",workspaceId);
    if(error) return window.alert(error.message);
    setLeads(c=>c.filter(l=>l.id!==lead.id));
  }

  return <div className="page-enter space-y-7">
    <PageHeading eyebrow="Pipeline" title="Leads" description="See every opportunity clearly and move conversations forward." action={<Button onClick={startCreate}><Plus/> Add lead</Button>} />
    <section className="grid gap-4 sm:grid-cols-3">
      <Card className="p-5"><p className="text-xs text-muted-foreground">Open opportunities</p><p className="mt-3 text-3xl font-semibold">{openLeads.length}</p></Card>
      <Card className="p-5"><p className="text-xs text-muted-foreground">Pipeline value</p><p className="mt-3 text-3xl font-semibold">{formatMoney(pipeline,defaultCurrency)}</p></Card>
      <Card className="p-5"><p className="text-xs text-muted-foreground">Won</p><p className="mt-3 text-3xl font-semibold">{leads.filter(l=>l.status==="won").length}</p></Card>
    </section>
    <Card className="overflow-hidden">
      <div className="border-b bg-[#fbfcfa] p-4"><div className="flex max-w-md items-center gap-2 rounded-xl border bg-white px-3 py-2.5"><Search className="size-4 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search leads" className="w-full bg-transparent text-xs outline-none"/></div></div>
      {filtered.length===0 ? <div className="px-6 py-14 text-center"><Target className="mx-auto size-8 text-muted-foreground"/><p className="mt-4 text-sm font-semibold">{leads.length?"No leads match your search.":"No leads yet."}</p>{!leads.length&&<Button className="mt-5" onClick={startCreate}><Plus/> Add first lead</Button>}</div> :
      <div>{filtered.map(lead=><div key={lead.id} className="grid gap-3 border-b px-5 py-4 last:border-b-0 md:grid-cols-[minmax(180px,1.4fr)_1fr_1fr_1fr_auto_auto] md:items-center">
        <div><p className="text-sm font-semibold">{lead.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{lead.company||lead.email||"No company or email"}</p></div>
        <select value={lead.status} onChange={e=>changeStatus(lead,e.target.value as LeadStatus)} className="rounded-xl border bg-white px-3 py-2 text-xs capitalize outline-none">{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <p className="text-xs font-semibold">{formatMoney(lead.estimated_value,lead.currency)}</p>
        <Badge className="w-fit text-muted-foreground">{lead.status}</Badge>
        <Button variant="outline" size="sm" onClick={()=>startEdit(lead)}><MoreHorizontal/> Edit</Button>
        <Button variant="ghost" size="icon" onClick={()=>remove(lead)} aria-label={`Delete ${lead.name}`}><Trash2/></Button>
      </div>)}</div>}
    </Card>
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={e=>{if(e.currentTarget===e.target&&!pending)setOpen(false)}}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{editing?"Edit opportunity":"New opportunity"}</p><h2 className="mt-2 text-2xl font-semibold">{editing?"Update lead":"Add a lead"}</h2></div><Button variant="ghost" size="icon" onClick={()=>setOpen(false)} disabled={pending}><X/></Button></div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <Field label="Lead name" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Company" value={form.company} onChange={v=>setForm({...form,company:v})}/><Field label="Email" type="email" value={form.email} onChange={v=>setForm({...form,email:v})}/><Field label="Phone" value={form.phone} onChange={v=>setForm({...form,phone:v})}/><Field label="Estimated value" type="number" value={form.estimated_value} onChange={v=>setForm({...form,estimated_value:v})}/></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-medium">Stage</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as LeadStatus})} className="w-full rounded-xl border px-3 py-3 text-sm">{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-xs font-medium">Currency</span><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value as Currency})} className="w-full rounded-xl border bg-white px-3 py-3 text-sm"><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option><option value="USD">USD ($)</option></select></label>
          </div>
          <label className="block"><span className="mb-2 block text-xs font-medium">Notes</span><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none"/></label>
          {error&&<p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={pending}>Cancel</Button><Button type="submit" disabled={pending}>{pending?"Saving...":editing?"Save changes":"Add lead"}</Button></div>
        </form>
      </div>
    </div>}
  </div>;
}

function Field({label,value,onChange,type="text",required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label className="block"><span className="mb-2 block text-xs font-medium">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required} min={type==="number"?"0":undefined} className="w-full rounded-xl border px-3 py-3 text-sm outline-none"/></label>}

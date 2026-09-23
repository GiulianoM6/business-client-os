"use client";
import { FormEvent, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

export function SettingsManager({workspaceId,initialName,role}:{workspaceId:string;initialName:string;role:string}){
 const [name,setName]=useState(initialName);const [pending,setPending]=useState(false);const [message,setMessage]=useState<string|null>(null);
 async function save(e:FormEvent){e.preventDefault();if(!name.trim())return;setPending(true);setMessage(null);const supabase=createClient();const {error}=await supabase.from("workspaces").update({name:name.trim()}).eq("id",workspaceId);setMessage(error?error.message:"Workspace settings saved.");setPending(false)}
 return <div className="page-enter space-y-7"><PageHeading eyebrow="Workspace" title="Settings" description="Manage the real workspace details and access." action={<Button form="settings-form" type="submit" disabled={pending||!["owner","admin"].includes(role)}><Save/>{pending?"Saving...":"Save changes"}</Button>}/>
 <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><Card><CardHeader className="border-b"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Business profile</p><h2 className="mt-2 text-lg font-semibold">Workspace details</h2></div></CardHeader><CardContent className="pt-6"><form id="settings-form" onSubmit={save} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-medium">Workspace name</span><input value={name} onChange={e=>setName(e.target.value)} disabled={!["owner","admin"].includes(role)} className="w-full rounded-xl border px-4 py-3 text-sm outline-none"/></label><label className="block"><span className="mb-2 block text-xs font-medium">Your role</span><div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm capitalize">{role}</div></label>{message&&<p className="rounded-xl border bg-muted/40 px-3 py-2 text-xs">{message}</p>}</form></CardContent></Card>
 <Card className="h-fit p-5"><div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Workspace protection</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Only owners and admins can change workspace settings. Database RLS still protects every request.</p></div></div></Card></div></div>
}

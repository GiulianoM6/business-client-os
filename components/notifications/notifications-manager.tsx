"use client";
import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type Notification={id:string;title:string;body:string|null;read_at:string|null;created_at:string};
export function NotificationsManager({workspaceId,initialNotifications}:{workspaceId:string;initialNotifications:Notification[]}){
 const [items,setItems]=useState(initialNotifications); const [pending,setPending]=useState(false);
 async function markAll(){setPending(true);const supabase=createClient();const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("workspace_id",workspaceId).is("read_at",null);if(error)window.alert(error.message);else setItems(x=>x.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));setPending(false)}
 async function markOne(n:Notification){if(n.read_at)return;const supabase=createClient();const now=new Date().toISOString();const {error}=await supabase.from("notifications").update({read_at:now}).eq("id",n.id).eq("workspace_id",workspaceId);if(error)return window.alert(error.message);setItems(x=>x.map(i=>i.id===n.id?{...i,read_at:now}:i))}
 const unread=items.filter(i=>!i.read_at).length;
 return <div className="page-enter space-y-7"><PageHeading eyebrow="Inbox" title="Notifications" description="Updates that deserve your attention." action={<Button onClick={markAll} disabled={pending||!unread}><CheckCircle2/>{pending?"Updating...":"Mark all read"}</Button>}/>
 <section className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><p className="text-xs text-muted-foreground">Unread</p><p className="mt-3 text-3xl font-semibold">{unread}</p></Card><Card className="p-5"><p className="text-xs text-muted-foreground">Total</p><p className="mt-3 text-3xl font-semibold">{items.length}</p></Card></section>
 <Card className="overflow-hidden">{!items.length?<div className="px-6 py-14 text-center"><Bell className="mx-auto size-8 text-muted-foreground"/><p className="mt-4 text-sm font-semibold">You are all caught up.</p><p className="mt-1 text-xs text-muted-foreground">New workspace events will appear here.</p></div>:items.map(n=><button key={n.id} onClick={()=>markOne(n)} className="flex w-full gap-4 border-b px-5 py-4 text-left last:border-b-0 hover:bg-muted/40"><span className={`mt-1 size-2 shrink-0 rounded-full ${n.read_at?"bg-muted":"bg-primary"}`}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{n.title}</p>{n.body&&<p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}<p className="mt-2 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p></div></button>)}</Card></div>
}

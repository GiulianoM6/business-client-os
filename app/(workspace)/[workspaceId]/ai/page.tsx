import { createClient } from "@/lib/supabase/server";
import { AICommandCenter } from "@/components/ai/ai-command-center";
export const metadata={title:"AI Command Center"}; export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{workspaceId:string}>}){const {workspaceId}=await params;if(workspaceId==="preview"){const {ModulePlaceholder}=await import("@/components/domain/module-placeholder");return <ModulePlaceholder slug="ai" workspaceId={workspaceId}/>;}const supabase=await createClient();const [clients,leads,projects,tasks,invoices]=await Promise.all([
supabase.from("clients").select("id",{count:"exact",head:true}).eq("workspace_id",workspaceId),
supabase.from("leads").select("id",{count:"exact",head:true}).eq("workspace_id",workspaceId).not("status","in","(won,lost)"),
supabase.from("projects").select("id",{count:"exact",head:true}).eq("workspace_id",workspaceId),
supabase.from("tasks").select("id,status,due_at").eq("workspace_id",workspaceId).not("status","in","(done,cancelled)"),
supabase.from("invoices").select("amount,status").eq("workspace_id",workspaceId)
]);const openTasks=tasks.data??[];const inv=invoices.data??[];const now=Date.now();return <AICommandCenter snapshot={{clients:clients.count??0,leads:leads.count??0,projects:projects.count??0,tasks:openTasks.length,overdueTasks:openTasks.filter(t=>t.due_at&&new Date(t.due_at).getTime()<now).length,invoices:inv.length,outstanding:inv.filter(i=>!["paid","void"].includes(i.status)).reduce((s,i)=>s+Number(i.amount||0),0)}}/>;}
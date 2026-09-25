"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Kind = "task" | "followup" | "lead" | "email";
const labels: Record<Kind,string> = {task:"Create task",followup:"Create follow-up",lead:"Review lead status",email:"Draft email"};
export function ActionProposals({workspaceId, answer}:{workspaceId:string;answer:string}) {
 const [kind,setKind]=useState<Kind>("task");
 const [title,setTitle]=useState("");
 const [details,setDetails]=useState("");
 const [reviewing,setReviewing]=useState(false);
 const [copied,setCopied]=useState(false);
 const [copyError,setCopyError]=useState(false);
 const targetModule = kind==="task"?"tasks":kind==="followup"?"follow-ups":"leads";
 const href = `/${workspaceId}/${targetModule}`;
 const draft = `${labels[kind]}: ${title}\n\n${details}`;
 async function copy(){try{await navigator.clipboard.writeText(draft);setCopied(true);setCopyError(false);}catch{setCopyError(true);}}
 return <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-label="Action proposals">
  <h2 className="text-lg font-semibold">Turn a next step into a proposal</h2>
  <p className="mt-2 text-sm leading-6 text-muted-foreground">Prepare the details here. Review and save business changes in the relevant module. Email stays a draft; nothing is sent.</p>
  <div className="mt-5 flex flex-wrap gap-2">{(Object.keys(labels) as Kind[]).map(k=><Button key={k} variant={kind===k?"default":"outline"} size="sm" onClick={()=>{setKind(k);setReviewing(false);setCopied(false);}}>{labels[k]}</Button>)}</div>
  {!reviewing ? <div className="mt-5 space-y-4">
   <label className="block text-sm">{kind==="email"?"Subject":kind==="lead"?"Lead name and proposed status":"Title"}<input className="mt-2 w-full rounded-lg border bg-background p-3" maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} /></label>
   <label className="block text-sm">{kind==="email"?"Email draft":"Proposal details (include dates and relevant client)"}<textarea className="mt-2 w-full rounded-lg border bg-background p-3" rows={5} maxLength={4000} value={details} onChange={e=>setDetails(e.target.value)}/></label>
   <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setDetails(answer.slice(0,4000))}>Use assistant response</Button><Button disabled={!title.trim()||!details.trim()} onClick={()=>setReviewing(true)}>Review proposal</Button></div>
  </div> : <div className="mt-5 space-y-4" role="status">
   <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draft only · no changes saved</p>
   <h3 className="font-semibold">{title}</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{details}</p>
   <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setReviewing(false)}>Edit proposal</Button><Button onClick={()=>void copy()}>{copied?"Copied":"Copy proposal"}</Button>{kind!=="email"&&<Button asChild><Link href={href}>Open {targetModule} to review and save</Link></Button>}</div>
   {copyError&&<p className="text-sm">Copy is unavailable. Select the proposal text to copy it manually.</p>}
   <p className="text-xs leading-5 text-muted-foreground">{kind==="email"?"No email provider is connected to this draft flow. Review the recipient and content in your email app before sending.":"Copy the proposal, open the module and review the exact fields. Only the module’s Save button commits the change. This proposal is kept in this tab only."}</p>
  </div>}
 </section>;
}

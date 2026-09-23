"use client";

import { FormEvent, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, Trash2, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "archived";
  notes: string | null;
  created_at: string;
};

const emptyForm = { name: "", company: "", email: "", phone: "", status: "active", notes: "" };

export function ClientsManager({ workspaceId, initialClients }: { workspaceId: string; initialClients: ClientRow[] }) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email, client.phone].some((value) => value?.toLowerCase().includes(q))
    );
  }, [clients, query]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function startEdit(client: ClientRow) {
    setEditing(client);
    setForm({
      name: client.name,
      company: client.company ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      status: client.status,
      notes: client.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return setError("Client name is required.");
    setPending(true);
    setError(null);
    const supabase = createClient();

    if (editing) {
      const { data, error: updateError } = await supabase
        .from("clients")
        .update({
          name: form.name.trim(),
          company: form.company.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          status: form.status,
          notes: form.notes.trim() || null,
        })
        .eq("id", editing.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();

      if (updateError) {
        setError(updateError.message);
        setPending(false);
        return;
      }
      setClients((current) => current.map((item) => (item.id === data.id ? data : item)));
    } else {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Your session expired. Please sign in again.");
        setPending(false);
        return;
      }
      const { data, error: insertError } = await supabase
        .from("clients")
        .insert({
          workspace_id: workspaceId,
          created_by: authData.user.id,
          name: form.name.trim(),
          company: form.company.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          status: form.status,
          notes: form.notes.trim() || null,
        })
        .select("*")
        .single();

      if (insertError) {
        setError(insertError.message);
        setPending(false);
        return;
      }
      setClients((current) => [data, ...current]);
    }

    setPending(false);
    setOpen(false);
  }

  async function remove(client: ClientRow) {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id)
      .eq("workspace_id", workspaceId);
    if (deleteError) return window.alert(deleteError.message);
    setClients((current) => current.filter((item) => item.id !== client.id));
  }

  const activeCount = clients.filter((client) => client.status === "active").length;

  return (
    <div className="page-enter space-y-7">
      <PageHeading
        eyebrow="Relationship hub"
        title="Clients"
        description="Keep every relationship and conversation connected."
        action={<Button onClick={startCreate}><Plus /> Add client</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs text-muted-foreground">Total clients</p><p className="mt-3 text-3xl font-semibold">{clients.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-muted-foreground">Active clients</p><p className="mt-3 text-3xl font-semibold">{activeCount}</p></Card>
        <Card className="p-5"><p className="text-xs text-muted-foreground">Inactive / archived</p><p className="mt-3 text-3xl font-semibold">{clients.length - activeCount}</p></Card>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b bg-[#fbfcfa] p-4">
          <div className="flex max-w-md items-center gap-2 rounded-xl border bg-white px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients, companies or contacts" className="w-full bg-transparent text-xs outline-none" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm font-semibold">{clients.length ? "No clients match your search." : "No clients yet."}</p>
            <p className="mt-1 text-xs text-muted-foreground">{clients.length ? "Try another search." : "Add your first real client to this workspace."}</p>
            {!clients.length && <Button className="mt-5" onClick={startCreate}><Plus /> Add first client</Button>}
          </div>
        ) : (
          <div>
            {filtered.map((client) => (
              <div key={client.id} className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9efe5] text-xs font-bold text-[#41684c]">
                  {client.name.split(" ").map((part) => part[0]).join("").slice(0,2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{client.company || client.email || "No company or email yet"}</p>
                </div>
                <Badge className={client.status === "active" ? "w-fit border-transparent bg-[#e7efe2] text-[#41684c]" : "w-fit text-muted-foreground"}>{client.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => startEdit(client)}><MoreHorizontal /> Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(client)} aria-label={`Delete ${client.name}`}><Trash2 /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onMouseDown={(e) => { if (e.currentTarget === e.target && !pending) setOpen(false); }}>
          <div className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{editing ? "Edit client" : "New client"}</p><h2 className="mt-2 text-2xl font-semibold">{editing ? editing.name : "Add a client"}</h2></div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} disabled={pending}><X /></Button>
            </div>
            <form onSubmit={save} className="mt-6 space-y-4">
              <Field label="Client name" value={form.name} onChange={(value) => setForm({...form, name:value})} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company" value={form.company} onChange={(value) => setForm({...form, company:value})} />
                <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({...form, email:value})} />
                <Field label="Phone" value={form.phone} onChange={(value) => setForm({...form, phone:value})} />
                <label className="block"><span className="mb-2 block text-xs font-medium">Status</span><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none"><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
              </div>
              <label className="block"><span className="mb-2 block text-xs font-medium">Notes</span><textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} rows={4} className="w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none" /></label>
              {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={pending}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving..." : editing ? "Save changes" : "Add client"}</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label:string; value:string; onChange:(value:string)=>void; type?:string; required?:boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium">{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} required={required} className="w-full rounded-xl border px-3 py-3 text-sm outline-none" /></label>;
}

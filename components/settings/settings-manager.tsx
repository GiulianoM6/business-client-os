"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type Currency = "GBP" | "EUR" | "USD";

export function SettingsManager({
  workspaceId,
  initialName,
  initialCurrency,
  role,
}: {
  workspaceId: string;
  initialName: string;
  initialCurrency: Currency;
  role: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = ["owner", "admin"].includes(role);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("workspaces")
      .update({ name: name.trim(), default_currency: currency })
      .eq("id", workspaceId);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Workspace settings saved.");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className="page-enter space-y-7">
      <PageHeading
        eyebrow="Workspace"
        title="Settings"
        description="Manage the real workspace details and access."
        action={
          <Button form="settings-form" type="submit" disabled={pending || !canEdit}>
            <Save />
            {pending ? "Saving..." : "Save changes"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                Business profile
              </p>
              <h2 className="mt-2 text-lg font-semibold">Workspace details</h2>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="settings-form" onSubmit={save} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium">Workspace name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium">Default currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  New leads, money entries and invoices use this currency by default. No automatic FX conversion is applied.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium">Your role</span>
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm capitalize">{role}</div>
              </label>

              {message && (
                <p className="rounded-xl border bg-muted/40 px-3 py-2 text-xs">{message}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit p-5">
          <div className="flex gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Workspace protection</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Only owners and admins can change workspace settings. Database RLS still protects every request.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

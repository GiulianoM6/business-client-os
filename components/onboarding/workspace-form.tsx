"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function WorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspaceName = name.trim();

    if (!workspaceName) {
      setError("Enter a workspace name.");
      return;
    }

    setPending(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_workspace", {
      workspace_name: workspaceName,
    });

    if (rpcError) {
      setError(rpcError.message);
      setPending(false);
      return;
    }

    if (!data) {
      setError("Workspace creation did not return an ID.");
      setPending(false);
      return;
    }

    router.push(`/${data}/dashboard`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="workspace-name" className="text-sm font-medium">
          Business name
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
          <Building2 className="size-5 text-muted-foreground" />
          <input
            id="workspace-name"
            name="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Acme Studio"
            autoComplete="organization"
            maxLength={100}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={pending}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { BrainCircuit, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/domain/page-heading";

type Snapshot = {
  clients: number;
  leads: number;
  projects: number;
  tasks: number;
  overdueTasks: number;
  invoices: number;
  outstanding: number;
  currency: string;
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function AICommandCenter({
  workspaceId,
  snapshot,
}: {
  workspaceId: string;
  snapshot: Snapshot;
}) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState(
    `Your workspace currently has ${snapshot.clients} clients, ${snapshot.leads} open leads, ${snapshot.projects} projects and ${snapshot.tasks} open tasks. Ask me what needs attention next.`,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function askQuestion(question: string) {
    const q = question.trim();
    if (!q || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, question: q }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "AI request failed.");
        return;
      }

      setAnswer(data.answer);
      setInput("");
    } catch {
      setError("Could not reach the AI service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void askQuestion(input);
  }

  const suggestions = [
    "What do I need to do today?",
    "Which leads need attention?",
    "Which invoices are overdue?",
    "Summarize my business right now",
  ];

  return (
    <div className="page-enter space-y-7">
      <PageHeading
        eyebrow="Business intelligence"
        title="AI Command Center"
        description="Ask questions grounded in the live data from this workspace."
        action={
          <Button
            onClick={() => {
              setInput("");
              setError(null);
              setAnswer("New conversation started. What would you like to know about your business?");
            }}
          >
            <Sparkles />
            New conversation
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[24px] border bg-[#1b2b27] p-7 text-white">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <BrainCircuit />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[.14em] text-[#9fb0a6]">Live workspace assistant</p>
            <h2 className="mt-2 text-2xl font-semibold">Context → insight → action</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#c4d0c9]">
              {pending ? "Thinking through your workspace data..." : answer}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground">Open tasks</p>
          <p className="mt-2 text-2xl font-semibold">{snapshot.tasks}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{snapshot.overdueTasks} overdue</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground">Open leads</p>
          <p className="mt-2 text-2xl font-semibold">{snapshot.leads}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground">Clients</p>
          <p className="mt-2 text-2xl font-semibold">{snapshot.clients}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-muted-foreground">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(snapshot.outstanding, snapshot.currency)}</p>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
              Ask your business
            </p>
            <h2 className="mt-2 text-lg font-semibold">Workspace command</h2>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={pending}
                onClick={() => void askQuestion(question)}
                className="rounded-full border px-3 py-2 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={pending}
              maxLength={2000}
              placeholder="Ask about clients, leads, tasks, follow-ups, invoices or money..."
              className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none disabled:bg-muted"
            />
            <Button type="submit" disabled={pending || !input.trim()}>
              {pending ? "Thinking..." : "Ask AI"}
              <Send />
            </Button>
          </form>

          {error && (
            <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            AI is read-only in this version. It can analyze workspace data and draft text, but it cannot change or send anything without a future confirmation flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

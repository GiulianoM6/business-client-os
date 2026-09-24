import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string };
};

function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content ?? []) {
      if ((part?.type === "output_text" || part?.type === "text") && typeof part?.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = cleanText(body?.workspaceId);
    const question = cleanText(body?.question);

    if (!workspaceId || !question) {
      return NextResponse.json({ error: "Workspace and question are required." }, { status: 400 });
    }

    if (question.length > 2000) {
      return NextResponse.json({ error: "Question is too long." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const [
      workspaceResult,
      clientsResult,
      leadsResult,
      projectsResult,
      tasksResult,
      followupsResult,
      invoicesResult,
      moneyResult,
    ] = await Promise.all([
      supabase.from("workspaces").select("name,default_currency").eq("id", workspaceId).single(),
      supabase.from("clients").select("id,name,company,email,status,notes").eq("workspace_id", workspaceId).limit(100),
      supabase.from("leads").select("id,name,company,status,estimated_value,currency,notes,updated_at").eq("workspace_id", workspaceId).limit(100),
      supabase.from("projects").select("id,name,status,due_date,client_id,notes").eq("workspace_id", workspaceId).limit(100),
      supabase.from("tasks").select("id,title,status,priority,due_at,client_id,project_id,notes").eq("workspace_id", workspaceId).limit(150),
      supabase.from("followups").select("id,title,status,due_at,client_id,lead_id,notes").eq("workspace_id", workspaceId).limit(100),
      supabase.from("invoices").select("id,number,status,amount,currency,due_date,issue_date,client_id,notes").eq("workspace_id", workspaceId).limit(100),
      supabase.from("money_entries").select("id,direction,amount,currency,category,description,occurred_on").eq("workspace_id", workspaceId).limit(150),
    ]);

    const queryError = [
      workspaceResult.error,
      clientsResult.error,
      leadsResult.error,
      projectsResult.error,
      tasksResult.error,
      followupsResult.error,
      invoicesResult.error,
      moneyResult.error,
    ].find(Boolean);

    if (queryError || !workspaceResult.data) {
      return NextResponse.json({ error: queryError?.message ?? "Could not load workspace data." }, { status: 500 });
    }

    const context = {
      workspace: workspaceResult.data,
      today: new Date().toISOString(),
      clients: clientsResult.data ?? [],
      leads: leadsResult.data ?? [],
      projects: projectsResult.data ?? [],
      tasks: tasksResult.data ?? [],
      followups: followupsResult.data ?? [],
      invoices: invoicesResult.data ?? [],
      money_entries: moneyResult.data ?? [],
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const q = question.toLowerCase();
      const clients = clientsResult.data ?? [];
      const leads = leadsResult.data ?? [];
      const projects = projectsResult.data ?? [];
      const tasks = tasksResult.data ?? [];
      const followups = followupsResult.data ?? [];
      const invoices = invoicesResult.data ?? [];
      const currency = workspaceResult.data.default_currency ?? "GBP";
      const now = Date.now();

      const openTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.status));
      const overdueTasks = openTasks.filter(
        (task) => task.due_at && new Date(task.due_at).getTime() < now,
      );
      const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));
      const overdueInvoices = invoices.filter(
        (invoice) =>
          invoice.status === "sent" &&
          invoice.due_date &&
          new Date(invoice.due_date).getTime() < now,
      );
      const outstanding = invoices
        .filter(
          (invoice) =>
            !["paid", "void"].includes(invoice.status) &&
            invoice.currency === currency,
        )
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

      let answer =
        `Workspace snapshot: ${clients.length} clients, ${openLeads.length} open leads, ${projects.length} projects and ${openTasks.length} open tasks.`;

      if (q.includes("today") || q.includes("task") || q.includes("priority")) {
        answer =
          overdueTasks.length > 0
            ? `You have ${openTasks.length} open tasks and ${overdueTasks.length} overdue. Start with overdue work, then high and urgent priority tasks.`
            : `You have ${openTasks.length} open tasks and none are currently overdue. Review urgent and high-priority work first.`;
      } else if (q.includes("lead")) {
        answer = `You have ${openLeads.length} open leads. Review qualified, proposal and negotiation-stage leads first because they are closest to conversion.`;
      } else if (q.includes("invoice") || q.includes("money") || q.includes("revenue")) {
        answer = `You have ${overdueInvoices.length} overdue sent invoice${overdueInvoices.length === 1 ? "" : "s"} and ${currency} ${outstanding.toLocaleString()} outstanding in your workspace currency.`;
      } else if (q.includes("follow")) {
        const pending = followups.filter((item) => item.status === "pending").length;
        answer = `You have ${pending} pending follow-up${pending === 1 ? "" : "s"}. Open Follow-ups to review the nearest due conversations.`;
      } else if (q.includes("client")) {
        answer = `There are ${clients.length} clients in this workspace and ${projects.length} projects in the delivery workflow.`;
      } else if (q.includes("summar")) {
        answer = `Right now: ${clients.length} clients, ${openLeads.length} open leads, ${projects.length} projects, ${openTasks.length} open tasks, ${overdueInvoices.length} overdue invoices and ${currency} ${outstanding.toLocaleString()} outstanding.`;
      }

      return NextResponse.json({ answer, mode: "workspace-fallback" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const instructions = [
      "You are the read-only Business Client OS assistant.",
      "Answer using only the supplied workspace data. Never claim an action was completed.",
      "Do not invent clients, amounts, dates, invoices, tasks, leads, or activity.",
      "If information is missing, say so clearly.",
      "Prioritize concise, practical business guidance and concrete next actions.",
      "When discussing money, keep currencies separate. Never silently convert currencies.",
      "If asked to write a follow-up, draft the message but do not send or save it.",
      "The current integration is read-only: explain that edits require the user to use the relevant module.",
    ].join(" ");

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `WORKSPACE DATA:\n${JSON.stringify(context)}\n\nUSER QUESTION:\n${question}`,
              },
            ],
          },
        ],
        max_output_tokens: 700,
      }),
    });

    const payload = (await upstream.json()) as OpenAIResponsePayload;

    if (!upstream.ok) {
      const message =
        payload?.error?.message ||
        "The AI provider returned an error. Please try again.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const answer = extractResponseText(payload);
    if (!answer) {
      return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Could not process the AI request." }, { status: 500 });
  }
}

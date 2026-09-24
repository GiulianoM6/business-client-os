import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workspaceHref } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type LeadRow = {
  id: string;
  name: string;
  status: string;
  estimated_value: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  client_id: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  client_id: string | null;
  project_id: string | null;
};

type FollowupRow = {
  id: string;
  title: string;
  status: string;
  due_at: string;
  client_id: string | null;
  lead_id: string | null;
};

type InvoiceRow = {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  due_date: string | null;
  client_id: string | null;
  issue_date: string | null;
};

type MoneyRow = {
  id: string;
  direction: string;
  amount: number;
  currency: string;
  occurred_on: string;
};

function money(value: number, currency: string) {
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

function shortDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

export async function Dashboard({ workspaceId }: { workspaceId: string }) {
  const supabase = await createClient();

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
    supabase.from("workspaces").select("name,default_currency").eq("id", workspaceId).maybeSingle(),
    supabase.from("clients").select("id,name,status,created_at").eq("workspace_id", workspaceId),
    supabase.from("leads").select("id,name,status,estimated_value,currency,created_at,updated_at").eq("workspace_id", workspaceId),
    supabase.from("projects").select("id,name,status,due_date,client_id").eq("workspace_id", workspaceId),
    supabase.from("tasks").select("id,title,status,priority,due_at,client_id,project_id").eq("workspace_id", workspaceId),
    supabase.from("followups").select("id,title,status,due_at,client_id,lead_id").eq("workspace_id", workspaceId),
    supabase.from("invoices").select("id,number,status,amount,currency,due_date,client_id,issue_date").eq("workspace_id", workspaceId),
    supabase.from("money_entries").select("id,direction,amount,currency,occurred_on").eq("workspace_id", workspaceId),
  ]);

  const clients = (clientsResult.data ?? []) as ClientRow[];
  const leads = (leadsResult.data ?? []) as LeadRow[];
  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const followups = (followupsResult.data ?? []) as FollowupRow[];
  const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
  const moneyEntries = (moneyResult.data ?? []) as MoneyRow[];

  const workspaceName = workspaceResult.data?.name ?? "Your workspace";
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));
  const leadNames = new Map(leads.map((lead) => [lead.id, lead.name]));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  const primaryCurrency =
    moneyEntries[0]?.currency ?? invoices[0]?.currency ?? leads[0]?.currency ?? "GBP";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inSevenDays = new Date(startOfToday);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const activeClients = clients.filter((client) => client.status === "active").length;
  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const hotLeads = openLeads.filter((lead) => ["qualified", "proposal", "negotiation"].includes(lead.status));
  const pipelineValue = openLeads
    .filter((lead) => lead.currency === primaryCurrency)
    .reduce((sum, lead) => sum + Number(lead.estimated_value ?? 0), 0);

  const openProjects = projects.filter((project) => ["planned", "active", "on_hold"].includes(project.status));
  const dueProjectsThisWeek = openProjects.filter((project) => {
    if (!project.due_date) return false;
    const due = new Date(project.due_date);
    return due >= startOfToday && due <= inSevenDays;
  }).length;

  const outstandingInvoices = invoices.filter((invoice) => invoice.status === "sent");
  const outstanding = outstandingInvoices
    .filter((invoice) => invoice.currency === primaryCurrency)
    .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const overdueInvoices = outstandingInvoices.filter((invoice) => {
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < startOfToday;
  });

  const currentMonthIncome = moneyEntries
    .filter((entry) => entry.direction === "income" && entry.currency === primaryCurrency && new Date(entry.occurred_on) >= startOfMonth)
    .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  const previousMonthIncome = moneyEntries
    .filter((entry) => {
      const date = new Date(entry.occurred_on);
      return entry.direction === "income" && entry.currency === primaryCurrency && date >= startOfPreviousMonth && date < startOfMonth;
    })
    .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  const currentMonthExpenses = moneyEntries
    .filter((entry) => entry.direction === "expense" && entry.currency === primaryCurrency && new Date(entry.occurred_on) >= startOfMonth)
    .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);

  const revenueChange =
    previousMonthIncome > 0
      ? Math.round(((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100)
      : null;

  const priorities: Array<{ tone: string; label: string; title: string; meta: string; href: string }> = [];

  overdueInvoices
    .sort((a, b) => new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime())
    .slice(0, 2)
    .forEach((invoice) => {
      const client = invoice.client_id ? clientNames.get(invoice.client_id) : null;
      priorities.push({
        tone: "bg-[#fce8e4] text-[#9f3f34]",
        label: "Overdue",
        title: `Invoice #${invoice.number} is overdue`,
        meta: `${client ?? "Client"} · ${money(invoice.amount, invoice.currency)} outstanding`,
        href: workspaceHref(workspaceId, "invoices"),
      });
    });

  followups
    .filter((item) => item.status === "pending" && new Date(item.due_at) <= inSevenDays)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, Math.max(0, 3 - priorities.length))
    .forEach((item) => {
      const context =
        (item.client_id && clientNames.get(item.client_id)) ||
        (item.lead_id && leadNames.get(item.lead_id)) ||
        "Relationship";
      priorities.push({
        tone: "bg-[#fff1cf] text-[#8b6112]",
        label: new Date(item.due_at) < startOfToday ? "Overdue follow-up" : "Follow-up",
        title: item.title,
        meta: `${context} · ${shortDate(item.due_at)}`,
        href: workspaceHref(workspaceId, "follow-ups"),
      });
    });

  tasks
    .filter((task) => !["done", "cancelled"].includes(task.status) && ["urgent", "high"].includes(task.priority))
    .sort((a, b) => new Date(a.due_at ?? "2999-12-31").getTime() - new Date(b.due_at ?? "2999-12-31").getTime())
    .slice(0, Math.max(0, 3 - priorities.length))
    .forEach((task) => {
      const context =
        (task.project_id && projectNames.get(task.project_id)) ||
        (task.client_id && clientNames.get(task.client_id)) ||
        "Task";
      priorities.push({
        tone: "bg-[#e7efe2] text-[#41684c]",
        label: task.priority === "urgent" ? "Urgent task" : "High priority",
        title: task.title,
        meta: `${context} · ${shortDate(task.due_at)}`,
        href: workspaceHref(workspaceId, "tasks"),
      });
    });

  const upcomingDeadlines = [
    ...tasks
      .filter((task) => !["done", "cancelled"].includes(task.status) && task.due_at)
      .map((task) => ({
        date: task.due_at as string,
        title: task.title,
        context:
          (task.project_id && projectNames.get(task.project_id)) ||
          (task.client_id && clientNames.get(task.client_id)) ||
          "Task",
      })),
    ...followups
      .filter((item) => item.status === "pending")
      .map((item) => ({
        date: item.due_at,
        title: item.title,
        context:
          (item.client_id && clientNames.get(item.client_id)) ||
          (item.lead_id && leadNames.get(item.lead_id)) ||
          "Follow-up",
      })),
    ...openProjects
      .filter((project) => project.due_date)
      .map((project) => ({
        date: project.due_date as string,
        title: project.name,
        context: (project.client_id && clientNames.get(project.client_id)) || "Project",
      })),
  ]
    .filter((item) => {
      const date = new Date(item.date);
      return date >= startOfToday && date <= inSevenDays;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const stageData = ["qualified", "proposal", "negotiation"].map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
  const maxStageCount = Math.max(1, ...stageData.map((stage) => stage.count));

  const briefing =
    priorities[0]?.title
      ? `Start with “${priorities[0].title}”. You currently have ${hotLeads.length} high-intent leads, ${overdueInvoices.length} overdue invoices and ${openProjects.length} open projects.`
      : hotLeads.length > 0
        ? `Your pipeline is the clearest next opportunity: ${hotLeads.length} high-intent lead${hotLeads.length === 1 ? "" : "s"} are ready for attention.`
        : "Your workspace is clear right now. Add or schedule your next task, follow-up or lead to keep momentum visible.";

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="page-enter space-y-7">
      <section className="overflow-hidden rounded-[24px] border bg-[#1b2b27] text-white shadow-sm">
        <div className="relative grid gap-8 px-6 py-7 sm:px-8 sm:py-9 xl:grid-cols-[1.25fr_.75fr] xl:px-10">
          <div
            aria-hidden="true"
            className="workspace-grid absolute inset-y-0 right-0 w-1/2 opacity-[0.09] [mask-image:linear-gradient(to_right,transparent,black)]"
          />
          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/8 text-[#dce8df]">
                <span className="size-1.5 rounded-full bg-[#9ec48f]" />
                {workspaceName}
              </Badge>
              <span className="text-[11px] text-[#aebdb5]">{dateLabel}</span>
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#9fb0a6]">
              Business overview
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
              Here&apos;s what needs your attention today.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b8c5bd]">
              Live client, pipeline, delivery and cash data — distilled into the next moves that matter.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-[#dce8d4] text-[#20342a] hover:bg-[#cdddc4]">
                <Link href={workspaceHref(workspaceId, "ai")}>
                  Ask AI <Sparkles />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={workspaceHref(workspaceId, "tasks")}>
                  Review priorities <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#91a49a]">
                  Business briefing
                </p>
                <h2 className="mt-2 text-lg font-semibold">Your best next move</h2>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#dce8d4] text-[#294536]">
                <Sparkles className="size-4" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#d6e0da]">{briefing}</p>
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-[11px] text-[#93a69b]">
                Context → Insight → Priority → Action
              </span>
              <Link
                href={workspaceHref(workspaceId, "ai")}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#dce8d4]"
              >
                Open briefing <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business overview">
        {[
          {
            label: "Active clients",
            value: String(activeClients),
            change: `${clients.length} total clients`,
            icon: Users,
            slug: "clients" as const,
          },
          {
            label: "Hot leads",
            value: String(hotLeads.length),
            change: `${money(pipelineValue, primaryCurrency)} open pipeline`,
            icon: Target,
            slug: "leads" as const,
          },
          {
            label: "Outstanding",
            value: money(outstanding, primaryCurrency),
            change: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? "" : "s"} overdue`,
            icon: CircleDollarSign,
            slug: "money" as const,
          },
          {
            label: "Open projects",
            value: String(openProjects.length),
            change: `${dueProjectsThisWeek} due this week`,
            icon: FolderKanban,
            slug: "projects" as const,
          },
        ].map((item) => (
          <Link key={item.label} href={workspaceHref(workspaceId, item.slug)} className="group">
            <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-[30px] font-semibold tracking-[-0.04em]">{item.value}</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <item.icon className="size-4.5" strokeWidth={1.6} />
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4">
                <span className="text-[11px] text-muted-foreground">{item.change}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Today&apos;s priorities
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                What deserves your attention
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={workspaceHref(workspaceId, "tasks")}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {priorities.length ? (
              priorities.slice(0, 3).map((item, index) => (
                <Link
                  key={`${item.label}-${item.title}`}
                  href={item.href}
                  className="flex gap-4 border-b px-6 py-5 transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Badge className={`mb-2 border-transparent ${item.tone}`}>
                      {item.label}
                    </Badge>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="mx-auto size-7 text-[#547b62]" />
                <p className="mt-3 text-sm font-semibold">Nothing urgent right now</p>
                <p className="mt-1 text-xs text-muted-foreground">Your overdue invoices, follow-ups and high-priority tasks will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Revenue pulse
              </p>
              <h2 className="mt-2 text-lg font-semibold">{money(currentMonthIncome, primaryCurrency)} this month</h2>
            </div>
            {revenueChange !== null && (
              <span className="flex items-center gap-1 rounded-full bg-[#e7efe2] px-2.5 py-1 text-[11px] font-semibold text-[#41684c]">
                <TrendingUp className="size-3.5" />
                {revenueChange > 0 ? "+" : ""}{revenueChange}%
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-[11px] text-muted-foreground">Collected</p>
                <p className="mt-1 text-lg font-semibold">{money(currentMonthIncome, primaryCurrency)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-[11px] text-muted-foreground">Expenses</p>
                <p className="mt-1 text-lg font-semibold">{money(currentMonthExpenses, primaryCurrency)}</p>
              </div>
            </div>
            <div className="mt-5 border-t pt-5">
              <p className="text-[11px] text-muted-foreground">Outstanding invoices</p>
              <p className="mt-1 text-sm font-semibold">{money(outstanding, primaryCurrency)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Upcoming deadlines
              </p>
              <h2 className="mt-2 text-lg font-semibold">Next 7 days</h2>
            </div>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {upcomingDeadlines.length ? (
              upcomingDeadlines.map((item) => (
                <div key={`${item.date}-${item.title}`} className="flex items-center gap-4 rounded-xl px-2 py-3 hover:bg-muted">
                  <div className="flex min-w-16 shrink-0 flex-col items-center rounded-lg border bg-background px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">{shortDate(item.date)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.context}</p>
                  </div>
                  <Clock3 className="size-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="px-2 py-8 text-center text-xs text-muted-foreground">No deadlines in the next 7 days.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Pipeline snapshot
              </p>
              <h2 className="mt-2 text-lg font-semibold">{money(pipelineValue, primaryCurrency)} open value</h2>
            </div>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {stageData.map((stage) => (
                <div key={stage.status}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{stage.status}</span>
                    <span className="text-muted-foreground">{stage.count} lead{stage.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#547b62]"
                      style={{ width: `${Math.round((stage.count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={workspaceHref(workspaceId, "leads")}
              className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Open pipeline <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="rounded-2xl border bg-[#edf2e8] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#41684c] shadow-xs">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Live workspace data</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This dashboard is calculated from the clients, leads, projects, tasks, follow-ups, invoices and money entries in this workspace.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={workspaceHref(workspaceId, "clients")}>Open clients</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

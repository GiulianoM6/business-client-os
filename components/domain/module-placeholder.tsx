import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDollarSign,
  Clock3,
  FileText,
  FolderKanban,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { workspaceHref, type ModuleSlug } from "@/lib/navigation";
import { PageHeading } from "@/components/domain/page-heading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ModuleOnly = Exclude<ModuleSlug, "dashboard">;

const moduleCopy: Record<
  ModuleOnly,
  { eyebrow: string; title: string; description: string; action: string }
> = {
  clients: {
    eyebrow: "Relationship hub",
    title: "Clients",
    description: "Keep every relationship, project and conversation connected.",
    action: "Add client",
  },
  leads: {
    eyebrow: "Pipeline",
    title: "Leads",
    description: "See every opportunity clearly and know which conversation to move next.",
    action: "Add lead",
  },
  projects: {
    eyebrow: "Delivery",
    title: "Projects",
    description: "Track active work, deadlines and progress without losing the bigger picture.",
    action: "New project",
  },
  tasks: {
    eyebrow: "Focus",
    title: "Tasks",
    description: "A focused view of what needs doing, what is overdue and what can wait.",
    action: "Add task",
  },
  "follow-ups": {
    eyebrow: "Relationships",
    title: "Follow-ups",
    description: "Keep important conversations moving at exactly the right time.",
    action: "Schedule follow-up",
  },
  money: {
    eyebrow: "Financial overview",
    title: "Money",
    description: "Understand cash collected, money outstanding and where the business stands.",
    action: "Add entry",
  },
  invoices: {
    eyebrow: "Billing",
    title: "Invoices",
    description: "Create a professional billing flow and stay on top of what is paid or overdue.",
    action: "New invoice",
  },
  ai: {
    eyebrow: "Business intelligence",
    title: "AI Command Center",
    description: "Turn business context into insight, priority and clear next actions.",
    action: "New conversation",
  },
  notifications: {
    eyebrow: "Inbox",
    title: "Notifications",
    description: "Only the updates that deserve your attention, in one quiet place.",
    action: "Mark all read",
  },
  settings: {
    eyebrow: "Workspace",
    title: "Settings",
    description: "Shape the workspace around your business, team and preferences.",
    action: "Save changes",
  },
};

function Metric({
  label,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-[30px] font-semibold tracking-[-0.04em]">{value}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4.5" strokeWidth={1.6} />
        </span>
      </div>
      <p className="mt-5 border-t pt-4 text-[11px] text-muted-foreground">{meta}</p>
    </Card>
  );
}

function Toolbar({
  search = "Search",
  filter = "Filter",
}: {
  search?: string;
  filter?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b bg-[#fbfcfa] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs text-muted-foreground shadow-[0_1px_2px_rgba(20,40,30,0.03)] sm:max-w-sm">
        <Search className="size-4" />
        <span>{search}</span>
      </div>
      <Button variant="outline" size="sm">
        {filter}
        <ChevronRight className="size-3.5 rotate-90" />
      </Button>
    </div>
  );
}

function ClientsModule() {
  const rows = [
    ["Acme Studio", "Agency", "3 active", "£4,820", "2 days ago", "AS"],
    ["Northstar Labs", "Technology", "1 active", "£2,400", "Today", "NL"],
    ["Lumina Creative", "Design", "2 active", "£1,760", "Yesterday", "LC"],
    ["Horizon Works", "Consulting", "1 active", "£980", "5 days ago", "HW"],
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active clients" value="12" meta="+2 this month" icon={Users} />
        <Metric label="Client value" value="£18.4k" meta="Across active relationships" icon={CircleDollarSign} />
        <Metric label="Open projects" value="5" meta="1 due this week" icon={FolderKanban} />
        <Metric label="Need follow-up" value="3" meta="Oldest: 9 days" icon={Clock3} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search clients, companies or contacts" filter="All clients" />
        <div className="hidden grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_1fr_40px] gap-4 border-b px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid">
          <span>Client</span><span>Type</span><span>Projects</span><span>Value</span><span>Last contact</span><span />
        </div>
        <div>
          {rows.map(([name, type, projects, value, contact, initials]) => (
            <div key={name} className="grid gap-3 border-b px-5 py-4 last:border-b-0 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_1fr_40px] md:items-center md:px-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9efe5] text-xs font-bold text-[#41684c]">{initials}</span>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Primary relationship</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{type}</span>
              <span className="text-xs font-medium">{projects}</span>
              <span className="text-xs font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{contact}</span>
              <Button variant="ghost" size="icon" aria-label={`More options for ${name}`}><MoreHorizontal /></Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function LeadsModule() {
  const stages = [
    { name: "New", value: "£2,200", count: 2, leads: ["Aster & Co.", "Motive Studio"] },
    { name: "Qualified", value: "£3,400", count: 3, leads: ["North & Pine", "Atlas Studio", "Kova"] },
    { name: "Proposal", value: "£1,800", count: 1, leads: ["Beacon Labs"] },
    { name: "Negotiation", value: "£1,200", count: 1, leads: ["Nova Works"] },
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open pipeline" value="£8.6k" meta="7 active opportunities" icon={Target} />
        <Metric label="Needs follow-up" value="3" meta="Oldest untouched: 4 days" icon={Clock3} />
        <Metric label="Qualified" value="3" meta="£3,400 potential value" icon={CheckCircle2} />
        <Metric label="Won this month" value="£4.2k" meta="+18% vs last month" icon={TrendingUp} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search leads" filter="Pipeline view" />
        <div className="grid gap-4 p-4 lg:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage.name} className="rounded-2xl border bg-[#fafbf9] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-semibold">{stage.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{stage.count} leads · {stage.value}</p>
                </div>
                <Circle className="size-3 fill-[#9db59a] text-[#9db59a]" />
              </div>
              <div className="space-y-2">
                {stage.leads.map((lead, index) => (
                  <div key={lead} className="rounded-xl border bg-white p-3 shadow-[0_1px_2px_rgba(20,40,30,0.03)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold">{lead}</p>
                      <MoreHorizontal className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">£{(900 + index * 450).toLocaleString()} opportunity</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock3 className="size-3" /> Follow up in {index + 1}d
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ProjectsModule() {
  const projects = [
    ["Brand Sprint", "Acme Studio", "75%", "Due in 2 days", "6/8 tasks"],
    ["Website Launch", "Lumina Creative", "54%", "Due Friday", "7/13 tasks"],
    ["CRM Setup", "Northstar Labs", "32%", "Due Oct 4", "4/12 tasks"],
    ["Strategy Retainer", "Horizon Works", "88%", "Due Oct 8", "14/16 tasks"],
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active projects" value="5" meta="1 approaching deadline" icon={FolderKanban} />
        <Metric label="Tasks completed" value="31" meta="Across active projects" icon={CheckCircle2} />
        <Metric label="At risk" value="1" meta="Brand Sprint · due soon" icon={AlertCircle} />
        <Metric label="Delivery value" value="£12.9k" meta="Active project value" icon={CircleDollarSign} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search projects or clients" filter="Active projects" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {projects.map(([name, client, progress, due, tasks]) => (
            <div key={name} className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(20,40,30,0.03)]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf2e9] text-primary"><FolderKanban className="size-5" /></span>
                <Badge className="border-transparent bg-[#edf4e9] text-[#41684c]">Active</Badge>
              </div>
              <h3 className="mt-5 text-base font-semibold">{name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{client}</p>
              <div className="mt-5 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{progress}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[#547b62]" style={{ width: progress }} />
              </div>
              <div className="mt-5 flex items-center justify-between border-t pt-4 text-[11px] text-muted-foreground">
                <span>{tasks}</span>
                <span>{due}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function TasksModule() {
  const tasks = [
    ["Send Acme proposal follow-up", "Urgent", "Today", "Acme Studio"],
    ["Review Brand Sprint assets", "High", "Today", "Brand Sprint"],
    ["Prepare invoice #1043", "Normal", "Tomorrow", "Northstar Labs"],
    ["Website launch checklist", "High", "Friday", "Lumina Creative"],
    ["Update CRM project notes", "Normal", "Friday", "Northstar Labs"],
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Due today" value="4" meta="2 high priority" icon={CalendarDays} />
        <Metric label="Overdue" value="2" meta="Oldest: 2 days" icon={AlertCircle} />
        <Metric label="In progress" value="6" meta="Across 4 projects" icon={Clock3} />
        <Metric label="Completed" value="18" meta="This week" icon={CheckCircle2} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search tasks" filter="Today + upcoming" />
        <div>
          {tasks.map(([title, priority, due, context], index) => (
            <div key={title} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-white">
                {index === 4 ? <Check className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{context}</p>
              </div>
              <Badge className={priority === "Urgent" ? "hidden border-transparent bg-[#fce8e4] text-[#9f3f34] sm:inline-flex" : priority === "High" ? "hidden border-transparent bg-[#fff1cf] text-[#8b6112] sm:inline-flex" : "hidden text-muted-foreground sm:inline-flex"}>{priority}</Badge>
              <span className="w-20 text-right text-xs text-muted-foreground">{due}</span>
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function FollowUpsModule() {
  const items = [
    ["Acme Studio", "Proposal follow-up", "Today · 10:30", "4 days since last contact", "Urgent"],
    ["North & Pine", "Qualification check-in", "Today · 15:00", "2 days since last contact", "Due"],
    ["Horizon Works", "Retainer renewal", "Tomorrow · 11:00", "8 days since last contact", "Upcoming"],
    ["Atlas Studio", "Proposal feedback", "Friday · 09:30", "3 days since last contact", "Upcoming"],
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Due today" value="2" meta="1 urgent follow-up" icon={Clock3} />
        <Metric label="Upcoming" value="5" meta="Next 7 days" icon={CalendarDays} />
        <Metric label="Neglected" value="2" meta="No contact in 7+ days" icon={AlertCircle} />
        <Metric label="Completed" value="11" meta="This month" icon={CheckCircle2} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search clients or follow-ups" filter="All reminders" />
        <div className="p-4">
          <div className="space-y-3">
            {items.map(([client, title, due, meta, status]) => (
              <div key={`${client ?? ""}-${title ?? ""}`} className="flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2e9] text-primary"><Clock3 className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{client} · {meta}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium">{due}</p>
                    <Badge className={status === "Urgent" ? "mt-2 border-transparent bg-[#fce8e4] text-[#9f3f34]" : "mt-2 text-muted-foreground"}>{status}</Badge>
                  </div>
                  <Button variant="outline" size="sm">Open</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function MoneyModule() {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Collected this month" value="£7,640" meta="+18.4% vs last month" icon={TrendingUp} />
        <Metric label="Outstanding" value="£3,240" meta="Across 4 invoices" icon={CircleDollarSign} />
        <Metric label="Expenses" value="£1,860" meta="This month" icon={Wallet} />
        <Metric label="Net cash" value="£5,780" meta="Current month view" icon={CheckCircle2} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <Card>
          <CardHeader className="border-b">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cash flow</p><h2 className="mt-2 text-lg font-semibold">Money in vs money out</h2></div>
            <Badge className="text-muted-foreground">September</Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-52 items-end gap-3">
              {[54, 88, 62, 104, 78, 128, 92, 148, 116, 166, 142, 184].map((height, i) => (
                <div key={i} className="flex flex-1 items-end gap-1">
                  <div className="w-1/2 rounded-t-md bg-[#d7e6d0]" style={{ height: `${height}px` }} />
                  <div className="w-1/2 rounded-t-md bg-[#ece7dd]" style={{ height: `${Math.max(30, height * 0.45)}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-5 text-[11px] text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#7fa06f]" />Income</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c8bca9]" />Expenses</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Receivables</p><h2 className="mt-2 text-lg font-semibold">What is still owed</h2></div></CardHeader>
          <CardContent className="space-y-4 pt-6">
            {[["Acme Studio","£1,840","5 days overdue"],["Northstar Labs","£900","Due Friday"],["Atlas Studio","£500","Due Oct 2"]].map(([client,value,due])=>(
              <div key={client} className="flex items-center justify-between gap-3 border-b pb-4 last:border-b-0 last:pb-0">
                <div><p className="text-sm font-semibold">{client}</p><p className="mt-1 text-[11px] text-muted-foreground">{due}</p></div>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function InvoicesModule() {
  const rows = [
    ["#1042", "Acme Studio", "£1,840", "12 Sep", "Overdue"],
    ["#1041", "Northstar Labs", "£900", "18 Sep", "Sent"],
    ["#1040", "Lumina Creative", "£1,260", "08 Sep", "Paid"],
    ["#1039", "Horizon Works", "£740", "01 Sep", "Paid"],
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Outstanding" value="£3,240" meta="4 open invoices" icon={ReceiptText} />
        <Metric label="Overdue" value="£1,840" meta="1 invoice overdue" icon={AlertCircle} />
        <Metric label="Paid this month" value="£5,320" meta="6 invoices settled" icon={CheckCircle2} />
        <Metric label="Drafts" value="2" meta="£1,180 draft value" icon={FileText} />
      </section>

      <Card className="overflow-hidden">
        <Toolbar search="Search invoice or client" filter="All statuses" />
        <div className="hidden grid-cols-[.7fr_1.5fr_1fr_1fr_1fr_40px] gap-4 border-b px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid">
          <span>Invoice</span><span>Client</span><span>Amount</span><span>Issued</span><span>Status</span><span />
        </div>
        <div>
          {rows.map(([number, client, amount, issued, status]) => (
            <div key={number} className="grid gap-3 border-b px-5 py-4 last:border-b-0 md:grid-cols-[.7fr_1.5fr_1fr_1fr_1fr_40px] md:items-center md:px-6">
              <span className="text-xs font-semibold">{number}</span>
              <span className="text-sm font-medium">{client}</span>
              <span className="text-xs font-semibold">{amount}</span>
              <span className="text-xs text-muted-foreground">{issued}</span>
              <Badge className={status === "Overdue" ? "w-fit border-transparent bg-[#fce8e4] text-[#9f3f34]" : status === "Paid" ? "w-fit border-transparent bg-[#e7efe2] text-[#41684c]" : "w-fit text-muted-foreground"}>{status}</Badge>
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function AIModule() {
  const suggestions = [
    "What do I need to do today?",
    "Which leads have I neglected?",
    "Which invoices are overdue?",
    "Summarize my business this month.",
  ];

  return (
    <>
      <section className="overflow-hidden rounded-[24px] border bg-[#1b2b27] text-white shadow-sm">
        <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.15fr_.85fr] lg:px-9">
          <div className="workspace-grid absolute inset-y-0 right-0 w-1/2 opacity-[0.09]" />
          <div className="relative">
            <Badge className="border-white/10 bg-white/8 text-[#dce8df]"><Sparkles className="size-3" />Business-aware AI</Badge>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em]">Ask your business, not a generic chatbot.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#b8c5bd]">AI uses the context already inside Business Client OS to surface grounded priorities and propose safe next actions.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {suggestions.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] text-[#d5dfd9]">{item}</span>)}
            </div>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.055] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#91a49a]">Today&apos;s AI insight</p>
            <p className="mt-4 text-base font-semibold">Your highest-priority opportunity is Acme Studio.</p>
            <p className="mt-3 text-sm leading-6 text-[#d0dbd4]">Their £2,400 proposal has been waiting 4 days and their related invoice is overdue. Following up now protects both pipeline and cash flow.</p>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
              <Button className="bg-[#dce8d4] text-[#20342a] hover:bg-[#cdddc4]">Review action <ArrowRight /></Button>
              <Badge className="border-white/10 text-[#b8c5bd]">Requires approval</Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader className="border-b"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Command center</p><h2 className="mt-2 text-lg font-semibold">Ask anything about your business</h2></div><BrainCircuit className="size-5 text-primary" /></CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-2xl border bg-[#fafbf9] p-4">
              <p className="text-sm text-muted-foreground">Ask about clients, leads, deadlines, invoices or what deserves your attention next...</p>
              <div className="mt-8 flex items-center justify-between border-t pt-4">
                <span className="text-[11px] text-muted-foreground">Grounded in workspace data</span>
                <Button size="sm">Ask AI <Sparkles /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Safe actions</p><h2 className="mt-2 text-lg font-semibold">You stay in control</h2></div><ShieldCheck className="size-5 text-primary" /></CardHeader>
          <CardContent className="space-y-4 pt-6">
            {["Create a task proposal","Update a task proposal","Schedule a follow-up proposal"].map((item)=><div key={item} className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-[#edf2e9] text-primary"><Check className="size-4" /></span><div><p className="text-xs font-semibold">{item}</p><p className="mt-1 text-[10px] text-muted-foreground">Nothing changes until you approve it.</p></div></div>)}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function NotificationsModule() {
  const items = [
    ["Invoice #1042 is overdue", "Acme Studio · £1,840 outstanding", "8 min ago", AlertCircle],
    ["Brand Sprint is due in 2 days", "6 of 8 tasks complete", "32 min ago", CalendarDays],
    ["Lead needs follow-up", "North & Pine has had no contact for 4 days", "1 hr ago", Target],
    ["Invoice #1040 was marked paid", "Lumina Creative · £1,260", "Yesterday", CheckCircle2],
  ] as const;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Unread" value="3" meta="Since your last visit" icon={Bell} />
        <Metric label="Due today" value="2" meta="Work requiring attention" icon={Clock3} />
        <Metric label="Resolved" value="9" meta="This week" icon={CheckCircle2} />
      </section>
      <Card className="overflow-hidden">
        <div className="border-b bg-[#fbfcfa] px-5 py-4"><p className="text-sm font-semibold">Recent activity</p></div>
        <div>
          {items.map(([title,meta,time,Icon],index)=>(
            <div key={title} className="flex gap-4 border-b px-5 py-4 last:border-b-0">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-4.5" />{index<3 && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-white" />}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{meta}</p></div>
              <span className="text-[11px] text-muted-foreground">{time}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function SettingsModule() {
  const sections = [
    ["Business profile", "Workspace name, timezone and default currency", Building2],
    ["Team & permissions", "Members, roles and workspace access", Users],
    ["Notifications", "Choose which updates deserve your attention", Bell],
    ["AI preferences", "AI opt-in, limits and workspace intelligence", Sparkles],
    ["Security", "Sessions, sensitive actions and account safety", ShieldCheck],
  ] as const;

  return (
    <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
      <Card className="h-fit overflow-hidden">
        <div className="p-3">
          {sections.map(([title,desc,Icon],index)=>(
            <button key={title} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${index===0 ? "bg-muted" : "hover:bg-muted/70"}`}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-white"><Icon className="size-4 text-primary" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{desc}</span></span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader className="border-b"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Business profile</p><h2 className="mt-2 text-lg font-semibold">Workspace details</h2></div></CardHeader>
        <CardContent className="space-y-5 pt-6">
          {[["Workspace name","Business Client OS Demo"],["Business timezone","Europe/Bucharest"],["Default currency","GBP — British Pound"]].map(([label,value])=>(
            <label key={label} className="block">
              <span className="mb-2 block text-xs font-medium">{label}</span>
              <div className="rounded-xl border bg-[#fbfcfa] px-4 py-3 text-sm">{value}</div>
            </label>
          ))}
          <div className="rounded-2xl border bg-[#edf2e9] p-4">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Workspace protection</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Sensitive changes will require proper permissions and recent authentication once accounts are connected.</p></div></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function renderModule(slug: ModuleOnly) {
  switch (slug) {
    case "clients": return <ClientsModule />;
    case "leads": return <LeadsModule />;
    case "projects": return <ProjectsModule />;
    case "tasks": return <TasksModule />;
    case "follow-ups": return <FollowUpsModule />;
    case "money": return <MoneyModule />;
    case "invoices": return <InvoicesModule />;
    case "ai": return <AIModule />;
    case "notifications": return <NotificationsModule />;
    case "settings": return <SettingsModule />;
  }
}

export function ModulePlaceholder({
  slug,
}: {
  slug: ModuleOnly;
  workspaceId: string;
}) {
  const copy = moduleCopy[slug];

  return (
    <div className="page-enter space-y-7">
      <PageHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          <div className="flex items-center gap-2">
            <Badge className="hidden bg-card text-muted-foreground sm:inline-flex">
              Demo data
            </Badge>
            <Button>
              {slug === "notifications" ? <CheckCircle2 /> : slug === "settings" ? <Settings2 /> : slug === "ai" ? <Sparkles /> : <Plus />}
              {copy.action}
            </Button>
          </div>
        }
      />

      {renderModule(slug)}

      <section className="rounded-2xl border bg-[#edf2e9] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-[0_1px_2px_rgba(20,40,30,0.04)]">
              <Zap className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold">Visual demo mode</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                This interface uses illustrative data. Supabase will replace it with real workspace data in the next implementation phase.
              </p>
            </div>
          </div>
          {slug !== "ai" && (
            <Link
              href={workspaceHref(workspaceId, "ai")}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
            >
              Ask AI about this <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

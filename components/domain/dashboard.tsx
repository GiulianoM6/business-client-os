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

const priorities = [
  {
    tone: "bg-[#fce8e4] text-[#9f3f34]",
    label: "Overdue",
    title: "Invoice #1042 is 5 days overdue",
    meta: "Acme Studio · £1,840 outstanding",
  },
  {
    tone: "bg-[#fff1cf] text-[#8b6112]",
    label: "Follow-up",
    title: "3 leads need your attention",
    meta: "Highest value opportunity: £2,400",
  },
  {
    tone: "bg-[#e7efe2] text-[#41684c]",
    label: "Project",
    title: "Brand Sprint is due in 2 days",
    meta: "6 of 8 tasks completed",
  },
];

export function Dashboard({ workspaceId }: { workspaceId: string }) {
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
                Demo workspace
              </Badge>
              <span className="text-[11px] text-[#aebdb5]">
                Tuesday, 23 September
              </span>
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#9fb0a6]">
              Good morning
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
              Here&apos;s what needs your attention today.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b8c5bd]">
              Your clients, pipeline, delivery and cash position — distilled into
              the next moves that matter.
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
                  AI business briefing
                </p>
                <h2 className="mt-2 text-lg font-semibold">Your best next move</h2>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#dce8d4] text-[#294536]">
                <Sparkles className="size-4" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#d6e0da]">
              Follow up with Acme Studio first. Their £2,400 proposal has had no
              response for 4 days, while the related invoice is already overdue.
            </p>
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
            value: "12",
            change: "+2 this month",
            icon: Users,
            slug: "clients" as const,
          },
          {
            label: "Hot leads",
            value: "7",
            change: "£8,600 pipeline",
            icon: Target,
            slug: "leads" as const,
          },
          {
            label: "Outstanding",
            value: "£3,240",
            change: "2 invoices overdue",
            icon: CircleDollarSign,
            slug: "money" as const,
          },
          {
            label: "Open projects",
            value: "5",
            change: "1 due this week",
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
            {priorities.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 border-b px-6 py-5 last:border-b-0"
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
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Revenue pulse
              </p>
              <h2 className="mt-2 text-lg font-semibold">£9,480 this month</h2>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-[#e7efe2] px-2.5 py-1 text-[11px] font-semibold text-[#41684c]">
              <TrendingUp className="size-3.5" />
              18.4%
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-36 items-end gap-2" aria-label="Illustrative monthly revenue chart">
              {[34, 45, 40, 58, 54, 72, 66, 83, 79, 96, 88, 112].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-[#dce8d4]"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Sep 1</span>
              <span>Today</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5">
              <div>
                <p className="text-[11px] text-muted-foreground">Collected</p>
                <p className="mt-1 text-sm font-semibold">£7,640</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Outstanding</p>
                <p className="mt-1 text-sm font-semibold">£3,240</p>
              </div>
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
            {[
              ["Today", "Send proposal follow-up", "Northstar"],
              ["Thu", "Brand Sprint review", "Acme Studio"],
              ["Fri", "Website launch checklist", "Lumina Labs"],
            ].map(([date, title, client]) => (
              <div key={title} className="flex items-center gap-4 rounded-xl px-2 py-3 hover:bg-muted">
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border bg-background py-2">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">{date}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{client}</p>
                </div>
                <Clock3 className="size-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Pipeline snapshot
              </p>
              <h2 className="mt-2 text-lg font-semibold">£8,600 open value</h2>
            </div>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                ["Qualified", "3 leads", "72%"],
                ["Proposal", "2 leads", "52%"],
                ["Negotiation", "2 leads", "36%"],
              ].map(([stage, count, width]) => (
                <div key={stage}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">{stage}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[#547b62]" style={{ width }} />
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
              <h2 className="text-sm font-semibold">Demo data is active</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                These numbers are illustrative for the visual prototype. Real metrics will replace them once Supabase is connected.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={workspaceHref(workspaceId, "clients")}>Explore workspace</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

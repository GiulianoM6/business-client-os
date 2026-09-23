import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Circle,
  Clock3,
  FolderKanban,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/domain/page-heading";
import { EmptyState } from "@/components/domain/empty-state";
import { workspaceHref } from "@/lib/navigation";

export function Dashboard({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow="Your business, at a glance"
        title="Make room for your best work."
        description="A clear view of your clients, commitments, and what comes next."
        action={
          <Badge className="w-fit bg-card text-muted-foreground">
            Foundation preview
          </Badge>
        }
      />
      <section
        className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Business overview"
      >
        {(
          [
            {
              label: "Active clients",
              caption: "Relationships worth building",
              icon: Users,
              slug: "clients",
            },
            {
              label: "Open projects",
              caption: "Your work in motion",
              icon: FolderKanban,
              slug: "projects",
            },
            {
              label: "Upcoming follow-ups",
              caption: "Keep things moving forward",
              icon: Clock3,
              slug: "follow-ups",
            },
            {
              label: "Money overview",
              caption: "A clearer financial picture",
              icon: Wallet,
              slug: "money",
            },
          ] as const
        ).map((item) => (
          <Link
            key={item.slug}
            href={workspaceHref(workspaceId, item.slug)}
            className="group"
          >
            <Card className="h-full p-5 transition-colors hover:border-primary/35">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <item.icon
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <div
                className="my-5 text-3xl font-medium text-[#8b968e]"
                aria-label="No data connected"
              >
                —
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  {item.caption}
                </p>
                <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <section
          className="relative overflow-hidden rounded-xl border border-[#d7e1cc] bg-[#edf2e6] p-6 sm:p-8"
          aria-labelledby="next-move"
        >
          <div
            aria-hidden="true"
            className="workspace-grid absolute inset-y-0 right-0 w-1/3 opacity-45 [mask-image:linear-gradient(to_right,transparent,black)]"
          />
          <div className="relative">
            <div className="mb-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a654b]">
              <Sparkles className="size-4" />A little perspective
            </div>
            <h2
              id="next-move"
              className="max-w-md text-[27px] font-medium leading-tight tracking-[-0.04em]"
            >
              Your next move,
              <br />
              with the bigger picture in mind.
            </h2>
            <p className="mt-4 max-w-[350px] text-sm leading-6 text-[#60715c]">
              Bring your work together. Turn context into clarity, and clarity
              into your next meaningful action.
            </p>
            <Button asChild className="mt-7">
              <Link href={workspaceHref(workspaceId, "ai")}>
                Explore your command center <ArrowRight />
              </Link>
            </Button>
            <div className="mt-7 flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#62715d]">
              Context <ArrowRight className="size-3" /> Insight{" "}
              <ArrowRight className="size-3" /> Priority{" "}
              <ArrowRight className="size-3" /> Action
            </div>
          </div>
        </section>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold">
                Start with the essentials
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                A home for every part of your business.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {(
              [
                {
                  number: "01",
                  title: "Know your clients",
                  text: "Build your relationship hub",
                  slug: "clients",
                },
                {
                  number: "02",
                  title: "Organise your work",
                  text: "Give every commitment a place",
                  slug: "projects",
                },
                {
                  number: "03",
                  title: "Find your focus",
                  text: "Make the next step feel clear",
                  slug: "tasks",
                },
              ] as const
            ).map((item) => (
              <Link
                key={item.slug}
                href={workspaceHref(workspaceId, item.slug)}
                className="group flex items-center gap-3 rounded-lg py-4 transition-colors hover:bg-muted"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] text-muted-foreground">
                  {item.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {item.text}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
            <p className="border-t pt-4 text-[11px] leading-5 text-muted-foreground">
              Explore the workspace. Your business tools will be connected in a
              future release.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <div>
              <h2 className="text-sm font-semibold">Your focus</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The important things, with room to breathe.
              </p>
            </div>
            <Link
              href={workspaceHref(workspaceId, "tasks")}
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              View tasks <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <EmptyState
            icon={CheckCheck}
            title="A fresh start for your work"
            description="When tasks are connected, your upcoming commitments will find their place here."
          />
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">A workspace in balance</h2>
            <Circle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex h-24 items-end gap-2" aria-hidden="true">
              {[38, 60, 45, 80, 68, 92, 75, 100, 85, 110, 96, 125].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-[#e6ecdf]"
                    style={{ height: `${height / 1.4}px` }}
                  />
                ),
              )}
            </div>
            <Badge className="text-muted-foreground">
              Illustrative preview
            </Badge>
            <h3 className="mt-4 text-sm font-medium">
              The full picture starts here.
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              A place for progress, not just activity. Your real business
              overview will appear once your tools are connected.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

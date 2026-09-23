import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { navigation, workspaceHref, type ModuleSlug } from "@/lib/navigation";
import { PageHeading } from "@/components/domain/page-heading";
import { EmptyState } from "@/components/domain/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const details: Record<
  Exclude<ModuleSlug, "dashboard">,
  { title: string; body: string; features: readonly string[] }
> = {
  clients: {
    title: "A home for your relationships",
    body: "Your clients, contacts, and conversations will come together here. Client management is not connected in this preview.",
    features: ["Client directory", "Relationship context", "Connected work"],
  },
  leads: {
    title: "Make space for your next opportunity",
    body: "A considered pipeline for new conversations and future clients. Lead management will be connected in a future release.",
    features: ["Opportunity pipeline", "Contact history", "Client conversion"],
  },
  projects: {
    title: "Great work starts with a clear plan",
    body: "Your projects and commitments will live here. Project creation and tracking are not connected yet.",
    features: ["Project overview", "Milestones & dates", "Linked tasks"],
  },
  tasks: {
    title: "A little clarity for the day ahead",
    body: "A focused place for what needs doing, and what can wait. Task management is coming in a future release.",
    features: [
      "Focused task lists",
      "Priorities & due dates",
      "Team assignments",
    ],
  },
  "follow-ups": {
    title: "Keep meaningful conversations moving",
    body: "Your upcoming client and lead reminders will appear here. Follow-up scheduling is not connected yet.",
    features: ["Timely reminders", "Client context", "Follow-up history"],
  },
  money: {
    title: "Clarity for the business behind the work",
    body: "Income, expenses, and receivables will come together here. No financial data is connected to this preview.",
    features: ["Cash overview", "Income & expenses", "Currency clarity"],
  },
  invoices: {
    title: "Professional from first hello to final invoice",
    body: "Your drafts, issued invoices, and payment records will live here. Invoicing is not available in this preview.",
    features: ["Invoice drafts", "Payment tracking", "Printable invoices"],
  },
  ai: {
    title: "What should I do next?",
    body: "A future assistant grounded in your actual business context. AI is not connected, and no data is being sent to a model.",
    features: [
      "Grounded insights",
      "Clear priorities",
      "You approve every action",
    ],
  },
  notifications: {
    title: "A quieter place to stay in the loop",
    body: "Important updates and reminders will appear here once your workspace is connected. There are no live notifications yet.",
    features: ["Relevant updates", "Due-work reminders", "Your personal inbox"],
  },
  settings: {
    title: "Make this space your own",
    body: "Workspace preferences and team controls will live here. This public visual preview has no account, saved settings, or authentication.",
    features: ["Workspace preferences", "Team & permissions", "AI preferences"],
  },
};
export function ModulePlaceholder({
  slug,
  workspaceId,
}: {
  slug: Exclude<ModuleSlug, "dashboard">;
  workspaceId: string;
}) {
  const currentModule = navigation.find((item) => item.slug === slug)!;
  const detail = details[slug];
  return (
    <div className="page-enter">
      <PageHeading
        eyebrow={currentModule.group}
        title={currentModule.label}
        description={currentModule.description}
        action={
          <Badge className="w-fit bg-card text-muted-foreground">
            Foundation preview
          </Badge>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {detail.features.map((feature, i) => (
          <Card key={feature} className="flex items-center gap-4 p-5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
              0{i + 1}
            </span>
            <div>
              <p className="text-xs font-medium">{feature}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Planned for your workspace
              </p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <h2 className="text-sm font-medium">
            {slug === "ai"
              ? "From context to action"
              : `Your ${currentModule.label.toLowerCase()}`}
          </h2>
          <Badge className="text-muted-foreground">Not connected</Badge>
        </CardHeader>
        <div
          className={
            slug === "ai" ? "workspace-grid bg-[#f2f5ed] py-12" : "py-12"
          }
        >
          <EmptyState
            icon={currentModule.icon}
            title={detail.title}
            description={detail.body}
          >
            <Button variant="outline" asChild>
              <Link href={workspaceHref(workspaceId, "dashboard")}>
                <ArrowLeft /> Back to dashboard
              </Link>
            </Button>
          </EmptyState>
        </div>
      </Card>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-[#eef2e9] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <p className="text-xs leading-5 text-muted-foreground">
            Built around your business. Designed to bring the next step into
            focus.
          </p>
        </div>
        <Link
          href={workspaceHref(workspaceId, slug === "ai" ? "projects" : "ai")}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary"
        >
          {slug === "ai" ? "Explore projects" : "Explore the command center"}
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

import {
  LayoutDashboard,
  Users,
  Target,
  FolderKanban,
  CheckSquare2,
  Clock3,
  Wallet,
  ReceiptText,
  Sparkles,
  Bell,
  Settings2,
} from "lucide-react";

export const navigation = [
  {
    slug: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Workspace",
    description:
      "A clear view of what matters. Space to focus on what comes next.",
  },
  {
    slug: "clients",
    label: "Clients",
    icon: Users,
    group: "Workspace",
    description:
      "Good relationships start with a little context. Keep yours in one place.",
  },
  {
    slug: "leads",
    label: "Leads",
    icon: Target,
    group: "Workspace",
    description: "From first conversation to your next great client.",
  },
  {
    slug: "projects",
    label: "Projects",
    icon: FolderKanban,
    group: "Workspace",
    description: "A calmer way to see your commitments through.",
  },
  {
    slug: "tasks",
    label: "Tasks",
    icon: CheckSquare2,
    group: "Workspace",
    description: "Turn the bigger picture into a clear next step.",
  },
  {
    slug: "follow-ups",
    label: "Follow-ups",
    icon: Clock3,
    group: "Workspace",
    description: "Keep the conversation going, at just the right moment.",
  },
  {
    slug: "money",
    label: "Money",
    icon: Wallet,
    group: "Finance",
    description: "Know where your business stands, without the noise.",
  },
  {
    slug: "invoices",
    label: "Invoices",
    icon: ReceiptText,
    group: "Finance",
    description: "Give your work the professional finishing touch it deserves.",
  },
  {
    slug: "ai",
    label: "AI Command Center",
    icon: Sparkles,
    group: "Intelligence",
    description: "Your business context. A clearer next move.",
  },
  {
    slug: "notifications",
    label: "Notifications",
    icon: Bell,
    group: "Manage",
    description: "The updates that matter, together in one quiet place.",
  },
  {
    slug: "settings",
    label: "Settings",
    icon: Settings2,
    group: "Manage",
    description: "A workspace that feels like your business.",
  },
] as const;
export type ModuleSlug = (typeof navigation)[number]["slug"];
export function workspaceHref(workspaceId: string, slug: ModuleSlug) {
  return `/${encodeURIComponent(workspaceId)}/${slug}`;
}

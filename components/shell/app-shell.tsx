"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Command,
  Menu,
  Sprout,
} from "lucide-react";
import { navigation, workspaceHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function Sidebar({
  workspaceId,
  onNavigate,
}: {
  workspaceId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pb-5">
      <Link
        href={workspaceHref(workspaceId, "dashboard")}
        onClick={onNavigate}
        className="flex h-21 shrink-0 items-center gap-3 px-3 text-white"
        aria-label="Business Client OS home"
      >
        <span className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/5">
          <Command className="size-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          Business Client <span className="text-[#a9c8a0]">OS</span>
        </span>
      </Link>
      <div className="mx-2 mb-7 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-[#d9e5cd] text-xs font-bold text-[#23372c]">
          W
        </span>
        <div>
          <p className="text-xs font-semibold text-white">Your workspace</p>
          <p className="mt-1 text-[10px] text-[#aebcb3]">Demo environment</p>
        </div>
      </div>
      <nav aria-label="Main navigation" className="space-y-6">
        {["Workspace", "Finance", "Intelligence", "Manage"].map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#93a59a]">
              {group}
            </p>
            <div className="space-y-1">
              {navigation
                .filter((item) => item.group === group)
                .map((item) => {
                  const href = workspaceHref(workspaceId, item.slug);
                  const active = pathname === href;
                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/7 hover:text-white",
                        active
                          ? "bg-[#d9e5cd] font-semibold text-[#23372c] hover:bg-[#d9e5cd] hover:text-[#23372c]"
                          : "text-[#c0ccc3]",
                      )}
                    >
                      <item.icon
                        className="size-[17px] shrink-0"
                        strokeWidth={1.65}
                      />
                      {item.label}
                      {active && (
                        <span className="ml-auto size-1.5 rounded-full bg-[#41684c]" />
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        <div className="rounded-xl border border-white/10 p-4">
          <Sprout className="mb-3 size-5 text-[#b7cea8]" />
          <p className="text-xs font-medium text-white">
            More clarity. Less busywork.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#aebcb3]">
            Context, priorities and client work — in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
export function AppShell({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = navigation.find(
    (item) => pathname === workspaceHref(workspaceId, item.slug),
  );
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-white px-4 py-3 text-sm shadow-lg focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar text-sidebar-foreground lg:block">
        <Sidebar workspaceId={workspaceId} />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="sr-only">
                  Workspace navigation
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Explore Business Client OS modules.
                </SheetDescription>
                <Sidebar
                  workspaceId={workspaceId}
                  onNavigate={() => setOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Workspace
            </span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="truncate text-xs font-medium">
              {current?.label ?? "Workspace"}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
              <span className="size-1.5 rounded-full bg-[#648f57]" />
              Demo data
            </span>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={workspaceHref(workspaceId, "notifications")}
                aria-label="Notifications"
              >
                <Bell strokeWidth={1.6} />
              </Link>
            </Button>
            <span className="h-6 w-px bg-border" />
            <Link
              href={workspaceHref(workspaceId, "settings")}
              aria-label="Workspace settings"
              className="flex size-9 items-center justify-center rounded-full border border-[#dce2d3] bg-[#e8edde] text-xs font-semibold"
            >
              W
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1536px] px-4 py-8 outline-none sm:px-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
        <footer className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 border-t py-5 text-[11px] text-muted-foreground sm:mx-8 lg:mx-10">
          <span>
            Business Client OS <span className="mx-2 text-border">/</span> A
            clearer way to work.
          </span>
          <Link
            className="inline-flex items-center gap-1 hover:text-foreground"
            href={workspaceHref(workspaceId, "settings")}
          >
            Demo workspace <ArrowUpRight className="size-3" />
          </Link>
        </footer>
      </div>
    </div>
  );
}

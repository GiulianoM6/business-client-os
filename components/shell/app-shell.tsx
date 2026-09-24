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
  workspaceName,
  onNavigate,
}: {
  workspaceId: string;
  workspaceName: string;
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
        <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] shadow-inner shadow-white/5">
          <Command className="size-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.02em]">
          Business Client <span className="text-[#b6d1ad]">OS</span>
        </span>
      </Link>

      <div className="mx-2 mb-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 shadow-inner shadow-black/5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#d9e5cd] text-xs font-bold text-[#23372c]">
          {workspaceName.trim().charAt(0).toUpperCase() || "W"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{workspaceName}</p>
          <p className="mt-1 text-[10px] text-[#aebcb3]">
            {workspaceId === "preview" ? "Preview workspace" : "Live workspace"}
          </p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="space-y-6">
        {["Workspace", "Finance", "Intelligence", "Manage"].map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#879b8f]">
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
                        "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-150",
                        active
                          ? "bg-[#dbe7d2] font-semibold text-[#20372b] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                          : "text-[#becbc3] hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-[17px] shrink-0 transition-colors",
                          active ? "text-[#41684c]" : "text-[#9fb0a6] group-hover:text-white",
                        )}
                        strokeWidth={1.7}
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <Sprout className="mb-3 size-5 text-[#b7cea8]" />
          <p className="text-xs font-semibold text-white">
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
  workspaceName,
  children,
}: {
  workspaceId: string;
  workspaceName: string;
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

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-white/[0.04] bg-sidebar text-sidebar-foreground lg:block">
        <Sidebar workspaceId={workspaceId} workspaceName={workspaceName} />
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-8 lg:px-10">
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
                  workspaceName={workspaceName}
                  onNavigate={() => setOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <span className="hidden text-xs text-muted-foreground sm:block">
              {workspaceName}
            </span>
            <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
            <span className="truncate text-xs font-semibold">
              {current?.label ?? "Workspace"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-[0_1px_2px_rgba(20,40,30,0.03)] md:flex">
              <span className="size-1.5 rounded-full bg-[#648f57]" />
              {workspaceId === "preview" ? "Preview" : "Live data"}
            </span>

            <Button variant="ghost" size="icon" asChild>
              <Link
                href={workspaceHref(workspaceId, "notifications")}
                aria-label="Notifications"
              >
                <Bell strokeWidth={1.7} />
              </Link>
            </Button>

            <span className="h-6 w-px bg-border" />

            <Link
              href={workspaceHref(workspaceId, "settings")}
              aria-label="Workspace settings"
              className="flex size-9 items-center justify-center rounded-full border border-[#d7dfd1] bg-[#e6ecdd] text-xs font-bold text-[#34543f] shadow-[0_1px_2px_rgba(20,40,30,0.05)] transition-transform hover:-translate-y-px"
            >
              {workspaceName.trim().charAt(0).toUpperCase() || "W"}
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1500px] px-4 py-8 outline-none sm:px-8 lg:px-10 lg:py-9"
        >
          {children}
        </main>

        <footer className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 border-t py-5 text-[11px] text-muted-foreground sm:mx-8 lg:mx-10">
          <span>
            Business Client OS <span className="mx-2 text-border">/</span> A
            clearer way to work.
          </span>
          <Link
            className="inline-flex items-center gap-1 font-medium hover:text-foreground"
            href={workspaceHref(workspaceId, "settings")}
          >
            {workspaceName} <ArrowUpRight className="size-3" />
          </Link>
        </footer>
      </div>
    </div>
  );
}

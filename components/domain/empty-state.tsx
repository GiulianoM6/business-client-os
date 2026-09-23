import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-background shadow-xs">
        <Icon className="size-6 text-primary" strokeWidth={1.4} />
      </span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

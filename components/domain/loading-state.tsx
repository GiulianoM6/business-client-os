import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
export function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      aria-busy="true"
      className="space-y-8"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className="space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="space-y-5 p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
          </Card>
        ))}
      </div>
      <Card className="space-y-6 p-8">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </Card>
    </div>
  );
}

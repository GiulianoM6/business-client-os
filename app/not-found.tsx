import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="This page is a little off the map"
        description="The page may have moved, or this workspace is not available in the preview."
      >
        <Button asChild>
          <Link href="/preview/dashboard">Back to dashboard</Link>
        </Button>
      </EmptyState>
    </main>
  );
}

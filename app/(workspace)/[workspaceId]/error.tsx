"use client";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card role="alert">
      <EmptyState
        icon={TriangleAlert}
        title="Something interrupted this view"
        description="Try loading the page again. If the problem continues, return to the dashboard."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/preview/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </EmptyState>
    </Card>
  );
}

"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred in the admin panel. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="px-4 py-2 text-sm font-medium border border-border rounded-[4px] hover:bg-muted transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

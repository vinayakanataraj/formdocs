"use client";

import { useEffect } from "react";

export default function FormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Form page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">Unable to load form</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading this form. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

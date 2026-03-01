"use client";

import Link from "next/link";

interface AdminNavProps {
  breadcrumb?: string;
}

export default function AdminNav({ breadcrumb }: AdminNavProps = {}) {
  return (
    <div className="flex items-center h-9 px-4 border-b border-border/50">
      <nav className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Forms
        </Link>
        {breadcrumb && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">{breadcrumb}</span>
          </>
        )}
      </nav>
    </div>
  );
}

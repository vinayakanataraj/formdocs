"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, LogOut, Plus } from "lucide-react";

export default function AdminNav() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
      <Link href="/admin" className="flex items-center gap-2 font-semibold text-sm">
        <FileText className="w-4 h-4" />
        Formdocs
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/admin/forms/new"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Form
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

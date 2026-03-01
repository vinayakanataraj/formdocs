"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, LogOut } from "lucide-react";
import type { FormMeta } from "@/lib/types";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [forms, setForms] = useState<FormMeta[]>([]);

  const fetchForms = useCallback(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then((d) => setForms(d.forms ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms, pathname]); // re-fetch when route changes

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="w-60 shrink-0 h-screen flex flex-col border-r border-sidebar-border bg-sidebar">
      {/* Workspace header */}
      <div className="px-3 py-3 flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-sm bg-foreground/10 flex items-center justify-center shrink-0">
          <FileText className="w-3 h-3" />
        </div>
        <span className="text-sm font-medium truncate">Formdocs</span>
      </div>

      {/* New form button */}
      <div className="px-2 mb-1">
        <Link
          href="/admin/forms/new"
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground rounded-[3px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Form
        </Link>
      </div>

      {/* Forms list */}
      <div className="flex-1 overflow-y-auto px-2">
        {forms.length > 0 && (
          <p className="text-[11px] font-medium text-muted-foreground/60 px-2 pt-3 pb-1">Forms</p>
        )}
        {forms.map((meta) => {
          const isActive = pathname.startsWith(`/admin/forms/${meta.slug}`);
          return (
            <Link
              key={meta.slug}
              href={`/admin/forms/${meta.slug}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-[3px] text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              {meta.iconEmoji ? (
                <span className="text-base shrink-0 leading-none">{meta.iconEmoji}</span>
              ) : (
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className="truncate">{meta.title || "Untitled Form"}</span>
            </Link>
          );
        })}
        {forms.length === 0 && (
          <p className="text-xs text-muted-foreground/50 px-2 py-2">No forms yet</p>
        )}
      </div>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-[3px] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

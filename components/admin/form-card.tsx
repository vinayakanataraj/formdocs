"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormMeta } from "@/lib/types";
import { Edit, ExternalLink, Trash2, Copy, FileText } from "lucide-react";

interface FormCardProps {
  meta: FormMeta;
}

export default function FormCard({ meta }: FormCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${meta.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/forms/${meta.slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${meta.title} (copy)` }),
    });
    if (res.ok) {
      const { form } = await res.json();
      const origRes = await fetch(`/api/forms/${meta.slug}`);
      if (origRes.ok) {
        const { form: orig } = await origRes.json();
        await fetch(`/api/forms/${form.meta.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orig, meta: form.meta }),
        });
      }
      router.refresh();
    }
  }

  const updatedDate = new Date(meta.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-[3px] hover:bg-muted/60 transition-colors">
      {/* Icon */}
      <div className="shrink-0 w-5 text-center">
        {meta.iconEmoji ? (
          <span className="text-base leading-none">{meta.iconEmoji}</span>
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>

      {/* Title */}
      <Link
        href={`/admin/forms/${meta.slug}`}
        className="flex-1 min-w-0 text-sm truncate hover:underline underline-offset-2"
      >
        {meta.title || "Untitled Form"}
      </Link>

      {/* Date — always visible */}
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        {updatedDate}
      </span>

      {/* Actions — hover only */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link
          href={`/admin/forms/${meta.slug}`}
          title="Edit"
          className="flex items-center justify-center w-7 h-7 rounded-[3px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/f/${meta.slug}`}
          target="_blank"
          title="Preview"
          className="flex items-center justify-center w-7 h-7 rounded-[3px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleDuplicate}
          title="Duplicate"
          className="flex items-center justify-center w-7 h-7 rounded-[3px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="flex items-center justify-center w-7 h-7 rounded-[3px] hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

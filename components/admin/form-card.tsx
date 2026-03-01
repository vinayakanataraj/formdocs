"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormMeta } from "@/lib/types";
import { Edit, ExternalLink, Trash2, Copy } from "lucide-react";

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
    <div className="border border-border rounded-lg p-4 bg-card hover:border-ring/50 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {meta.iconEmoji && <span className="text-lg">{meta.iconEmoji}</span>}
            <h3 className="font-medium text-sm truncate">{meta.title || "Untitled Form"}</h3>
          </div>
          {meta.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Updated {updatedDate} · <code className="font-mono text-[11px]">/f/{meta.slug}</code>
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={`/admin/forms/${meta.slug}`}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Edit className="w-3 h-3" />
          Edit
        </Link>
        <Link
          href={`/f/${meta.slug}`}
          target="_blank"
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Preview
        </Link>
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Copy className="w-3 h-3" />
          Duplicate
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto"
        >
          <Trash2 className="w-3 h-3" />
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

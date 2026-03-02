"use client";

import Link from "next/link";
import { useEditorStore } from "@/lib/store/editor";
import { ArrowLeft, Eye, Save, Loader2 } from "lucide-react";

interface EditorHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  saveError: string | null;
}

export default function EditorHeader({ onSave, isSaving, isDirty, saveError }: EditorHeaderProps) {
  const form = useEditorStore((s) => s.form);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background z-10">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Forms
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium truncate max-w-[200px]">
          {form.meta.title || "Untitled Form"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {saveError && (
          <span className="text-xs text-destructive">{saveError}</span>
        )}
        {!saveError && isDirty && !isSaving && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving…
          </span>
        )}
        {!isDirty && !isSaving && !saveError && (
          <span className="text-xs text-muted-foreground">Saved</span>
        )}

        <Link
          href={`/f/${form.meta.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border/50 rounded-[4px] hover:bg-muted transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </Link>

        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </header>
  );
}

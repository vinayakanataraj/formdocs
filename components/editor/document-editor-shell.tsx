"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Form } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import DocumentMarkdownEditor from "@/components/editor/document-markdown-editor";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface DocumentEditorShellProps {
  initialForm: Form;
}

export default function DocumentEditorShell({ initialForm }: DocumentEditorShellProps) {
  const initForm = useEditorStore((s) => s.initForm);
  const form = useEditorStore((s) => s.form);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const setIsSaving = useEditorStore((s) => s.setIsSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    initForm(initialForm);
  }, [initialForm, initForm]);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    const savedForm = form;
    try {
      const res = await fetch(`/api/forms/${savedForm.meta.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedForm),
      });
      if (res.ok) {
        markSaved();
      } else {
        const data = await res.json();
        setSaveError(data.error ?? "Save failed");
      }
    } catch {
      setSaveError("Network error");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [form, markSaved, setIsSaving]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [isDirty, save]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background z-10">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/forms/${initialForm.meta.slug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Editor
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium truncate max-w-[200px]">
            {form.meta.title || "Untitled Form"}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm text-muted-foreground">Document Template</span>
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

          <button
            onClick={save}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <DocumentMarkdownEditor />
      </div>
    </div>
  );
}

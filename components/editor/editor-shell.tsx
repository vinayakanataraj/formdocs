"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Form } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import BlockList from "@/components/editor/block-list";
import SlashCommandPalette from "@/components/editor/slash-command-palette";
import EditorSidebar from "@/components/editor/editor-sidebar";
import EditorHeader from "@/components/editor/editor-header";

interface EditorShellProps {
  initialForm: Form;
}

export default function EditorShell({ initialForm }: EditorShellProps) {
  const initForm = useEditorStore((s) => s.initForm);
  const form = useEditorStore((s) => s.form);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const setIsSaving = useEditorStore((s) => s.setIsSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const updateMeta = useEditorStore((s) => s.updateMeta);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initForm(initialForm);
  }, [initialForm, initForm]);

  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/forms/${form.meta.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      setIsSaving(false);
    }
  }, [form, markSaved, setIsSaving]);

  // Auto-save on change (debounced 2s)
  useEffect(() => {
    if (!isDirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [isDirty, save]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorHeader onSave={save} isSaving={isSaving} isDirty={isDirty} saveError={saveError} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-6 py-12 md:px-16 lg:px-24">
            {/* Form title */}
            <input
              type="text"
              value={form.meta.title}
              onChange={(e) => updateMeta({ title: e.target.value })}
              placeholder="Untitled Form"
              className="w-full text-[40px] font-bold leading-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/25 mb-2"
            />
            {/* Form description */}
            <input
              type="text"
              value={form.meta.description ?? ""}
              onChange={(e) => updateMeta({ description: e.target.value })}
              placeholder="Add a description…"
              className="w-full text-base text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/20 mb-12"
            />

            <BlockList />
          </div>
        </div>

        {/* Right sidebar */}
        <EditorSidebar />
      </div>

      {/* Slash command palette */}
      <SlashCommandPalette />
    </div>
  );
}

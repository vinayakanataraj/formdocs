"use client";

import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import { Trash2, Copy, Settings, Plus } from "lucide-react";

interface BlockActionsProps {
  block: Block;
}

const FIELD_TYPES = new Set([
  "short_text", "long_text", "email", "phone", "number", "currency",
  "date", "single_select", "multi_select", "file_upload", "rating", "yes_no",
  "itemisation",
]);

export default function BlockActions({ block }: BlockActionsProps) {
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const openSlashCommand = useEditorStore((s) => s.openSlashCommand);
  const isField = FIELD_TYPES.has(block.type);

  return (
    <div className="flex items-center gap-0.5 bg-background border border-border/60 rounded-[4px] shadow-[var(--shadow-notion-sm)] p-0.5 -mt-0.5">
      {isField && (
        <button
          onClick={() => setActivePanel("field-config")}
          title="Configure field"
          className="flex items-center justify-center w-6 h-6 rounded-[3px] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-3 h-3" />
        </button>
      )}
      <button
        onClick={() => openSlashCommand(block.id)}
        title="Add block below"
        className="flex items-center justify-center w-6 h-6 rounded-[3px] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-3 h-3" />
      </button>
      <button
        onClick={() => duplicateBlock(block.id)}
        title="Duplicate block"
        className="flex items-center justify-center w-6 h-6 rounded-[3px] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Copy className="w-3 h-3" />
      </button>
      <button
        onClick={() => deleteBlock(block.id)}
        title="Delete block"
        className="flex items-center justify-center w-6 h-6 rounded-[3px] hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

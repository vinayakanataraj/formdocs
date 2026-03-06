"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store/editor";
import { searchBlocks, BlockDefinition } from "@/lib/blocks/definitions";
import type { BlockType } from "@/lib/types";
import * as Icons from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  fields: "Form Fields",
  layout: "Layout",
  special: "Special",
};

type LucideIcon = React.ComponentType<{ className?: string }>;

function getIcon(name: string): LucideIcon {
  const icon = (Icons as unknown as Record<string, LucideIcon | undefined>)[name];
  return icon ?? Icons.Square;
}

export default function SlashCommandPalette() {
  const slashCommandOpen = useEditorStore((s) => s.slashCommandOpen);
  const slashCommandQuery = useEditorStore((s) => s.slashCommandQuery);
  const slashCommandBlockId = useEditorStore((s) => s.slashCommandBlockId);
  const closeSlashCommand = useEditorStore((s) => s.closeSlashCommand);
  const addBlock = useEditorStore((s) => s.addBlock);
  const setSlashQuery = useEditorStore((s) => s.setSlashQuery);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const blocks = useEditorStore((s) => s.form.blocks);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = searchBlocks(slashCommandQuery);

  // Group results
  const grouped = results.reduce<Record<string, BlockDefinition[]>>((acc, b) => {
    acc[b.category] = acc[b.category] ?? [];
    acc[b.category].push(b);
    return acc;
  }, {});

  const flatResults = results;

  useEffect(() => {
    if (slashCommandOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [slashCommandOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIdx(0);
  }, [slashCommandQuery]);

  function insertBlock(type: BlockType) {
    // If the trigger block is empty, replace it
    if (slashCommandBlockId) {
      const triggerBlock = blocks.find((b) => b.id === slashCommandBlockId);
      if (triggerBlock && triggerBlock.type === "paragraph") {
        const props = triggerBlock.properties as { text?: string };
        if (!props.text) {
          // Replace the empty paragraph block
          deleteBlock(slashCommandBlockId);
          addBlock(type, undefined);
          closeSlashCommand();
          return;
        }
      }
    }
    addBlock(type, slashCommandBlockId ?? undefined);
    closeSlashCommand();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults[selectedIdx]) insertBlock(flatResults[selectedIdx].type);
    } else if (e.key === "Escape") {
      closeSlashCommand();
    }
  }

  if (!slashCommandOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={closeSlashCommand} />

      {/* Palette */}
      <div className="fixed left-1/2 top-1/3 -translate-x-1/2 z-50 w-[340px] bg-popover border border-border rounded-[6px] shadow-[var(--shadow-notion)] overflow-hidden">
        <div className="p-2 border-b border-border/50">
          <input
            ref={inputRef}
            value={slashCommandQuery}
            onChange={(e) => setSlashQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search blocks…"
            className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No results for &quot;{slashCommandQuery}&quot;</p>
          ) : (
            Object.entries(grouped).map(([category, blockDefs]) => (
              <div key={category}>
                <p className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 mt-1">
                  {CATEGORY_LABELS[category] ?? category}
                </p>
                {blockDefs.map((block) => {
                  const globalIdx = flatResults.findIndex((b) => b.type === block.type);
                  const Icon = getIcon(block.icon);
                  const isSelected = globalIdx === selectedIdx;

                  return (
                    <button
                      key={block.type}
                      onClick={() => insertBlock(block.type)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-[3px] text-left transition-colors ${
                        isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-[3px] bg-muted shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{block.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

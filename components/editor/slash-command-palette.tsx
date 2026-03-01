"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editor";
import { searchBlocks, BLOCK_DEFINITIONS, BlockDefinition } from "@/lib/blocks/definitions";
import type { BlockType } from "@/lib/types";
import * as Icons from "lucide-react";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  fields: "Form Fields",
  layout: "Layout",
  special: "Special",
};

function getIcon(name: string) {
  const Icon = (Icons as any)[name];
  if (!Icon) return Icons.Square;
  return Icon;
}

export default function SlashCommandPalette() {
  const {
    slashCommandOpen,
    slashCommandQuery,
    slashCommandBlockId,
    closeSlashCommand,
    addBlock,
    setSlashQuery,
    deleteBlock,
    form,
  } = useEditorStore();

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
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [slashCommandOpen]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [slashCommandQuery]);

  function insertBlock(type: BlockType) {
    // If the trigger block is empty, replace it
    if (slashCommandBlockId) {
      const triggerBlock = form.blocks.find((b) => b.id === slashCommandBlockId);
      if (triggerBlock && triggerBlock.type === "paragraph") {
        const props = triggerBlock.properties as any;
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
      <div className="fixed left-1/2 top-1/3 -translate-x-1/2 z-50 w-[340px] bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
        <div className="p-2 border-b border-border">
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
            <p className="text-xs text-muted-foreground text-center py-6">No results for "{slashCommandQuery}"</p>
          ) : (
            Object.entries(grouped).map(([category, blocks]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-1">
                  {CATEGORY_LABELS[category] ?? category}
                </p>
                {blocks.map((block) => {
                  const globalIdx = flatResults.findIndex((b) => b.type === block.type);
                  const Icon = getIcon(block.icon);
                  const isSelected = globalIdx === selectedIdx;

                  return (
                    <button
                      key={block.type}
                      onClick={() => insertBlock(block.type)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-background shrink-0">
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

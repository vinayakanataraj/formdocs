"use client";

import type { ColumnLayoutProps, EditorBlockProps } from "@/lib/types";
import BlockRenderer from "@/components/editor/block-renderer";
import { Columns2 } from "lucide-react";

export default function ColumnLayoutBlock({ block, readOnly }: EditorBlockProps) {
  const p = block.properties as ColumnLayoutProps;
  const cols = p.columns ?? 2;
  const children = block.children ?? [];

  return (
    <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Columns2 className="w-3.5 h-3.5" />
        <span>{cols}-Column Layout</span>
      </div>
      <div className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {Array.from({ length: cols }).map((_, i) => {
          const colBlocks = children.filter((_, bi) => bi % cols === i);
          return (
            <div key={i} className="border border-dashed border-border/60 rounded p-2 min-h-[60px] space-y-1">
              {colBlocks.map((child) => (
                <BlockRenderer key={child.id} block={child} readOnly={readOnly} />
              ))}
              {colBlocks.length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center py-4">Column {i + 1}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type { Block, PageBreakProps } from "@/lib/types";

interface Props { block: Block; onChange: (p: any) => void; readOnly?: boolean; }

export default function PageBreakBlock({ block, onChange, readOnly }: Props) {
  const p = block.properties as PageBreakProps;

  return (
    <div className="relative flex items-center gap-3 py-2">
      <div className="flex-1 border-t border-dashed border-border" />
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border-none text-xs text-muted-foreground">
        <span>Page Break</span>
        {!readOnly && (
          <input
            type="text"
            value={p.label ?? ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Page label (optional)"
            className="bg-transparent outline-none text-xs w-28 placeholder:text-muted-foreground/60"
          />
        )}
      </div>
      <div className="flex-1 border-t border-dashed border-border" />
    </div>
  );
}

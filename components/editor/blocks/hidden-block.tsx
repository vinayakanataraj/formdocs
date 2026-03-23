"use client";

import type { HiddenProps, EditorBlockProps } from "@/lib/types";
import { EyeOff } from "lucide-react";

export default function HiddenBlock({ block }: EditorBlockProps) {
  const p = block.properties as HiddenProps;

  const source = p.expression
    ? `Formula: ${p.expression}`
    : p.queryParam
      ? `Query param: ?${p.queryParam}`
      : p.defaultValue
        ? `Default: "${p.defaultValue}"`
        : "No value configured";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[4px] border border-dashed border-border bg-muted/30 text-muted-foreground text-sm">
      <EyeOff className="w-4 h-4 shrink-0" />
      <span className="font-medium">{p.label || "Hidden Field"}</span>
      <span className="text-xs opacity-70">— {source}</span>
    </div>
  );
}

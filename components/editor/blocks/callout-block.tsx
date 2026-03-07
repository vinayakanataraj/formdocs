"use client";

import type { EditorBlockProps } from "@/lib/types";
import { useEffect, useRef } from "react";

export default function CalloutBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const props = block.properties as { text?: string; emoji?: string; backgroundColor?: string };
  const emoji = props.emoji ?? "💡";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = props.text ?? "";
    }
  }, [props.text]);

  return (
    <div className="flex gap-3 p-4 rounded-[3px] bg-sidebar border-none">
      {!readOnly ? (
        <input
          type="text"
          value={emoji}
          onChange={(e) => onChange({ emoji: e.target.value })}
          className="w-8 text-lg bg-transparent outline-none shrink-0 text-center"
          maxLength={2}
        />
      ) : (
        <span className="text-lg shrink-0">{emoji}</span>
      )}
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onChange({ text: (e.target as HTMLDivElement).innerText })}
        data-placeholder="Write a callout…"
        className="text-sm flex-1 outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      />
    </div>
  );
}

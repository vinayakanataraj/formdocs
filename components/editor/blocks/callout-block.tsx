"use client";

import type { Block } from "@/lib/types";
import { useEffect, useRef } from "react";

interface Props {
  block: Block;
  onChange: (props: any) => void;
  readOnly?: boolean;
}

export default function CalloutBlock({ block, onChange, readOnly }: Props) {
  const props = block.properties as { text?: string; emoji?: string; backgroundColor?: string };
  const emoji = props.emoji ?? "💡";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = props.text ?? "";
    }
  }, [props.text]);

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-muted border border-border">
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
        className="text-sm flex-1 outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30"
      />
    </div>
  );
}

"use client";

import type { EditorBlockProps } from "@/lib/types";
import { useEffect, useRef } from "react";

export default function QuoteBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const props = block.properties as { text?: string };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = props.text ?? "";
    }
  }, [props.text]);

  return (
    <blockquote className="border-l-[3px] border-foreground pl-4 py-1">
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onChange({ text: (e.target as HTMLDivElement).innerText })}
        data-placeholder="Quote…"
        className="text-base outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      />
    </blockquote>
  );
}

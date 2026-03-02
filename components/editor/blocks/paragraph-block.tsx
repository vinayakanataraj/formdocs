"use client";

import type { EditorBlockProps } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import { useEffect, useRef } from "react";

export default function ParagraphBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const openSlashCommand = useEditorStore((s) => s.openSlashCommand);
  const props = block.properties as { text?: string };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = props.text ?? "";
    }
  }, [props.text]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.target as HTMLDivElement).innerText;
    if (text === "/") {
      openSlashCommand(block.id, "");
      return;
    }
    if (text.startsWith("/")) {
      openSlashCommand(block.id, text.slice(1));
      return;
    }
    onChange({ text });
  }

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder="Type '/' for commands, or start writing…"
      className="text-base leading-[1.5] outline-none w-full min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/25"
    />
  );
}

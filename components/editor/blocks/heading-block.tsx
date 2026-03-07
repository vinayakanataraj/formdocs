"use client";

import type { EditorBlockProps } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import { useEffect, useRef } from "react";

const TAG_MAP = { heading1: "h1", heading2: "h2", heading3: "h3" } as const;
const CLASS_MAP = {
  heading1: "text-[30px] font-semibold leading-[1.2]",
  heading2: "text-[24px] font-semibold leading-[1.3]",
  heading3: "text-[20px] font-semibold leading-[1.3]",
};

export default function HeadingBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const openSlashCommand = useEditorStore((s) => s.openSlashCommand);
  const props = block.properties as { text?: string };
  const Tag = TAG_MAP[block.type as keyof typeof TAG_MAP] ?? "h2";
  const className = CLASS_MAP[block.type as keyof typeof CLASS_MAP];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      // Use textContent (not innerHTML) to prevent XSS — headings are plain text only
      ref.current.textContent = props.text ?? "";
    }
  }, [props.text]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.target as HTMLDivElement).innerText;
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
      data-placeholder={`Heading ${Tag.replace("h", "")}`}
      className={`${className} outline-none w-full min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/25`}
    />
  );
}

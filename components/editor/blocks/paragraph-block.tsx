"use client";

import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";

interface Props {
  block: Block;
  onChange: (props: any) => void;
  readOnly?: boolean;
}

export default function ParagraphBlock({ block, onChange, readOnly }: Props) {
  const { openSlashCommand } = useEditorStore();
  const props = block.properties as { text?: string };

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
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder="Type '/' for commands, or start writing…"
      className="text-base outline-none w-full min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30"
      dangerouslySetInnerHTML={{ __html: props.text ?? "" }}
    />
  );
}

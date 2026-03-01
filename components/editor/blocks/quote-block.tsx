"use client";

import type { Block } from "@/lib/types";

interface Props {
  block: Block;
  onChange: (props: any) => void;
  readOnly?: boolean;
}

export default function QuoteBlock({ block, onChange, readOnly }: Props) {
  const props = block.properties as { text?: string };

  return (
    <blockquote className="border-l-[3px] border-border pl-4 py-1">
      <div
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onChange({ text: (e.target as HTMLDivElement).innerText })}
        data-placeholder="Quote…"
        className="text-base italic text-muted-foreground outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30"
        dangerouslySetInnerHTML={{ __html: props.text ?? "" }}
      />
    </blockquote>
  );
}

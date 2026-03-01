"use client";

import type { Block } from "@/lib/types";

interface Props {
  block: Block;
  onChange: (props: any) => void;
  readOnly?: boolean;
}

export default function ListBlock({ block, onChange, readOnly }: Props) {
  const props = block.properties as { items?: string[] };
  const items = props.items ?? [""];
  const isOrdered = block.type === "numbered_list";

  function handleItemChange(idx: number, value: string) {
    const newItems = [...items];
    newItems[idx] = value;
    onChange({ items: newItems });
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(idx + 1, 0, "");
      onChange({ items: newItems });
    } else if (e.key === "Backspace" && items[idx] === "" && items.length > 1) {
      e.preventDefault();
      const newItems = items.filter((_, i) => i !== idx);
      onChange({ items: newItems });
    }
  }

  const Tag = isOrdered ? "ol" : "ul";

  return (
    <Tag className={`pl-5 space-y-0.5 ${isOrdered ? "list-decimal" : "list-disc"}`}>
      {items.map((item, idx) => (
        <li key={idx} className="text-base">
          {readOnly ? (
            <span>{item}</span>
          ) : (
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              placeholder="List item"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground/25"
            />
          )}
        </li>
      ))}
    </Tag>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store/editor";
import type { Block } from "@/lib/types";
import { Hash, Table, FileText } from "lucide-react";
import ItemisationTableSetupModal from "./itemisation-table-setup-modal";

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  category: "fields" | "tables" | "builtins";
  insert: string | null; // null = needs sub-flow
  block?: Block; // for itemisation blocks
}

interface DocumentSlashPaletteProps {
  onInsert: (text: string) => void;
  onClose: () => void;
}

function collectFieldItems(blocks: Block[]): PaletteItem[] {
  const items: PaletteItem[] = [];
  for (const block of blocks) {
    if (block.type === "column_layout") {
      const p = block.properties as { columnDefs?: Array<{ blocks: Block[] }> };
      for (const col of p.columnDefs ?? []) {
        items.push(...collectFieldItems(col.blocks));
      }
    } else if (block.type === "itemisation" || block.type === "itemisation_advanced") {
      const p = block.properties as { slug?: string; label?: string };
      const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
      items.push({
        id: block.id,
        label: p.label ?? slug,
        description: `Insert ${block.children?.length ?? 0}-column table block`,
        category: "tables",
        insert: null,
        block,
      });
    } else {
      const fieldTypes = [
        "short_text", "long_text", "email", "phone", "number", "currency",
        "date", "single_select", "multi_select", "file_upload", "rating", "yes_no",
      ];
      if (fieldTypes.includes(block.type)) {
        const p = block.properties as { slug?: string; label?: string };
        const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
        if (slug) {
          items.push({
            id: block.id,
            label: p.label ?? slug,
            description: `{{${slug}}}`,
            category: "fields",
            insert: `{{${slug}}}`,
          });
        }
      }
    }
  }
  return items;
}

const BUILTIN_ITEMS: PaletteItem[] = [
  { id: "__company_name__", label: "Company Name", description: "{{company_name}}", category: "builtins", insert: "{{company_name}}" },
  { id: "__date__", label: "Date", description: "{{date}}", category: "builtins", insert: "{{date}}" },
  { id: "__form_title__", label: "Form Title", description: "{{form_title}}", category: "builtins", insert: "{{form_title}}" },
];

const CATEGORY_LABELS: Record<string, string> = {
  builtins: "Built-in",
  fields: "Form Fields",
  tables: "Itemisation Tables",
};

function generateTableBlock(block: Block): string {
  const p = block.properties as { slug?: string; label?: string };
  const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
  const children = block.children ?? [];

  const headers = children.map((c) => {
    const cp = c.properties as { label?: string };
    return cp.label ?? c.id;
  });
  const templateCells = children.map((c) => {
    const cp = c.properties as { label?: string };
    const label = cp.label ?? c.id;
    if (c.type === "currency") return `{${label} | currency}`;
    return `{${label}}`;
  });

  const headerRow = "| " + headers.join(" | ") + " |";
  const templateRow = "| " + templateCells.join(" | ") + " |";

  return `{{#table ${slug}}}\n${headerRow}\n${templateRow}\n{{/table ${slug}}}`;
}

export default function DocumentSlashPalette({ onInsert, onClose }: DocumentSlashPaletteProps) {
  const blocks = useEditorStore((s) => s.form.blocks);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [configBlock, setConfigBlock] = useState<Block | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldItems = collectFieldItems(blocks);
  const allItems = [...BUILTIN_ITEMS, ...fieldItems];

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function handleSelect(item: PaletteItem) {
    if (item.insert) {
      onInsert(item.insert);
    } else if (item.block) {
      setConfigBlock(item.block);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) handleSelect(filtered[selectedIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  const categoryOrder = ["builtins", "fields", "tables"];

  if (configBlock) {
    return (
      <ItemisationTableSetupModal
        block={configBlock}
        onInsert={(text) => {
          onInsert(text);
          setConfigBlock(null);
        }}
        onClose={() => setConfigBlock(null)}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-50 w-[320px] bg-popover border border-border rounded-[6px] shadow-[var(--shadow-notion)] overflow-hidden">
        <div className="p-2 border-b border-border/50">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search variables…"
            className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No results</p>
          ) : (
            categoryOrder
              .filter((cat) => grouped[cat]?.length)
              .map((cat) => (
                <div key={cat}>
                  <p className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 mt-1">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  {grouped[cat].map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSelected = globalIdx === selectedIdx;
                    const Icon = item.category === "tables" ? Table : item.category === "builtins" ? FileText : Hash;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[3px] text-left transition-colors ${
                          isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useEditorStore } from "@/lib/store/editor";
import type { ColumnLayoutProps, EditorBlockProps, Block } from "@/lib/types";
import BlockRenderer from "@/components/editor/block-renderer";
import ColumnPresetPicker from "@/components/editor/column-preset-picker";
import { useDroppable } from "@dnd-kit/core";
import { Columns2, Plus, Trash2 } from "lucide-react";

// Droppable column area
function ColumnArea({
  layoutId,
  columnIndex,
  span,
  blocks,
  readOnly,
}: {
  layoutId: string;
  columnIndex: number;
  span: number;
  blocks: Block[];
  readOnly?: boolean;
}) {
  const openSlashCommand = useEditorStore((s) => s.openSlashCommand);
  const deleteBlockFromColumn = useEditorStore((s) => s.deleteBlockFromColumn);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const droppableId = `column:${layoutId}:${columnIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "column", layoutId, columnIndex },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ gridColumn: `span ${span} / span ${span}` }}
      className={`border border-dashed rounded p-2 min-h-[80px] flex flex-col transition-colors ${
        isOver ? "border-primary/60 bg-primary/5" : "border-border/60"
      }`}
    >
      <div className="flex-1 space-y-1">
        {blocks.map((child) => {
          const isSelected = selectedBlockId === child.id;
          return (
            <div
              key={child.id}
              className={`relative group/colblock rounded border transition-colors ${
                isSelected ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-border"
              }`}
              onClick={(e) => { e.stopPropagation(); selectBlock(child.id); }}
            >
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlockFromColumn(layoutId, columnIndex, child.id);
                  }}
                  className="absolute right-1 top-1 opacity-0 group-hover/colblock:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 z-10"
                  title="Delete block"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <div className="p-1">
                <BlockRenderer block={child} readOnly={readOnly} />
              </div>
            </div>
          );
        })}
        {blocks.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-4">
            Column {columnIndex + 1}
          </p>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openSlashCommand(`__col__${layoutId}__${columnIndex}`, "");
          }}
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors w-full justify-center py-1 rounded hover:bg-muted/30"
          title="Add block to column"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function ColumnLayoutBlock({ block, readOnly }: EditorBlockProps) {
  const updateColumnLayout = useEditorStore((s) => s.updateColumnLayout);
  const p = block.properties as ColumnLayoutProps;
  const columnDefs = p.columnDefs ?? [];
  const currentSpans = columnDefs.map((c) => c.span);

  return (
    <div
      className="border border-dashed border-border rounded-lg p-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Columns2 className="w-3.5 h-3.5" />
          <span>Section</span>
        </div>
        {!readOnly && (
          <ColumnPresetPicker
            currentSpans={currentSpans}
            onSelect={(spans) => updateColumnLayout(block.id, spans)}
          />
        )}
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(12, 1fr)" }}
      >
        {columnDefs.map((col, i) => (
          <ColumnArea
            key={col.id}
            layoutId={block.id}
            columnIndex={i}
            span={col.span}
            blocks={col.blocks}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

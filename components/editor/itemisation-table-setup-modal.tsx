"use client";

import { useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ExpressionInput from "@/components/editor/expression-input";
import type { Block } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ColumnEntry {
  id: string;
  label: string;
  type: string;
  visible: boolean;
}

export interface ComputedColumn {
  id: string;
  label: string;
  expression: string;
  format: "none" | "currency";
}

interface ItemisationTableSetupModalProps {
  block: Block;
  onInsert: (text: string) => void;
  onClose: () => void;
  initialColumns?: ColumnEntry[];
  initialComputedColumns?: ComputedColumn[];
  mode?: "insert" | "update";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function generateTableMarkdown(
  block: Block,
  columns: ColumnEntry[],
  computedColumns: ComputedColumn[]
): string {
  const p = block.properties as { slug?: string; label?: string };
  const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
  const children = block.children ?? [];

  const headers: string[] = [];
  const cells: string[] = [];

  for (const col of columns) {
    if (!col.visible) continue;
    const child = children.find((c) => c.id === col.id);
    if (!child) continue;
    headers.push(col.label);
    if (child.type === "currency") {
      cells.push(`{${col.label} | currency}`);
    } else {
      cells.push(`{${col.label}}`);
    }
  }

  for (const col of computedColumns) {
    if (!col.label.trim()) continue;
    headers.push(col.label.trim());
    const expr = col.expression.trim();
    if (col.format === "currency") {
      cells.push(`{= ${expr} | currency}`);
    } else {
      cells.push(`{= ${expr}}`);
    }
  }

  const headerRow = "| " + headers.join(" | ") + " |";
  const templateRow = "| " + cells.join(" | ") + " |";

  return `{{#table ${slug}}}\n${headerRow}\n${templateRow}\n{{/table ${slug}}}`;
}

/* ------------------------------------------------------------------ */
/*  SortableColumnItem                                                 */
/* ------------------------------------------------------------------ */

function SortableColumnItem({
  entry,
  onToggle,
}: {
  entry: ColumnEntry;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-muted/50 transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={entry.visible}
          onChange={() => onToggle(entry.id)}
          className="w-3.5 h-3.5 accent-foreground"
        />
        <span className="text-xs text-foreground">{entry.label}</span>
        <span className="text-[11px] text-muted-foreground font-mono ml-auto">
          {entry.type}
        </span>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SortableComputedItem                                               */
/* ------------------------------------------------------------------ */

function SortableComputedItem({
  col,
  allColumnLabels,
  onUpdate,
  onRemove,
}: {
  col: ComputedColumn;
  allColumnLabels: string[];
  onUpdate: (id: string, patch: Partial<ComputedColumn>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border rounded-[4px] p-2.5 space-y-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <input
          type="text"
          value={col.label}
          onChange={(e) => onUpdate(col.id, { label: e.target.value })}
          placeholder="Column label"
          className="flex-1 text-xs bg-muted/50 border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <select
          value={col.format}
          onChange={(e) =>
            onUpdate(col.id, { format: e.target.value as "none" | "currency" })
          }
          className="text-xs bg-muted/50 border border-border rounded px-2 py-1 focus:outline-none"
        >
          <option value="none">Number</option>
          <option value="currency">Currency</option>
        </select>
        <button
          onClick={() => onRemove(col.id)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <ExpressionInput
        value={col.expression}
        onChange={(v) => onUpdate(col.id, { expression: v })}
        allColumnLabels={allColumnLabels}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

export default function ItemisationTableSetupModal({
  block,
  onInsert,
  onClose,
  initialColumns,
  initialComputedColumns,
  mode = "insert",
}: ItemisationTableSetupModalProps) {
  const p = block.properties as { label?: string };
  const children = block.children ?? [];

  // Change 1: ordered array instead of Map
  const [columns, setColumns] = useState<ColumnEntry[]>(() =>
    initialColumns ??
    children.map((c) => {
      const cp = c.properties as { label?: string };
      return { id: c.id, label: cp.label ?? c.id, type: c.type, visible: true };
    })
  );
  const [computedColumns, setComputedColumns] = useState<ComputedColumn[]>(
    () => initialComputedColumns ?? []
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function toggleColumn(id: string) {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumns((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id);
      const newIdx = prev.findIndex((c) => c.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function handleComputedDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setComputedColumns((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id);
      const newIdx = prev.findIndex((c) => c.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addComputedColumn() {
    setComputedColumns((prev) => [
      ...prev,
      { id: generateId(), label: "", expression: "", format: "none" },
    ]);
  }

  function updateComputedColumn(id: string, patch: Partial<ComputedColumn>) {
    setComputedColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...patch } : col))
    );
  }

  function removeComputedColumn(id: string) {
    setComputedColumns((prev) => prev.filter((col) => col.id !== id));
  }

  function handleInsert() {
    const markdown = generateTableMarkdown(block, columns, computedColumns);
    onInsert(markdown);
  }

  // All child column labels for autocomplete
  const allColumnLabels = children.map((c) => {
    const cp = c.properties as { label?: string };
    return cp.label ?? c.id;
  });

  // Preview headers — respect array order
  const previewHeaders = [
    ...columns.filter((c) => c.visible).map((c) => c.label),
    ...computedColumns.filter((col) => col.label.trim()).map((col) => col.label.trim()),
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-background border border-border rounded-[8px] shadow-xl flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Configure Table</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{p.label ?? block.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {/* Available Columns — draggable */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Columns
              </h3>
              {children.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No columns defined</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleColumnDragEnd}
                >
                  <SortableContext
                    items={columns.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {columns.map((entry) => (
                        <SortableColumnItem
                          key={entry.id}
                          entry={entry}
                          onToggle={toggleColumn}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </section>

            {/* Computed Columns — draggable */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Computed Columns
                </h3>
                <button
                  onClick={addComputedColumn}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {computedColumns.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No computed columns. Click Add to create one.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleComputedDragEnd}
                >
                  <SortableContext
                    items={computedColumns.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {computedColumns.map((col) => (
                        <SortableComputedItem
                          key={col.id}
                          col={col}
                          allColumnLabels={allColumnLabels}
                          onUpdate={updateComputedColumn}
                          onRemove={removeComputedColumn}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </section>

            {/* Preview */}
            {previewHeaders.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Preview
                </h3>
                <div className="overflow-x-auto border border-border rounded-[4px]">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {previewHeaders.map((h, i) => (
                          <th
                            key={`${h}-${i}`}
                            className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {previewHeaders.map((h, i) => (
                          <td
                            key={`${h}-${i}`}
                            className="px-3 py-1.5 text-muted-foreground/60 italic"
                          >
                            …
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-[4px] hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={previewHeaders.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mode === "update" ? "Update Table" : "Insert Table"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

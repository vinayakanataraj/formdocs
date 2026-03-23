"use client";

import { useEffect, useCallback } from "react";
import { GripVertical, ChevronDown } from "lucide-react";
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
import { useEditorStore } from "@/lib/store/editor";
import type {
  Block,
  ItemisationTableConfig,
  ItemisationTableColumn,
  ItemisationTableStyle,
  ItemisationProps,
} from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function defaultStyle(): ItemisationTableStyle {
  return {
    headerBgColor: "#f2f2f2",
    headerFontBold: true,
    headerFontItalic: false,
    headerFontUnderline: false,
    bodyBgColor: "#ffffff",
    bodyFontBold: false,
    bodyFontItalic: false,
    bodyFontUnderline: false,
  };
}

/** Collect all itemisation/itemisation_advanced blocks from the block tree. */
function collectItemisationBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const block of blocks) {
    if (block.type === "itemisation" || block.type === "itemisation_advanced") {
      result.push(block);
    } else if (block.type === "column_layout") {
      const cols = (block.properties as { columnDefs?: { blocks: Block[] }[] }).columnDefs ?? [];
      for (const col of cols) {
        result.push(...collectItemisationBlocks(col.blocks));
      }
    }
  }
  return result;
}

/** Build columns list from block children + computed fields. */
function buildColumnsForBlock(block: Block): ItemisationTableColumn[] {
  const props = block.properties as ItemisationProps;
  const children = block.children ?? [];
  const computedFields = props.computedFields ?? [];

  const columns: ItemisationTableColumn[] = [];

  for (const child of children) {
    const p = child.properties as { label?: string };
    columns.push({
      id: child.id,
      label: p.label ?? child.id,
      type: "field",
      visible: true,
    });
  }

  for (const cf of computedFields) {
    columns.push({
      id: cf.id,
      label: cf.label,
      type: "computed",
      visible: true,
    });
  }

  return columns;
}

/** Reconcile stored config with current block state — add new columns, remove stale ones, preserve order. */
function reconcileConfig(
  stored: ItemisationTableConfig,
  block: Block,
): ItemisationTableConfig {
  const fresh = buildColumnsForBlock(block);
  const freshIds = new Set(fresh.map((c) => c.id));
  const storedIds = new Set(stored.columns.map((c) => c.id));

  // Keep existing columns that still exist (preserving order + visibility)
  const kept = stored.columns.filter((c) => freshIds.has(c.id));
  // Add new columns not in stored
  const added = fresh.filter((c) => !storedIds.has(c.id));

  return { ...stored, columns: [...kept, ...added] };
}

// ─── SortableColumnItem ─────────────────────────────────────────────────────────

function SortableColumnItem({
  col,
  onToggle,
}: {
  col: ItemisationTableColumn;
  onToggle: (id: string) => void;
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
          checked={col.visible}
          onChange={() => onToggle(col.id)}
          className="w-3.5 h-3.5 accent-foreground"
        />
        <span className="text-xs text-foreground">{col.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-auto ${
          col.type === "computed"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
            : "bg-muted text-muted-foreground"
        }`}>
          {col.type}
        </span>
      </label>
    </div>
  );
}

// ─── FontToggle ─────────────────────────────────────────────────────────────────

function FontToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 text-xs font-semibold border rounded-md transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground border-border hover:bg-muted"
      }`}
      style={{
        fontWeight: label === "B" ? "bold" : undefined,
        fontStyle: label === "I" ? "italic" : undefined,
        textDecoration: label === "U" ? "underline" : undefined,
      }}
    >
      {label}
    </button>
  );
}

// ─── BlockSection ───────────────────────────────────────────────────────────────

function BlockSection({
  block,
  config,
  onUpdate,
}: {
  block: Block;
  config: ItemisationTableConfig;
  onUpdate: (updated: ItemisationTableConfig) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const props = block.properties as ItemisationProps;
  const blockLabel = props.label ?? block.id;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = config.columns.findIndex((c) => c.id === active.id);
    const newIndex = config.columns.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onUpdate({ ...config, columns: arrayMove(config.columns, oldIndex, newIndex) });
  }

  function toggleVisibility(id: string) {
    const columns = config.columns.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c,
    );
    onUpdate({ ...config, columns });
  }

  function toggleSummaryFooter() {
    onUpdate({ ...config, includeSummaryFooter: !config.includeSummaryFooter });
  }

  const hasSummaryFields = (props.summaryFields ?? []).length > 0;

  return (
    <details className="group border border-border rounded-md" open>
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-medium hover:bg-muted/50 transition-colors">
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
        {blockLabel}
        <span className="text-muted-foreground font-normal ml-auto">
          {config.columns.filter((c) => c.visible).length}/{config.columns.length} columns
        </span>
      </summary>
      <div className="px-3 pb-3 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {config.columns.map((col) => (
              <SortableColumnItem
                key={col.id}
                col={col}
                onToggle={toggleVisibility}
              />
            ))}
          </SortableContext>
        </DndContext>

        {hasSummaryFields && (
          <label className="flex items-center gap-2 text-xs cursor-pointer pt-1 border-t border-border">
            <input
              type="checkbox"
              checked={config.includeSummaryFooter}
              onChange={toggleSummaryFooter}
              className="w-3.5 h-3.5 accent-foreground"
            />
            <span>Include summary footer</span>
          </label>
        )}
      </div>
    </details>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function WebhookTableConfig() {
  const form = useEditorStore((s) => s.form);
  const updateWebhook = useEditorStore((s) => s.updateWebhook);
  const wh = form.webhook;
  const configs = wh.itemisationTableConfigs ?? [];

  const itemBlocks = collectItemisationBlocks(form.blocks);

  // Reconcile configs with current blocks on mount / block changes
  const reconcile = useCallback(() => {
    const blockIds = new Set(itemBlocks.map((b) => b.id));
    const existingMap = new Map(configs.map((c) => [c.blockId, c]));

    let changed = false;
    const reconciled: ItemisationTableConfig[] = [];

    for (const block of itemBlocks) {
      const existing = existingMap.get(block.id);
      if (existing) {
        const updated = reconcileConfig(existing, block);
        if (JSON.stringify(updated) !== JSON.stringify(existing)) changed = true;
        reconciled.push(updated);
      } else {
        // New block — create config
        changed = true;
        reconciled.push({
          blockId: block.id,
          columns: buildColumnsForBlock(block),
          style: defaultStyle(),
          includeSummaryFooter: false,
        });
      }
    }

    // Remove configs for blocks that no longer exist
    if (configs.some((c) => !blockIds.has(c.blockId))) changed = true;

    if (changed) {
      updateWebhook({ itemisationTableConfigs: reconciled });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(itemBlocks.map((b) => b.id)), JSON.stringify(itemBlocks.map((b) => (b.children ?? []).map((c) => c.id)))]);

  useEffect(() => {
    reconcile();
  }, [reconcile]);

  if (itemBlocks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No itemisation blocks in this form.
      </p>
    );
  }

  function updateConfig(blockId: string, updated: ItemisationTableConfig) {
    const next = configs.map((c) => (c.blockId === blockId ? updated : c));
    updateWebhook({ itemisationTableConfigs: next });
  }

  // Shared style — use the first config's style as the shared style
  const sharedStyle = configs[0]?.style ?? defaultStyle();

  function updateSharedStyle(patch: Partial<ItemisationTableStyle>) {
    const merged = { ...sharedStyle, ...patch };
    const next = configs.map((c) => ({ ...c, style: merged }));
    updateWebhook({ itemisationTableConfigs: next });
  }

  return (
    <div className="space-y-4">
      {/* Per-block column config */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Table Columns
        </p>
        {itemBlocks.map((block) => {
          const config = configs.find((c) => c.blockId === block.id);
          if (!config) return null;
          return (
            <BlockSection
              key={block.id}
              block={block}
              config={config}
              onUpdate={(updated) => updateConfig(block.id, updated)}
            />
          );
        })}
      </div>

      {/* Shared style controls */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Table Style
        </p>

        {/* Header row */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Header Row</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={sharedStyle.headerBgColor}
              onChange={(e) => updateSharedStyle({ headerBgColor: e.target.value })}
              className="w-8 h-7 border border-border rounded cursor-pointer"
              title="Header background color"
            />
            <FontToggle
              label="B"
              active={sharedStyle.headerFontBold}
              onClick={() => updateSharedStyle({ headerFontBold: !sharedStyle.headerFontBold })}
            />
            <FontToggle
              label="I"
              active={sharedStyle.headerFontItalic}
              onClick={() => updateSharedStyle({ headerFontItalic: !sharedStyle.headerFontItalic })}
            />
            <FontToggle
              label="U"
              active={sharedStyle.headerFontUnderline}
              onClick={() => updateSharedStyle({ headerFontUnderline: !sharedStyle.headerFontUnderline })}
            />
          </div>
        </div>

        {/* Body rows */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Body Rows</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={sharedStyle.bodyBgColor}
              onChange={(e) => updateSharedStyle({ bodyBgColor: e.target.value })}
              className="w-8 h-7 border border-border rounded cursor-pointer"
              title="Body background color"
            />
            <FontToggle
              label="B"
              active={sharedStyle.bodyFontBold}
              onClick={() => updateSharedStyle({ bodyFontBold: !sharedStyle.bodyFontBold })}
            />
            <FontToggle
              label="I"
              active={sharedStyle.bodyFontItalic}
              onClick={() => updateSharedStyle({ bodyFontItalic: !sharedStyle.bodyFontItalic })}
            />
            <FontToggle
              label="U"
              active={sharedStyle.bodyFontUnderline}
              onClick={() => updateSharedStyle({ bodyFontUnderline: !sharedStyle.bodyFontUnderline })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useEditorStore, type ContainerLocation } from "@/lib/store/editor";
import SortableBlock from "@/components/editor/sortable-block";
import BlockRenderer from "@/components/editor/block-renderer";
import type { Block, ColumnLayoutProps } from "@/lib/types";
import { Plus } from "lucide-react";

// Find which container a block belongs to
function findBlockContainer(
  blocks: Block[],
  blockId: string
): ContainerLocation | null {
  if (blocks.some((b) => b.id === blockId)) return { type: "top-level" };
  for (const b of blocks) {
    if (b.type === "column_layout") {
      const p = b.properties as ColumnLayoutProps;
      for (let i = 0; i < (p.columnDefs ?? []).length; i++) {
        if (p.columnDefs[i].blocks.some((cb) => cb.id === blockId)) {
          return { type: "column", layoutId: b.id, columnIndex: i };
        }
      }
    }
  }
  return null;
}

export default function BlockList() {
  const form = useEditorStore((s) => s.form);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const moveBlockBetweenContainers = useEditorStore((s) => s.moveBlockBetweenContainers);
  const openSlashCommand = useEditorStore((s) => s.openSlashCommand);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const blockId = e.active.id as string;
    let block: Block | undefined = form.blocks.find((b) => b.id === blockId);
    if (!block) {
      for (const b of form.blocks) {
        if (b.type === "column_layout") {
          const p = b.properties as ColumnLayoutProps;
          for (const col of p.columnDefs ?? []) {
            const found = col.blocks.find((cb) => cb.id === blockId);
            if (found) { block = found; break; }
          }
        }
        if (block) break;
      }
    }
    setActiveBlock(block ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveBlock(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overData = over.data?.current as Record<string, unknown> | undefined;

    let targetContainer: ContainerLocation;
    if (overId.startsWith("column:")) {
      const parts = overId.split(":");
      targetContainer = { type: "column", layoutId: parts[1], columnIndex: parseInt(parts[2]) };
    } else if (overData?.type === "column-block") {
      targetContainer = {
        type: "column",
        layoutId: overData.layoutId as string,
        columnIndex: overData.columnIndex as number,
      };
    } else {
      targetContainer = { type: "top-level" };
    }

    const sourceContainer = findBlockContainer(form.blocks, activeId);
    if (!sourceContainer) return;

    // Same top-level container: simple reorder
    if (
      sourceContainer.type === "top-level" &&
      targetContainer.type === "top-level"
    ) {
      moveBlock(activeId, overId);
      return;
    }

    // Cross-container move
    moveBlockBetweenContainers(activeId, sourceContainer, targetContainer);
  }

  // Custom collision detection: prefer column droppables
  function collisionDetection(args: Parameters<typeof pointerWithin>[0]) {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const colDroppable = pointerCollisions.find(
        (c) => typeof c.id === "string" && (c.id as string).startsWith("column:")
      );
      if (colDroppable) return [colDroppable];
      return pointerCollisions;
    }
    return closestCenter(args);
  }

  return (
    <div className="space-y-0">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={form.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {form.blocks.map((block) => (
            <SortableBlock key={block.id} block={block} />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeBlock && (
            <div className="opacity-90 bg-background shadow-[var(--shadow-notion)] rounded-[4px] border border-border/50">
              <BlockRenderer block={activeBlock} readOnly />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add block button */}
      <button
        onClick={() => openSlashCommand(form.blocks[form.blocks.length - 1]?.id ?? null)}
        className="flex items-center gap-2 text-sm text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors py-2 px-2 w-full rounded-[3px] hover:bg-muted/30 group"
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span className="group-hover:opacity-100 opacity-0 transition-opacity text-xs">
          Click to add a block, or press / anywhere
        </span>
      </button>
    </div>
  );
}

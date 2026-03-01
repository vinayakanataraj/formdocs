"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useEditorStore } from "@/lib/store/editor";
import SortableBlock from "@/components/editor/sortable-block";
import BlockRenderer from "@/components/editor/block-renderer";
import type { Block } from "@/lib/types";
import { Plus } from "lucide-react";

export default function BlockList() {
  const { form, moveBlock, addBlock, openSlashCommand } = useEditorStore();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const block = form.blocks.find((b) => b.id === e.active.id);
    setActiveBlock(block ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveBlock(null);
    if (over && active.id !== over.id) {
      moveBlock(active.id as string, over.id as string);
    }
  }

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
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
            <div className="opacity-80 bg-background shadow-lg rounded-md border border-border">
              <BlockRenderer block={activeBlock} readOnly />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add block button */}
      <button
        onClick={() => openSlashCommand(form.blocks[form.blocks.length - 1]?.id ?? null)}
        className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 px-2 w-full rounded-md hover:bg-muted/50 group"
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span className="group-hover:opacity-100 opacity-0 transition-opacity text-xs">
          Click to add a block, or press / anywhere
        </span>
      </button>
    </div>
  );
}

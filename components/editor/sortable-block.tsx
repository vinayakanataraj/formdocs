"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/types";
import BlockRenderer from "@/components/editor/block-renderer";
import BlockActions from "@/components/editor/block-actions";
import { useEditorStore } from "@/lib/store/editor";
import { GripVertical, Plus } from "lucide-react";

interface SortableBlockProps {
  block: Block;
}

export default function SortableBlock({ block }: SortableBlockProps) {
  const { selectedBlockId, selectBlock, openSlashCommand } = useEditorStore();
  const isSelected = selectedBlockId === block.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, paddingLeft: "2rem" }}
      className="group relative py-0.5"
      onClick={() => selectBlock(block.id)}
    >
      {/* Left gutter — appears on hover */}
      <div className="absolute left-0 top-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); openSlashCommand(block.id); }}
          title="Add block below"
          className="w-6 h-6 rounded-[3px] hover:bg-muted flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="w-6 h-6 rounded-[3px] hover:bg-muted flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Block content */}
      <div className="rounded-[3px] transition-colors hover:bg-muted/40 min-w-0">
        <BlockRenderer block={block} />
      </div>

      {/* Block action toolbar (shows on select) */}
      {isSelected && (
        <div className="absolute right-0 top-0 z-10">
          <BlockActions block={block} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/types";
import BlockRenderer from "@/components/editor/block-renderer";
import BlockActions from "@/components/editor/block-actions";
import { useEditorStore } from "@/lib/store/editor";
import { GripVertical } from "lucide-react";

interface SortableBlockProps {
  block: Block;
}

export default function SortableBlock({ block }: SortableBlockProps) {
  const { selectedBlockId, selectBlock } = useEditorStore();
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
      style={style}
      className="group relative flex items-start gap-1 py-0.5"
      onClick={() => selectBlock(block.id)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Block content */}
      <div
        className={`flex-1 min-w-0 rounded-md transition-colors ${
          isSelected ? "ring-1 ring-ring/50 bg-muted/20" : "hover:bg-muted/20"
        }`}
      >
        <BlockRenderer block={block} />
      </div>

      {/* Block action toolbar (shows on hover/select) */}
      {isSelected && (
        <div className="absolute right-0 top-0">
          <BlockActions block={block} />
        </div>
      )}
    </div>
  );
}

"use client";

import type { ItemisationProps, EditorBlockProps } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import BlockRenderer from "@/components/editor/block-renderer";
import { Plus, Table, Trash2 } from "lucide-react";
import { FIELD_BLOCKS } from "@/lib/blocks/definitions";

export default function ItemisationBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as ItemisationProps;
  const addChildBlock = useEditorStore((s) => s.addChildBlock);
  const deleteChildBlock = useEditorStore((s) => s.deleteChildBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const templateFields = block.children ?? [];

  return (
    <div className="border border-border rounded-[4px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Table className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={typeof (block.properties as any).label === "string" ? (block.properties as any).label : ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Itemisation label"
          className="text-sm font-medium bg-transparent outline-none flex-1 placeholder:text-muted-foreground/60"
          readOnly={readOnly}
        />
        <span className="text-xs text-muted-foreground">
          {p.minRows ?? 1}–{p.maxRows ?? 50} rows
        </span>
      </div>

      {/* Template fields */}
      <div className="p-4 space-y-3">
        {templateFields.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Table className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p>Add fields to define each row&apos;s columns</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(templateFields.length, 4)}, 1fr)` }}>
            {templateFields.map((child) => {
              const isChildSelected = selectedBlockId === child.id;
              return (
                <div key={child.id} className="relative group/child">
                  <div
                    className={`border rounded-[3px] p-2 bg-background cursor-pointer transition-colors ${
                      isChildSelected ? "border-ring ring-1 ring-ring/50" : "border-border hover:border-ring/50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectBlock(child.id);
                      setActivePanel("field-config");
                    }}
                  >
                    <BlockRenderer block={child} readOnly={readOnly} />
                  </div>
                  {!readOnly && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteChildBlock(block.id, child.id); }}
                      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover/child:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add field buttons */}
        {!readOnly && (
          <div className="flex flex-wrap gap-1.5">
            {FIELD_BLOCKS.filter(b =>
              !["file_upload", "rating"].includes(b.type)
            ).map((def) => (
              <button
                key={def.type}
                onClick={() => addChildBlock(block.id, def.type)}
                className="flex items-center gap-1 text-xs px-2 py-1 border border-dashed border-border rounded-[3px] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3 h-3" />
                {def.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer: computed/summary fields */}
      {((p.computedFields?.length ?? 0) > 0 || (p.summaryFields?.length ?? 0) > 0) && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 space-y-1">
          {p.computedFields?.map((cf) => (
            <div key={cf.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{cf.label}</span>
              <span className="font-mono text-muted-foreground/60">{cf.expression}</span>
            </div>
          ))}
          {p.summaryFields?.map((sf) => (
            <div key={sf.id} className="flex items-center justify-between text-xs font-medium">
              <span>{sf.label}</span>
              <span className="text-muted-foreground">{sf.aggregation}(…)</span>
            </div>
          ))}
        </div>
      )}

      {/* Add row button preview */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="text-sm text-primary/60 cursor-default">{p.addButtonLabel ?? "+ Add Item"}</div>
      </div>
    </div>
  );
}

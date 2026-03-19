"use client";

import { nanoid } from "nanoid";
import type { ItemisationAdvancedProps, DefaultItem, DefaultItemValue, EditorBlockProps, SingleSelectProps } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import BlockRenderer from "@/components/editor/block-renderer";
import { Plus, TableProperties, Trash2 } from "lucide-react";
import { FIELD_BLOCKS } from "@/lib/blocks/definitions";

export default function ItemisationAdvancedBlock({ block, onChange, readOnly }: EditorBlockProps) {
  const p = block.properties as ItemisationAdvancedProps;
  const addChildBlock = useEditorStore((s) => s.addChildBlock);
  const deleteChildBlock = useEditorStore((s) => s.deleteChildBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const templateFields = block.children ?? [];
  const defaultItems = p.defaultItems ?? [];

  function addDefaultItem() {
    const newItem: DefaultItem = { id: nanoid(), values: [] };
    onChange({ defaultItems: [...defaultItems, newItem] } as Partial<ItemisationAdvancedProps>);
  }

  function removeDefaultItem(itemId: string) {
    onChange({ defaultItems: defaultItems.filter((item) => item.id !== itemId) } as Partial<ItemisationAdvancedProps>);
  }

  function updateDefaultItemValue(itemId: string, fieldId: string, value: string | number | boolean) {
    const updated = defaultItems.map((item) => {
      if (item.id !== itemId) return item;
      const existingIdx = item.values.findIndex((v) => v.fieldId === fieldId);
      const newValues: DefaultItemValue[] = existingIdx >= 0
        ? item.values.map((v, i) => i === existingIdx ? { ...v, value } : v)
        : [...item.values, { fieldId, value }];
      return { ...item, values: newValues };
    });
    onChange({ defaultItems: updated } as Partial<ItemisationAdvancedProps>);
  }

  function getItemValue(item: DefaultItem, fieldId: string): string | number | boolean {
    return item.values.find((v) => v.fieldId === fieldId)?.value ?? "";
  }

  function renderDefaultItemInput(item: DefaultItem, tf: typeof templateFields[number]) {
    const tfType = tf.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tfProps = tf.properties as any;
    const currentValue = getItemValue(item, tf.id);

    const inputClass = "w-full px-2 py-1 text-xs border border-border rounded-[3px] bg-background focus:outline-none focus:ring-1 focus:ring-ring";

    if (tfType === "yes_no") {
      return (
        <input
          type="checkbox"
          checked={Boolean(currentValue)}
          onChange={(e) => updateDefaultItemValue(item.id, tf.id, e.target.checked)}
          className="accent-primary"
          disabled={readOnly}
        />
      );
    }

    if (tfType === "single_select") {
      const options: string[] = (tfProps as SingleSelectProps).options ?? [];
      return (
        <select
          value={String(currentValue)}
          onChange={(e) => updateDefaultItemValue(item.id, tf.id, e.target.value)}
          className={inputClass}
          disabled={readOnly}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (tfType === "number" || tfType === "currency") {
      return (
        <input
          type="number"
          value={currentValue === "" ? "" : Number(currentValue)}
          onChange={(e) => updateDefaultItemValue(item.id, tf.id, e.target.value === "" ? "" : parseFloat(e.target.value))}
          className={inputClass}
          disabled={readOnly}
        />
      );
    }

    if (tfType === "date") {
      return (
        <input
          type="date"
          value={String(currentValue)}
          onChange={(e) => updateDefaultItemValue(item.id, tf.id, e.target.value)}
          className={inputClass}
          disabled={readOnly}
        />
      );
    }

    // Default: text input for short_text, long_text, email, phone, url, etc.
    return (
      <input
        type="text"
        value={String(currentValue)}
        onChange={(e) => updateDefaultItemValue(item.id, tf.id, e.target.value)}
        className={inputClass}
        disabled={readOnly}
      />
    );
  }

  return (
    <div className="border border-border rounded-[4px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <TableProperties className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={(block.properties as ItemisationAdvancedProps).label ?? ""}
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
            <TableProperties className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
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

      {/* Default Items section */}
      {templateFields.length > 0 && (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Default Items</span>
            {!readOnly && (
              <button
                onClick={addDefaultItem}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Default Item
              </button>
            )}
          </div>

          {defaultItems.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-1">No default items. Items added here will pre-populate the form.</p>
          ) : (
            <div className="space-y-2">
              {defaultItems.map((item, idx) => (
                <div key={item.id} className="border border-border rounded-[3px] p-2 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    {!readOnly && (
                      <button
                        onClick={() => removeDefaultItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(templateFields.length, 4)}, 1fr)` }}>
                    {templateFields.map((tf) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const tfProps = tf.properties as any;
                      return (
                        <div key={tf.id} className="space-y-0.5">
                          <label className="text-[10px] text-muted-foreground truncate block">
                            {tfProps.label ?? tf.type}
                          </label>
                          {renderDefaultItemInput(item, tf)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

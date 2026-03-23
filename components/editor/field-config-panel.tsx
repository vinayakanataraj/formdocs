"use client";

import { useMemo } from "react";
import type { Block, ColumnLayoutProps } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import { slugify } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import ExpressionInput from "@/components/editor/expression-input";

interface Props { block: Block; }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function Toggle({ value, onChange, label }: { value?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  );
}

export default function FieldConfigPanel({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = block.properties as any;

  function update(partial: Record<string, unknown>) {
    updateBlock(block.id, partial);
  }

  const isField = ["short_text", "long_text", "email", "phone", "number", "currency",
    "date", "single_select", "multi_select", "file_upload", "rating", "yes_no", "hidden", "itemisation", "itemisation_advanced"].includes(block.type);

  if (!isField) return <p className="text-xs text-muted-foreground">No configuration for this block type.</p>;

  function addOption() {
    const opts = (p.options as string[] | undefined) ?? [];
    update({ options: [...opts, `Option ${opts.length + 1}`] });
  }

  function updateOption(i: number, val: string) {
    const opts = [...((p.options as string[] | undefined) ?? [])];
    opts[i] = val;
    update({ options: opts });
  }

  function removeOption(i: number) {
    update({ options: ((p.options as string[] | undefined) ?? []).filter((_: unknown, idx: number) => idx !== i) });
  }

  function handleLabelChange(newLabel: string) {
    const currentSlug = p.slug ?? "";
    const derivedFromCurrent = slugify(p.label ?? "");
    // Only auto-update slug if it hasn't been manually customized
    if (currentSlug === "" || currentSlug === derivedFromCurrent) {
      update({ label: newLabel, slug: slugify(newLabel) });
    } else {
      update({ label: newLabel });
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Common fields */}
      <Row label="Label">
        <TextInput value={p.label} onChange={handleLabelChange} placeholder="Field label" />
      </Row>

      <Row label="Field Slug">
        <TextInput
          value={p.slug ?? slugify(p.label ?? "")}
          onChange={(v) => {
            const cleaned = v.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
            // Don't allow clearing to empty
            if (cleaned) update({ slug: cleaned });
          }}
          placeholder="field_slug"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">Used as the key in webhook JSON output.</p>
      </Row>

      {block.type !== "divider" && block.type !== "yes_no" && block.type !== "rating" && block.type !== "hidden" && block.type !== "itemisation" && block.type !== "itemisation_advanced" && (
        <Row label="Placeholder">
          <TextInput value={p.placeholder} onChange={(v) => update({ placeholder: v })} placeholder="Placeholder text" />
        </Row>
      )}

      {block.type !== "itemisation" && block.type !== "itemisation_advanced" && block.type !== "hidden" && (
        <>
          <Toggle value={p.required} onChange={(v) => update({ required: v })} label="Required" />

          <Row label="Help Text">
            <TextInput value={p.helpText} onChange={(v) => update({ helpText: v })} placeholder="Optional help text" />
          </Row>
        </>
      )}

      {/* Type-specific */}
      {(block.type === "short_text" || block.type === "long_text") && (
        <>
          <Row label="Min Length">
            <input type="number" min={0} value={p.minLength ?? ""} onChange={(e) => update({ minLength: parseInt(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Max Length">
            <input type="number" min={1} value={p.maxLength ?? ""} onChange={(e) => update({ maxLength: parseInt(e.target.value) || undefined })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          {block.type === "short_text" && (
            <Row label="Validation Regex">
              <TextInput value={p.regex} onChange={(v) => update({ regex: v })} placeholder="^[A-Za-z]+$" />
            </Row>
          )}
        </>
      )}

      {block.type === "number" && (
        <>
          <Row label="Min Value">
            <input type="number" value={p.min ?? ""} onChange={(e) => update({ min: parseFloat(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Max Value">
            <input type="number" value={p.max ?? ""} onChange={(e) => update({ max: parseFloat(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Decimal Places">
            <input type="number" min={0} max={10} value={p.decimalPrecision ?? 0} onChange={(e) => update({ decimalPrecision: parseInt(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
        </>
      )}

      {block.type === "currency" && (
        <>
          <Row label="Currency Symbol">
            <TextInput value={p.currencySymbol} onChange={(v) => update({ currencySymbol: v })} placeholder="$" />
          </Row>
          <Row label="Decimal Places">
            <input type="number" min={0} max={4} value={p.decimalPlaces ?? 2} onChange={(e) => update({ decimalPlaces: parseInt(e.target.value) || 2 })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
        </>
      )}

      {block.type === "date" && (
        <>
          <Row label="Min Date">
            <input type="date" value={p.minDate ?? ""} onChange={(e) => update({ minDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Max Date">
            <input type="date" value={p.maxDate ?? ""} onChange={(e) => update({ maxDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
        </>
      )}

      {(block.type === "single_select" || block.type === "multi_select") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Options</span>
            <button onClick={addOption} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {(p.options ?? []).map((opt: string, i: number) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <Row label="Display">
            <select
              value={p.display ?? (block.type === "single_select" ? "dropdown" : "checkbox")}
              onChange={(e) => update({ display: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {block.type === "single_select" ? (
                <>
                  <option value="dropdown">Dropdown</option>
                  <option value="radio">Radio Buttons</option>
                </>
              ) : (
                <>
                  <option value="checkbox">Checkboxes</option>
                  <option value="tag">Tags</option>
                </>
              )}
            </select>
          </Row>
          {block.type === "single_select" && (p.options ?? []).length > 0 && (
            <Row label="Default Value">
              <select
                value={p.defaultValue ?? ""}
                onChange={(e) => update({ defaultValue: e.target.value || undefined })}
                className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None (show placeholder)</option>
                {(p.options ?? []).map((opt: string, i: number) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </Row>
          )}
        </div>
      )}

      {block.type === "rating" && (
        <>
          <Row label="Max Rating">
            <input type="number" min={1} max={10} value={p.maxStars ?? 5} onChange={(e) => update({ maxStars: parseInt(e.target.value) || 5 })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Icon Style">
            <select value={p.iconStyle ?? "stars"} onChange={(e) => update({ iconStyle: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="stars">Stars</option>
              <option value="hearts">Hearts</option>
              <option value="thumbs">Thumbs</option>
            </select>
          </Row>
        </>
      )}

      {block.type === "file_upload" && (
        <>
          <Row label="Max File Size (MB)">
            <input type="number" min={1} max={10} value={p.maxFileSizeMb ?? 10} onChange={(e) => update({ maxFileSizeMb: parseInt(e.target.value) || 10 })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </Row>
          <Row label="Accepted Types (comma-separated)">
            <TextInput
              value={(p.acceptedTypes ?? []).join(", ")}
              onChange={(v) => update({ acceptedTypes: v.split(",").map((s: string) => s.trim()).filter(Boolean) })}
              placeholder="image/*, application/pdf"
            />
          </Row>
        </>
      )}

      {block.type === "hidden" && (
        <HiddenFieldConfig block={block} update={update} p={p} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hidden Field Config — Static vs Formula mode                       */
/* ------------------------------------------------------------------ */

const FIELD_TYPES = new Set([
  "short_text", "long_text", "email", "phone", "number", "currency",
  "date", "single_select", "multi_select", "file_upload", "rating", "yes_no", "hidden",
]);

function collectFieldLabels(blocks: Block[], excludeId: string): string[] {
  const labels: string[] = [];
  for (const b of blocks) {
    if (b.id === excludeId) continue;
    if (FIELD_TYPES.has(b.type)) {
      const label = (b.properties as { label?: string })?.label;
      if (label) labels.push(label);
    } else if (b.type === "column_layout") {
      const cols = (b.properties as ColumnLayoutProps).columnDefs ?? [];
      for (const col of cols) {
        for (const child of col.blocks) {
          if (child.id === excludeId) continue;
          if (FIELD_TYPES.has(child.type)) {
            const label = (child.properties as { label?: string })?.label;
            if (label) labels.push(label);
          }
        }
      }
    } else if ((b.type === "itemisation" || b.type === "itemisation_advanced") && b.children) {
      // Check if the hidden field is a child of this itemisation
      const isChild = b.children.some(c => c.id === excludeId);
      if (isChild) {
        // Only offer sibling labels within this itemisation
        for (const child of b.children) {
          if (child.id === excludeId) continue;
          const label = (child.properties as { label?: string })?.label;
          if (label) labels.push(label);
        }
      }
    }
  }
  return labels;
}

function findParentItemisation(blocks: Block[], blockId: string): Block | null {
  for (const b of blocks) {
    if ((b.type === "itemisation" || b.type === "itemisation_advanced") && b.children) {
      if (b.children.some(c => c.id === blockId)) return b;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HiddenFieldConfig({ block, update, p }: { block: Block; update: (partial: Record<string, unknown>) => void; p: any }) {
  const allBlocks = useEditorStore((s) => s.form.blocks);
  const isFormula = p.expression !== undefined;

  const parentItemisation = useMemo(
    () => findParentItemisation(allBlocks, block.id),
    [allBlocks, block.id]
  );

  const availableLabels = useMemo(() => {
    if (parentItemisation) {
      // Inside itemisation: only sibling children labels
      return (parentItemisation.children ?? [])
        .filter(c => c.id !== block.id)
        .map(c => (c.properties as { label?: string })?.label)
        .filter((l): l is string => !!l);
    }
    return collectFieldLabels(allBlocks, block.id);
  }, [allBlocks, block.id, parentItemisation]);

  // Itemisation labels for ITEM_* autocomplete (only for top-level hidden fields)
  const itemisationLabels = useMemo(() => {
    if (parentItemisation) return undefined;
    return allBlocks
      .filter(b => b.type === "itemisation" || b.type === "itemisation_advanced")
      .map(b => (b.properties as { label?: string })?.label)
      .filter((l): l is string => !!l);
  }, [allBlocks, parentItemisation]);

  const itemisationChildLabels = useMemo(() => {
    if (parentItemisation) return undefined;
    const map: Record<string, string[]> = {};
    for (const b of allBlocks) {
      if (b.type !== "itemisation" && b.type !== "itemisation_advanced") continue;
      const label = (b.properties as { label?: string })?.label;
      if (!label) continue;
      map[label] = (b.children ?? [])
        .map(c => (c.properties as { label?: string })?.label)
        .filter((l): l is string => !!l);
    }
    return map;
  }, [allBlocks, parentItemisation]);

  return (
    <>
      <Row label="Mode">
        <select
          value={isFormula ? "formula" : "static"}
          onChange={(e) => {
            if (e.target.value === "formula") {
              update({ expression: "", defaultValue: undefined, queryParam: undefined });
            } else {
              update({ expression: undefined, format: undefined, currencySymbol: undefined, decimalPlaces: undefined });
            }
          }}
          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="static">Static</option>
          <option value="formula">Formula</option>
        </select>
      </Row>

      {!isFormula ? (
        <>
          <Row label="Default Value">
            <TextInput value={p.defaultValue} onChange={(v) => update({ defaultValue: v })} placeholder="Static value" />
          </Row>
          <Row label="Query Parameter">
            <TextInput value={p.queryParam} onChange={(v) => update({ queryParam: v })} placeholder="e.g. utm_source" />
            <p className="text-[10px] text-muted-foreground mt-0.5">Reads value from URL query string. Overrides default value when present.</p>
          </Row>
        </>
      ) : (
        <>
          <Row label="Expression">
            <ExpressionInput
              value={p.expression ?? ""}
              onChange={(v) => update({ expression: v })}
              allColumnLabels={availableLabels}
              placeholder="{Price} * 1.18"
              itemisationLabels={itemisationLabels}
              itemisationChildLabels={itemisationChildLabels}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Use {"{Field Label}"} to reference fields. Type {"{"} for autocomplete.
            </p>
          </Row>
          <Row label="Format">
            <select
              value={p.format ?? ""}
              onChange={(e) => update({ format: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">None</option>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
            </select>
          </Row>
          {p.format === "currency" && (
            <Row label="Currency Symbol">
              <TextInput value={p.currencySymbol} onChange={(v) => update({ currencySymbol: v })} placeholder="$" />
            </Row>
          )}
          {(p.format === "number" || p.format === "currency") && (
            <Row label="Decimal Places">
              <input
                type="number"
                min={0}
                max={10}
                value={p.decimalPlaces ?? 2}
                onChange={(e) => update({ decimalPlaces: parseInt(e.target.value) || 2 })}
                className="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </Row>
          )}
        </>
      )}
    </>
  );
}

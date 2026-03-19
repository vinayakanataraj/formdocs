"use client";

import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import { slugify } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

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
    "date", "single_select", "multi_select", "file_upload", "rating", "yes_no", "itemisation", "itemisation_advanced"].includes(block.type);

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

      {block.type !== "divider" && block.type !== "yes_no" && block.type !== "rating" && block.type !== "itemisation" && block.type !== "itemisation_advanced" && (
        <Row label="Placeholder">
          <TextInput value={p.placeholder} onChange={(v) => update({ placeholder: v })} placeholder="Placeholder text" />
        </Row>
      )}

      {block.type !== "itemisation" && block.type !== "itemisation_advanced" && (
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
    </div>
  );
}

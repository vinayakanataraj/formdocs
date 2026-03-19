"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useMemo } from "react";
import type { Block, ItemisationAdvancedProps } from "@/lib/types";
import FormBlockRenderer from "@/components/form/form-block-renderer";
import { Plus, Trash2 } from "lucide-react";
import { evaluateExpression, buildRowValueMap, computeSummary } from "@/lib/itemisation/expression";

interface Props {
  block: Block;
  allValues: Record<string, unknown>;
}

export default function ItemisationAdvancedRenderer({ block, allValues }: Props) {
  const p = block.properties as ItemisationAdvancedProps;
  const templateFields = block.children ?? [];
  const defaultItems = p.defaultItems ?? [];
  const minRows = p.minRows ?? 1;
  const maxRows = p.maxRows ?? 50;

  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: block.id,
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && fields.length === 0 && defaultItems.length > 0) {
      initialized.current = true;
      const rows = defaultItems.map((item) => {
        const row: Record<string, unknown> = {};
        for (const tf of templateFields) {
          const dv = item.values.find((v) => v.fieldId === tf.id);
          if (dv !== undefined) row[tf.id] = dv.value;
        }
        return row;
      });
      append(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rawRowsValues = useWatch({ control, name: block.id });
  const rowsValues = useMemo(() => (rawRowsValues ?? []) as Record<string, unknown>[], [rawRowsValues]);

  function addRow() {
    if (fields.length >= maxRows) return;
    append({});
  }

  function removeRow(idx: number) {
    if (fields.length <= minRows) return;
    remove(idx);
  }

  // Compute summary values from all rows
  const summaryValues = useMemo(() => {
    const result: Record<string, number> = {};
    for (const sf of p.summaryFields ?? []) {
      result[sf.id] = computeSummary(rowsValues, sf.sourceFieldId, sf.aggregation);
    }
    return result;
  }, [rowsValues, p.summaryFields]);

  const label = (block.properties as ItemisationAdvancedProps).label;

  return (
    <div className="space-y-3">
      {label && <h3 className="text-base font-semibold">{label}</h3>}

      {/* Rows */}
      <div className="space-y-4">
        {fields.map((field, rowIdx) => {
          const rowData = rowsValues[rowIdx] ?? {};
          const rowLabel = p.rowLabelTemplate
            ? p.rowLabelTemplate.replace("{n}", String(rowIdx + 1))
            : `Item ${rowIdx + 1}`;

          // Build value map for computed fields
          const valueMap = buildRowValueMap(rowData, templateFields.map(f => ({ id: f.id, properties: f.properties as { label?: string } })));

          return (
            <div key={field.id} className="border border-border rounded-lg overflow-hidden">
              {/* Row header */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">{rowLabel}</span>
                <button
                  type="button"
                  onClick={() => removeRow(rowIdx)}
                  disabled={fields.length <= minRows}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Row fields */}
              <div className="p-4">
                <div className={`grid gap-4 ${
                  templateFields.length === 1 ? "grid-cols-1" :
                  templateFields.length === 2 ? "sm:grid-cols-2" :
                  templateFields.length === 3 ? "sm:grid-cols-3" :
                  "sm:grid-cols-2 md:grid-cols-4"
                }`}>
                  {templateFields.map((templateField) => {
                    // Render template fields namespaced to this row
                    const namespacedBlock: Block = {
                      ...templateField,
                      id: `${block.id}.${rowIdx}.${templateField.id}`,
                    };
                    return (
                      <FormBlockRenderer
                        key={templateField.id}
                        block={namespacedBlock}
                        allValues={allValues}
                      />
                    );
                  })}

                  {/* Computed fields for this row */}
                  {(p.computedFields ?? []).map((cf) => {
                    const val = evaluateExpression(cf.expression, valueMap);
                    const formatted = cf.format === "currency"
                      ? `${cf.currencySymbol ?? "$"}${val.toFixed(cf.decimalPlaces ?? 2)}`
                      : val === 0 ? "—" : val.toFixed(cf.decimalPlaces ?? 2);

                    return (
                      <div key={cf.id} className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">{cf.label}</label>
                        <div className="px-3 py-2.5 text-sm border border-border rounded-lg bg-muted/30 font-mono">
                          {formatted}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row button */}
      <button
        type="button"
        onClick={addRow}
        disabled={fields.length >= maxRows}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" />
        {p.addButtonLabel ?? "+ Add Item"}
      </button>

      {/* Summary fields */}
      {(p.summaryFields ?? []).length > 0 && (
        <div className="border border-border rounded-lg divide-y divide-border">
          {(p.summaryFields ?? []).map((sf) => {
            const val = summaryValues[sf.id] ?? 0;
            const formatted = sf.format === "currency"
              ? `${sf.currencySymbol ?? "$"}${val.toFixed(sf.decimalPlaces ?? 2)}`
              : sf.aggregation === "COUNT" ? String(Math.round(val)) : val.toFixed(sf.decimalPlaces ?? 2);

            return (
              <div key={sf.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium">{sf.label}</span>
                <span className="text-sm font-mono font-semibold">{formatted}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

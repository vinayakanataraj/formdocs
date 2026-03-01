import { Parser } from "expr-eval";

const parser = new Parser();

/**
 * Evaluate a computed field expression for an itemisation row.
 * Expression syntax: `{FieldLabel} * {OtherField} + 10`
 * Field references are resolved from the `rowValues` map (label → value).
 */
export function evaluateExpression(
  expression: string,
  rowValues: Record<string, number>
): number {
  try {
    // Replace {Field Label} references with their values
    const substituted = expression.replace(/\{([^}]+)\}/g, (_, label) => {
      const val = rowValues[label.trim()];
      if (val === undefined || val === null || isNaN(val)) return "0";
      return String(val);
    });

    const result = parser.evaluate(substituted);
    if (!isFinite(result) || isNaN(result)) return 0;
    return result;
  } catch {
    return 0;
  }
}

/**
 * Build a label→value map from a form row's field values,
 * keyed by the field's label (for expression resolution).
 */
export function buildRowValueMap(
  rowData: Record<string, unknown>,
  templateFields: { id: string; properties: any }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const field of templateFields) {
    const label = field.properties?.label ?? field.id;
    const raw = rowData[field.id];
    const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0")) || 0;
    map[label] = num;
  }
  return map;
}

/**
 * Compute summary aggregation across all rows.
 */
export function computeSummary(
  rows: Record<string, unknown>[],
  sourceFieldId: string,
  aggregation: "SUM" | "COUNT" | "AVERAGE" | "MIN" | "MAX"
): number {
  if (aggregation === "COUNT") return rows.length;

  const values = rows
    .map((r) => parseFloat(String(r[sourceFieldId] ?? "")) )
    .filter((v) => isFinite(v) && !isNaN(v));

  if (values.length === 0) return 0;

  switch (aggregation) {
    case "SUM": return values.reduce((a, b) => a + b, 0);
    case "AVERAGE": return values.reduce((a, b) => a + b, 0) / values.length;
    case "MIN": return Math.min(...values);
    case "MAX": return Math.max(...values);
    default: return 0;
  }
}

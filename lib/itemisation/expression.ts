import { Parser } from "expr-eval";
import { formatNumber } from "@/lib/document/format";
import type { Block } from "@/lib/types";

const parser = new Parser();

// Uppercase unary ops (Excel-style)
for (const [name, fn] of Object.entries({
  ABS: Math.abs, SQRT: Math.sqrt, CEIL: Math.ceil,
  FLOOR: Math.floor, ROUND: Math.round, LOG: Math.log,
  EXP: Math.exp, TRUNC: Math.trunc, SIGN: Math.sign,
})) {
  (parser.unaryOps as Record<string, (x: number) => number>)[name] = fn;
}
// Lowercase additions not in expr-eval by default
(parser.unaryOps as Record<string, (x: number) => number>).sign = Math.sign;
(parser.unaryOps as Record<string, (x: number) => number>).trunc = Math.trunc;

// Uppercase function aliases
const fns = parser.functions as Record<string, (...args: number[]) => number>;
fns.MAX = fns.max;
fns.MIN = fns.min;
fns.POW = Math.pow;
fns.IF = fns["if"];
fns.ROUNDTO = fns.roundTo;

// New functions
fns.MOD = (a: number, b: number) => ((a % b) + b) % b;
fns.mod = fns.MOD;
fns.AVERAGE = (...args: number[]) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0;
fns.average = fns.AVERAGE;

/** Function reference for autocomplete UI */
export const AVAILABLE_FUNCTIONS = [
  { name: "ABS", args: "x", description: "Absolute value" },
  { name: "MAX", args: "a, b, ...", description: "Maximum value" },
  { name: "MIN", args: "a, b, ...", description: "Minimum value" },
  { name: "ROUND", args: "x", description: "Round to nearest integer" },
  { name: "ROUNDTO", args: "x, n", description: "Round to n decimals" },
  { name: "CEIL", args: "x", description: "Round up" },
  { name: "FLOOR", args: "x", description: "Round down" },
  { name: "SQRT", args: "x", description: "Square root" },
  { name: "POW", args: "base, exp", description: "Exponentiation" },
  { name: "IF", args: "cond, then, else", description: "Conditional" },
  { name: "LOG", args: "x", description: "Natural logarithm" },
  { name: "EXP", args: "x", description: "e^x" },
  { name: "TRUNC", args: "x", description: "Truncate to integer" },
  { name: "MOD", args: "a, b", description: "Remainder" },
  { name: "AVERAGE", args: "a, b, ...", description: "Average of values" },
  { name: "SIGN", args: "x", description: "Sign (-1, 0, or 1)" },
  { name: "FORMAT_INDIAN", args: "expr", description: "Format with Indian commas (12,34,567)" },
  { name: "FORMAT_INTL", args: "expr", description: "Format with international commas (1,234,567)" },
  { name: "ITEM_SUM", args: "{Block}, {Field}", description: "Sum field across itemisation rows" },
  { name: "ITEM_COUNT", args: "{Block}, {Field}", description: "Count itemisation rows" },
  { name: "ITEM_AVG", args: "{Block}, {Field}", description: "Average field across itemisation rows" },
  { name: "ITEM_MIN", args: "{Block}, {Field}", description: "Min field across itemisation rows" },
  { name: "ITEM_MAX", args: "{Block}, {Field}", description: "Max field across itemisation rows" },
] as const;

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
  templateFields: { id: string; properties: { label?: string } }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const field of templateFields) {
    const label = field.properties?.label ?? field.id;
    const raw = rowData[field.id];
    const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
    map[label] = num;
  }
  return map;
}

export type NumberFormat = "indian" | "international" | null;

/** Detect FORMAT_INDIAN(...) or FORMAT_INTL(...) wrapper and extract inner expression. */
export function extractFormatWrapper(expr: string): { innerExpr: string; format: NumberFormat } {
  const trimmed = expr.trim();
  const match = trimmed.match(/^FORMAT_(INDIAN|INTL)\((.+)\)$/);
  if (match) {
    return {
      innerExpr: match[2].trim(),
      format: match[1] === "INDIAN" ? "indian" : "international",
    };
  }
  return { innerExpr: trimmed, format: null };
}

/** Format a computed numeric value with Indian or international comma grouping. */
export function formatComputedValue(value: number, format: NumberFormat, decimalPlaces?: number): string {
  if (!format) return String(value);
  return formatNumber(value, format, decimalPlaces);
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
    .map((r) => parseFloat(String(r[sourceFieldId] ?? "").replace(/[^0-9.\-]/g, "")) )
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

/**
 * Resolve ITEM_SUM/COUNT/AVG/MIN/MAX calls in an expression string.
 * Each call is replaced with the numeric result so the remaining expression
 * can be evaluated by expr-eval as usual.
 */
export function resolveItemAggregations(
  expression: string,
  allValues: Record<string, unknown>,
  blocks: Block[],
): string {
  const re = /ITEM_(SUM|COUNT|AVG|MIN|MAX)\(\{([^}]+)\},\s*\{([^}]+)\}\)/g;

  return expression.replace(re, (_, agg: string, blockLabel: string, fieldLabel: string) => {
    // Find the itemisation block by label
    const itemBlock = blocks.find(
      (b) =>
        (b.type === "itemisation" || b.type === "itemisation_advanced") &&
        (b.properties as { label?: string })?.label === blockLabel.trim()
    );
    if (!itemBlock) return "0";

    // Find the child field by label to get its ID
    const childField = (itemBlock.children ?? []).find(
      (c) => (c.properties as { label?: string })?.label === fieldLabel.trim()
    );
    if (!childField) return "0";

    // Get rows from allValues
    const rows = allValues[itemBlock.id];
    if (!Array.isArray(rows)) return "0";

    const aggregation = agg === "AVG" ? "AVERAGE" : agg;
    const result = computeSummary(
      rows as Record<string, unknown>[],
      childField.id,
      aggregation as "SUM" | "COUNT" | "AVERAGE" | "MIN" | "MAX",
    );

    return String(result);
  });
}

// ─── Value map builders for hidden field expressions ─────────────────────────

/** Collect all field block types */
const FIELD_BLOCK_TYPES = new Set([
  "short_text", "long_text", "email", "phone", "number", "currency",
  "date", "single_select", "multi_select", "file_upload", "rating", "yes_no", "hidden",
]);

/** Helper: collect field blocks from the block tree (including column_layout children). */
function collectFieldBlocks(blocks: Block[], excludeBlockId?: string): Block[] {
  const result: Block[] = [];
  for (const b of blocks) {
    if (b.id === excludeBlockId) continue;
    if (FIELD_BLOCK_TYPES.has(b.type)) {
      result.push(b);
    } else if (b.type === "column_layout") {
      const cols = (b.properties as { columnDefs?: { blocks: Block[] }[] }).columnDefs ?? [];
      for (const col of cols) {
        for (const child of col.blocks) {
          if (child.id === excludeBlockId) continue;
          if (FIELD_BLOCK_TYPES.has(child.type)) {
            result.push(child);
          }
        }
      }
    }
  }
  return result;
}

/**
 * Build a label→numeric value map from all top-level field blocks.
 * Used by top-level hidden fields with expressions.
 */
export function buildTopLevelValueMap(
  allValues: Record<string, unknown>,
  blocks: Block[],
  excludeBlockId?: string,
): Record<string, number> {
  const fields = collectFieldBlocks(blocks, excludeBlockId);
  const map: Record<string, number> = {};
  for (const f of fields) {
    const label = (f.properties as { label?: string })?.label ?? f.id;
    const raw = allValues[f.id];
    const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0").replace(/[^0-9.\-]/g, "")) || 0;
    map[label] = num;
  }
  return map;
}

/**
 * Build a label→numeric value map for a hidden field inside an itemisation row.
 * The block ID is namespaced as `itemisationId.rowIdx.fieldId`.
 */
export function buildItemisationRowValueMap(
  blockId: string,
  allValues: Record<string, unknown>,
  blocks: Block[],
): Record<string, number> {
  const parts = blockId.split(".");
  if (parts.length < 3) return {};
  const itemisationId = parts[0];
  const rowIdx = parseInt(parts[1], 10);
  if (isNaN(rowIdx)) return {};

  // Find the parent itemisation block
  let parentBlock: Block | undefined;
  for (const b of blocks) {
    if (b.id === itemisationId && (b.type === "itemisation" || b.type === "itemisation_advanced")) {
      parentBlock = b;
      break;
    }
  }
  if (!parentBlock) return {};

  // Get the row data from allValues (itemisation stores rows as an array)
  const rows = allValues[itemisationId];
  if (!Array.isArray(rows) || !rows[rowIdx]) return {};
  const rowData = rows[rowIdx] as Record<string, unknown>;

  const templateFields = (parentBlock.children ?? []).map(f => ({
    id: f.id,
    properties: f.properties as { label?: string },
  }));

  return buildRowValueMap(rowData, templateFields);
}

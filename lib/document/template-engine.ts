/**
 * Simple Mustache-like template engine for document variable interpolation.
 *
 * Supports:
 * - {{field_slug}} — simple variable substitution
 * - {{field_slug | uppercase}} — pipe filters: uppercase, lowercase, currency, date
 * - {{#if field_slug}}...{{/if}} — conditional blocks
 * - {{#table slug}}...{{/table slug}} — itemisation table rendering
 */

import type { Block } from "@/lib/types";
import { buildRowValueMap, evaluateExpression, extractFormatWrapper, formatComputedValue } from "@/lib/itemisation/expression";
import { formatNumber } from "@/lib/document/format";

export interface TemplateVariables {
  [key: string]: unknown;
}

export interface TemplateOptions {
  currencySymbol?: string;
  numberFormat?: "international" | "indian";
  decimalPlaces?: number;
}

function applyFilter(value: unknown, filter: string, opts: TemplateOptions): string {
  const str = String(value ?? "");
  const trimmed = filter.trim();
  if (trimmed === "uppercase") return str.toUpperCase();
  if (trimmed === "lowercase") return str.toLowerCase();
  if (trimmed === "currency") {
    const num = parseFloat(str) || 0;
    const sym = opts.currencySymbol ?? "\u20B9";
    if (opts.numberFormat === "indian") {
      const fixed = num.toFixed(opts.decimalPlaces ?? 2);
      const [intPart, decPart] = fixed.split(".");
      const intStr = intPart.replace(/^-/, "");
      const sign = intPart.startsWith("-") ? "-" : "";
      let result = "";
      if (intStr.length <= 3) {
        result = intStr;
      } else {
        const last3 = intStr.slice(-3);
        const rest = intStr.slice(0, -3);
        const groups: string[] = [];
        let remaining = rest;
        while (remaining.length > 2) {
          groups.unshift(remaining.slice(-2));
          remaining = remaining.slice(0, -2);
        }
        if (remaining) groups.unshift(remaining);
        result = groups.join(",") + "," + last3;
      }
      return sym + sign + result + (decPart !== undefined ? "." + decPart : "");
    }
    return (
      sym +
      num.toLocaleString("en-US", {
        minimumFractionDigits: opts.decimalPlaces ?? 2,
        maximumFractionDigits: opts.decimalPlaces ?? 2,
      })
    );
  }
  if (trimmed === "indian" || trimmed === "international") {
    const num = parseFloat(str) || 0;
    return formatNumber(num, trimmed as "indian" | "international", opts.decimalPlaces);
  }
  if (trimmed.startsWith("date:")) {
    return str;
  }
  return str;
}

/**
 * Interpolate a template string with variables.
 */
export function interpolateTemplate(
  template: string,
  variables: TemplateVariables,
  options: TemplateOptions = {}
): string {
  // Process {{#if field}}...{{/if}} blocks first
  let result = template.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, field, content) => {
      const val = variables[field.trim()];
      if (!val && val !== 0) return "";
      return content;
    }
  );

  // Process {{field | filter}} and {{field}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const parts = expr.split("|");
    const fieldKey = parts[0].trim();
    const value = variables[fieldKey];
    if (value === undefined || value === null) return "";
    if (parts.length > 1) {
      return applyFilter(value, parts.slice(1).join("|"), options);
    }
    return String(value);
  });

  return result;
}

/**
 * Find an itemisation block by slug in the block tree.
 */
function findItemisationBlockBySlug(blocks: Block[], slug: string): Block | undefined {
  for (const b of blocks) {
    if (b.type === "itemisation" || b.type === "itemisation_advanced") {
      const p = b.properties as { slug?: string; label?: string };
      const bSlug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? b.id;
      if (bSlug === slug) return b;
    }
    if (b.type === "column_layout") {
      const p = b.properties as { columnDefs?: Array<{ blocks: Block[] }> };
      for (const col of p.columnDefs ?? []) {
        const found = findItemisationBlockBySlug(col.blocks, slug);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/**
 * Parse a markdown table template row like "| {field} | {= expr | currency} |"
 * Returns array of cell template strings.
 */
function parseTemplateRow(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

/**
 * Resolve a cell template for a single data row.
 * Supports {field_label} and {= expression | filter}.
 */
function resolveCellTemplate(
  cell: string,
  rowValueMap: Record<string, number>,
  rawRow: Record<string, unknown>,
  childFields: Block[],
  opts: TemplateOptions
): string {
  // {= expression | filter}
  if (cell.startsWith("{=") && cell.endsWith("}")) {
    const inner = cell.slice(2, -1);
    const pipeIdx = inner.indexOf("|");
    const expr = pipeIdx >= 0 ? inner.slice(0, pipeIdx).trim() : inner.trim();
    const filter = pipeIdx >= 0 ? inner.slice(pipeIdx + 1).trim() : "";
    const { innerExpr, format: wrapperFormat } = extractFormatWrapper(expr);
    // Convert {Label} refs to expression-engine format
    const normalizedExpr = innerExpr.replace(/\{([^}]+)\}/g, "{$1}");
    const val = evaluateExpression(normalizedExpr, rowValueMap);
    if (wrapperFormat) {
      return formatComputedValue(val, wrapperFormat, opts.decimalPlaces);
    }
    return filter ? applyFilter(val, filter, opts) : String(val);
  }

  // {field_label}
  if (cell.startsWith("{") && cell.endsWith("}")) {
    const label = cell.slice(1, -1).trim();
    // Try by label match against child fields
    const child = childFields.find((c) => {
      const cp = c.properties as { label?: string };
      return cp.label === label;
    });
    if (child) {
      const cp = child.properties as { label?: string };
      const slug = cp.label?.toLowerCase().replace(/\s+/g, "_") ?? child.id;
      const val = rawRow[slug] ?? rawRow[child.id];
      return String(val ?? "");
    }
    // Fallback: direct key lookup
    return String(rawRow[label] ?? rawRow[label.toLowerCase().replace(/\s+/g, "_")] ?? "");
  }

  return cell;
}

/**
 * Process {{#table slug}}...{{/table slug}} blocks in markdown.
 * Replaces each block with a rendered markdown table using submission data.
 */
export function processTableBlocks(
  markdown: string,
  submissionData: Record<string, unknown>,
  blocks: Block[],
  opts: TemplateOptions
): string {
  return markdown.replace(
    /\{\{#table\s+([^}]+)\}\}([\s\S]*?)\{\{\/table\s+\1\}\}/g,
    (_, slug: string, body: string) => {
      const trimmedSlug = slug.trim();
      const itemBlock = findItemisationBlockBySlug(blocks, trimmedSlug);
      const rows = (submissionData[trimmedSlug] as Record<string, unknown>[]) ?? [];

      if (!itemBlock || rows.length === 0) return "";

      const childFields = itemBlock.children ?? [];
      const lines = body.trim().split("\n").map((l) => l.trim()).filter(Boolean);

      // Find header row and template row (both start with |)
      const tableLines = lines.filter((l) => l.startsWith("|") && !l.startsWith("{{summary"));
      const summaryLines = lines.filter((l) => l.startsWith("{{summary"));

      if (tableLines.length < 2) return body; // Can't parse, return raw

      const headerRow = tableLines[0];
      const templateRow = tableLines[1];

      const headerCells = parseTemplateRow(headerRow);
      const templateCells = parseTemplateRow(templateRow);

      // Build separator
      const separator = "| " + headerCells.map(() => "---").join(" | ") + " |";

      // Render data rows
      const dataRows = rows.map((row) => {
        const valueMap = buildRowValueMap(
          row,
          childFields.map((c) => ({ id: c.id, properties: c.properties as { label?: string } }))
        );
        const cells = templateCells.map((cell) =>
          resolveCellTemplate(cell, valueMap, row, childFields, opts)
        );
        return "| " + cells.join(" | ") + " |";
      });

      // Render summary rows: {{summary Label = AGG({= expr}) | filter}}
      const summaryRows = summaryLines.map((line) => {
        const m = line.match(/\{\{summary\s+([^=]+)=\s*(\w+)\(([^)]+)\)(?:\s*\|\s*([^}]+))?\}\}/);
        if (!m) return "";
        const [, label, agg, sourceExpr, filter] = m;
        const aggFn = agg.trim().toUpperCase() as "SUM" | "COUNT" | "AVG" | "MIN" | "MAX";

        const values = rows.map((row) => {
          const valueMap = buildRowValueMap(
            row,
            childFields.map((c) => ({ id: c.id, properties: c.properties as { label?: string } }))
          );
          const expr = sourceExpr.trim().replace(/^\{=\s*/, "").replace(/\}$/, "");
          return evaluateExpression(expr, valueMap);
        });

        let result: number;
        switch (aggFn) {
          case "SUM": result = values.reduce((a, b) => a + b, 0); break;
          case "COUNT": result = values.length; break;
          case "AVG": result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
          case "MIN": result = Math.min(...values); break;
          case "MAX": result = Math.max(...values); break;
          default: result = 0;
        }

        const formattedVal = filter?.trim() ? applyFilter(result, filter.trim(), opts) : String(result);
        // Build a row with label in first col and value in last col
        const cells = headerCells.map((_, i) =>
          i === 0 ? `**${label.trim()}**` : i === headerCells.length - 1 ? formattedVal : ""
        );
        return "| " + cells.join(" | ") + " |";
      }).filter(Boolean);

      return [headerRow, separator, ...dataRows, ...summaryRows].join("\n");
    }
  );
}

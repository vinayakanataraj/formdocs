import type {
  Block,
  ItemisationTableConfig,
  ItemisationTableColumn,
  ItemisationTableStyle,
  ComputedField,
  SummaryField,
  ItemisationProps,
} from "@/lib/types";
import {
  evaluateExpression,
  buildRowValueMap,
  computeSummary,
} from "@/lib/itemisation/expression";

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Recursively find a block by ID (walks column_layout children too). */
export function findBlockById(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === "column_layout") {
      const cols = (block.properties as { columnDefs?: { blocks: Block[] }[] }).columnDefs ?? [];
      for (const col of cols) {
        const found = findBlockById(col.blocks, id);
        if (found) return found;
      }
    }
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function fontStyle(style: ItemisationTableStyle, section: "header" | "body"): string {
  const bold = section === "header" ? style.headerFontBold : style.bodyFontBold;
  const italic = section === "header" ? style.headerFontItalic : style.bodyFontItalic;
  const underline = section === "header" ? style.headerFontUnderline : style.bodyFontUnderline;
  const parts: string[] = [];
  if (bold) parts.push("font-weight: bold;");
  if (italic) parts.push("font-style: italic;");
  if (underline) parts.push("text-decoration: underline;");
  return parts.join(" ");
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatComputedValue(
  value: number,
  cf: ComputedField | undefined,
): string {
  if (!cf) return String(value);
  const dp = cf.decimalPlaces ?? 2;
  const formatted = value.toFixed(dp);
  if (cf.format === "currency" && cf.currencySymbol) {
    return `${cf.currencySymbol}${formatted}`;
  }
  return formatted;
}

function isNumericValue(v: unknown): boolean {
  if (typeof v === "number") return true;
  if (typeof v === "string" && v !== "" && !isNaN(Number(v))) return true;
  return false;
}

// ─── Build slug→label reverse map ───────────────────────────────────────────────

function buildSlugToLabelMap(children: Block[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const child of children) {
    const props = child.properties as { label?: string; slug?: string };
    const slug = props.slug ?? child.id;
    const label = props.label ?? child.id;
    map.set(slug, label);
  }
  return map;
}

// ─── Main builder ───────────────────────────────────────────────────────────────

/**
 * Convert itemisation row data into an HTML table string.
 * `rows` are already slug-keyed at this point.
 */
export function buildItemisationHtmlTable(
  rows: Record<string, unknown>[],
  block: Block,
  config: ItemisationTableConfig,
): string {
  const props = block.properties as ItemisationProps;
  const children = block.children ?? [];
  const computedFields = props.computedFields ?? [];
  const summaryFields = props.summaryFields ?? [];

  const visibleColumns = config.columns.filter((c) => c.visible);
  if (visibleColumns.length === 0) return "";

  const style = config.style;
  const cellStyle = "border: 1px solid #000000; padding: 6px 8px;";

  // Build slug→label map for expression evaluation
  const slugToLabel = buildSlugToLabelMap(children);

  // Build a map of computed field ID → ComputedField for lookup
  const computedFieldMap = new Map<string, ComputedField>();
  for (const cf of computedFields) {
    computedFieldMap.set(cf.id, cf);
  }

  // Build column → slug map: for field columns, find matching child by ID
  const columnSlugMap = new Map<string, string>();
  for (const col of visibleColumns) {
    if (col.type === "field") {
      const child = children.find((c) => c.id === col.id);
      if (child) {
        const props = child.properties as { slug?: string };
        columnSlugMap.set(col.id, props.slug ?? child.id);
      }
    }
  }

  // ─── <thead> ───────────────────────────────────────────────────────────────
  const headerBg = `background-color: ${esc(style.headerBgColor)};`;
  const headerFont = fontStyle(style, "header");
  const headerCells = visibleColumns
    .map((col) => `<th style="${cellStyle} ${headerBg} ${headerFont}">${esc(col.label)}</th>`)
    .join("");
  const thead = `<thead><tr>${headerCells}</tr></thead>`;

  // ─── <tbody> ───────────────────────────────────────────────────────────────
  const bodyBg = `background-color: ${esc(style.bodyBgColor)};`;
  const bodyFont = fontStyle(style, "body");

  const bodyRows = rows.map((row) => {
    // Build label-keyed value map for expression evaluation
    const labelValues: Record<string, number> = {};
    for (const [slug, value] of Object.entries(row)) {
      const label = slugToLabel.get(slug) ?? slug;
      labelValues[label] = typeof value === "number" ? value : parseFloat(String(value ?? "0")) || 0;
    }

    const cells = visibleColumns.map((col) => {
      let value: unknown;
      let isNumeric = false;

      if (col.type === "field") {
        const slug = columnSlugMap.get(col.id) ?? col.id;
        value = row[slug];
        isNumeric = isNumericValue(value);
      } else {
        // computed column — evaluate expression
        const cf = computedFieldMap.get(col.id);
        if (cf) {
          const numVal = evaluateExpression(cf.expression, labelValues);
          value = formatComputedValue(numVal, cf);
          isNumeric = true;
        } else {
          value = "";
        }
      }

      const align = isNumeric ? " text-align: right;" : "";
      return `<td style="${cellStyle} ${bodyBg} ${bodyFont}${align}">${esc(value)}</td>`;
    });

    return `<tr>${cells.join("")}</tr>`;
  }).join("");

  const tbody = `<tbody>${bodyRows}</tbody>`;

  // ─── <tfoot> ───────────────────────────────────────────────────────────────
  let tfoot = "";
  if (config.includeSummaryFooter && summaryFields.length > 0) {
    // For summary computation, we need id-keyed rows (not slug-keyed)
    // Rebuild id-keyed rows from slug-keyed rows
    const slugToId = new Map<string, string>();
    for (const child of children) {
      const props = child.properties as { slug?: string };
      slugToId.set(props.slug ?? child.id, child.id);
    }
    const idKeyedRows = rows.map((row) => {
      const idRow: Record<string, unknown> = {};
      for (const [slug, value] of Object.entries(row)) {
        const id = slugToId.get(slug) ?? slug;
        idRow[id] = value;
      }
      return idRow;
    });

    const footerRows = summaryFields.map((sf: SummaryField) => {
      const val = computeSummary(idKeyedRows, sf.sourceFieldId, sf.aggregation);
      const dp = sf.decimalPlaces ?? 2;
      let formatted = val.toFixed(dp);
      if (sf.format === "currency" && sf.currencySymbol) {
        formatted = `${sf.currencySymbol}${formatted}`;
      }

      // Find which visible column index the source field occupies
      const sourceColIdx = visibleColumns.findIndex((c) => c.id === sf.sourceFieldId);

      const cells = visibleColumns.map((_, i) => {
        if (i === 0) {
          return `<td style="${cellStyle} ${headerBg} ${headerFont}">${esc(sf.label)}</td>`;
        }
        if (i === sourceColIdx) {
          return `<td style="${cellStyle} ${headerBg} ${headerFont} text-align: right;">${esc(formatted)}</td>`;
        }
        return `<td style="${cellStyle} ${headerBg}"></td>`;
      });

      return `<tr>${cells.join("")}</tr>`;
    });

    tfoot = `<tfoot>${footerRows.join("")}</tfoot>`;
  }

  return `<table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; border: 1px solid #000000;">${thead}${tbody}${tfoot}</table>`;
}

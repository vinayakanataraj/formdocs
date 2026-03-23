import type { Block } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ParsedTableBlock {
  slug: string;
  startIndex: number; // char offset of {{#table
  endIndex: number; // char offset after {{/table slug}}\n or end of match
  visibleColumnLabels: string[];
  computedColumns: {
    label: string;
    expression: string;
    format: "none" | "currency";
  }[];
  summaryLines: string[]; // raw {{summary ...}} lines to preserve
}

/* ------------------------------------------------------------------ */
/*  Parse all table blocks                                             */
/* ------------------------------------------------------------------ */

const TABLE_BLOCK_RE =
  /\{\{#table\s+(\w+)\}\}\n([\s\S]*?)\{\{\/table\s+\1\}\}\n?/g;

export function parseTableBlocks(markdown: string): ParsedTableBlock[] {
  const results: ParsedTableBlock[] = [];

  for (const match of markdown.matchAll(TABLE_BLOCK_RE)) {
    const slug = match[1];
    const startIndex = match.index!;
    const endIndex = startIndex + match[0].length;
    const body = match[2];

    const lines = body.split("\n").filter((l) => l.trim().length > 0);

    // We expect: header row, template row, optional summary rows
    const headerLine = lines[0] ?? "";
    const templateLine = lines[1] ?? "";

    // Parse header labels
    const headers = headerLine
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Parse template cells
    const cells = templateLine
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const visibleColumnLabels: string[] = [];
    const computedColumns: ParsedTableBlock["computedColumns"] = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const label = headers[i] ?? `Column ${i + 1}`;

      // Computed column: {= expr} or {= expr | currency}
      const computedMatch = cell.match(
        /^\{=\s*(.+?)\s*(?:\|\s*currency\s*)?\}$/
      );
      if (computedMatch) {
        const hasCurrency = /\|\s*currency\s*\}$/.test(cell);
        computedColumns.push({
          label,
          expression: computedMatch[1],
          format: hasCurrency ? "currency" : "none",
        });
      } else {
        // Field column: {Label} or {Label | currency}
        visibleColumnLabels.push(label);
      }
    }

    // Collect summary lines (lines 2+)
    const summaryLines = lines.slice(2).filter((l) => l.trim().startsWith("{{summary"));

    results.push({
      slug,
      startIndex,
      endIndex,
      visibleColumnLabels,
      computedColumns,
      summaryLines,
    });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Find table at cursor position                                      */
/* ------------------------------------------------------------------ */

export function findTableAtCursor(
  markdown: string,
  cursorPos: number
): ParsedTableBlock | null {
  const blocks = parseTableBlocks(markdown);
  return (
    blocks.find((b) => cursorPos >= b.startIndex && cursorPos <= b.endIndex) ??
    null
  );
}

/* ------------------------------------------------------------------ */
/*  Reconstruct modal config from parsed block                         */
/* ------------------------------------------------------------------ */

export interface ColumnEntry {
  id: string;
  label: string;
  type: string;
  visible: boolean;
}

export interface ComputedColumn {
  id: string;
  label: string;
  expression: string;
  format: "none" | "currency";
}

export function reconstructConfig(
  parsed: ParsedTableBlock,
  block: Block
): { columns: ColumnEntry[]; computedColumns: ComputedColumn[] } {
  const children = block.children ?? [];

  // Build entries for all children, initially invisible
  const allEntries: ColumnEntry[] = children.map((c) => {
    const cp = c.properties as { label?: string };
    return {
      id: c.id,
      label: cp.label ?? c.id,
      type: c.type,
      visible: false,
    };
  });

  // Mark visible ones based on parsed labels, and collect them in order
  const visibleOrdered: ColumnEntry[] = [];
  const matched = new Set<string>();

  for (const label of parsed.visibleColumnLabels) {
    const entry = allEntries.find(
      (e) => e.label === label && !matched.has(e.id)
    );
    if (entry) {
      entry.visible = true;
      matched.add(entry.id);
      visibleOrdered.push(entry);
    }
  }

  // Invisible entries keep their original order
  const invisibleEntries = allEntries.filter((e) => !matched.has(e.id));

  // Final order: visible first (in parsed order), then invisible
  const columns = [...visibleOrdered, ...invisibleEntries];

  // Build computed columns
  const computedColumns: ComputedColumn[] = parsed.computedColumns.map((c) => ({
    id: Math.random().toString(36).slice(2, 9),
    label: c.label,
    expression: c.expression,
    format: c.format,
  }));

  return { columns, computedColumns };
}

/* ------------------------------------------------------------------ */
/*  Find a block by slug in the form block tree                        */
/* ------------------------------------------------------------------ */

export function findBlockBySlug(
  blocks: Block[],
  slug: string
): Block | null {
  for (const block of blocks) {
    const p = block.properties as { slug?: string; label?: string };
    if (
      (block.type === "itemisation" || block.type === "itemisation_advanced") &&
      (p.slug === slug ||
        p.label?.toLowerCase().replace(/\s+/g, "_") === slug)
    ) {
      return block;
    }
    // Check inside column_layout children
    if (block.type === "column_layout" && block.children) {
      const found = findBlockBySlug(block.children, slug);
      if (found) return found;
    }
  }
  return null;
}

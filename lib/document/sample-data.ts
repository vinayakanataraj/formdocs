/**
 * Client-side sample data generator for document preview.
 * Produces deterministic, field-type-aware values.
 */

import type {
  Block,
  ShortTextProps,
  NumberProps,
  CurrencyProps,
  DateProps,
  SingleSelectProps,
  MultiSelectProps,
  RatingProps,
  PhoneProps,
  ColumnLayoutProps,
} from "@/lib/types";

const CONTENT_TYPES = new Set([
  "heading1", "heading2", "heading3", "paragraph", "divider",
  "spacer", "page_break", "bulleted_list", "numbered_list",
  "quote", "callout",
]);

function slugOf(block: Block): string {
  const p = block.properties as { slug?: string; label?: string };
  return p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
}

function guessShortText(label?: string): string {
  if (!label) return "Acme Industries";
  const l = label.toLowerCase();
  if (l.includes("name") && l.includes("company")) return "Acme Industries";
  if (l.includes("name")) return "John Doe";
  if (l.includes("address")) return "42 Maple Street, Bengaluru";
  if (l.includes("city")) return "Bengaluru";
  if (l.includes("state") || l.includes("province")) return "Karnataka";
  if (l.includes("country")) return "India";
  if (l.includes("pin") || l.includes("zip") || l.includes("postal")) return "560001";
  if (l.includes("gst") || l.includes("tax")) return "29ABCDE1234F1Z5";
  if (l.includes("pan")) return "ABCDE1234F";
  return "Acme Industries";
}

function sampleForBlock(block: Block, rowIndex?: number): unknown {
  const p = block.properties as Record<string, unknown>;
  const multiplier = rowIndex != null ? rowIndex + 1 : 1;

  switch (block.type) {
    case "short_text":
      return guessShortText(p.label as string | undefined);

    case "long_text":
      return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

    case "email":
      return "john@example.com";

    case "phone": {
      const pp = block.properties as PhoneProps;
      return pp.countryCode !== false ? "+91 98765 43210" : "98765 43210";
    }

    case "number": {
      const np = block.properties as NumberProps;
      let val: number;
      if (np.min != null && np.max != null) {
        val = Math.round(((np.min + np.max) / 2) * multiplier * 100) / 100;
      } else {
        val = 42 * multiplier;
      }
      if (np.decimalPrecision != null) {
        val = parseFloat(val.toFixed(np.decimalPrecision));
      }
      return val;
    }

    case "currency": {
      const cp = block.properties as CurrencyProps;
      let val = 2500 * multiplier;
      if (cp.decimalPlaces != null) {
        val = parseFloat(val.toFixed(cp.decimalPlaces));
      }
      return val;
    }

    case "date": {
      const dp = block.properties as DateProps;
      const base = "2026-01-15";
      if (dp.dateFormat) {
        // Return ISO date — template engine handles formatting
        return base;
      }
      return base;
    }

    case "single_select": {
      const sp = block.properties as SingleSelectProps;
      return sp.options?.[0] ?? "Option A";
    }

    case "multi_select": {
      const mp = block.properties as MultiSelectProps;
      const opts = mp.options ?? ["Option A", "Option B"];
      return opts.slice(0, 2).join(", ");
    }

    case "rating": {
      const rp = block.properties as RatingProps;
      return Math.ceil((rp.maxStars ?? 5) * 0.8);
    }

    case "yes_no":
      return "Yes";

    case "file_upload":
      return "document.pdf";

    default:
      return `Sample ${(p.label as string) ?? block.type}`;
  }
}

export function buildSampleData(blocks: Block[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const block of blocks) {
    if (CONTENT_TYPES.has(block.type)) continue;

    if (block.type === "column_layout") {
      const cp = block.properties as ColumnLayoutProps;
      for (const col of cp.columnDefs ?? []) {
        Object.assign(data, buildSampleData(col.blocks));
      }
      continue;
    }

    if (block.type === "itemisation" || block.type === "itemisation_advanced") {
      const slug = slugOf(block);
      const rows: Record<string, unknown>[] = [];
      for (let i = 0; i < 3; i++) {
        const row: Record<string, unknown> = {};
        for (const child of block.children ?? []) {
          if (CONTENT_TYPES.has(child.type)) continue;
          row[slugOf(child)] = sampleForBlock(child, i);
        }
        rows.push(row);
      }
      data[slug] = rows;
      continue;
    }

    data[slugOf(block)] = sampleForBlock(block);
  }

  return data;
}

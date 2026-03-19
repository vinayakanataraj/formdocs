import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/[\s]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

const FIELD_BLOCK_TYPES = new Set([
  "short_text", "long_text", "email", "phone", "number", "currency",
  "date", "single_select", "multi_select", "file_upload", "rating", "yes_no",
  "itemisation",
]);

/** Ensure every field/itemisation block (and its children) has a non-empty slug. */
export function ensureBlockSlugs<T extends { id: string; type: string; properties: object; children?: T[] }>(
  blocks: T[],
  usedSlugs = new Set<string>()
): T[] {
  return blocks.map((block) => {
    const children = block.children
      ? ensureBlockSlugs(block.children, usedSlugs)
      : block.children;

    // Recurse into column_layout columnDefs
    let properties = block.properties as Record<string, unknown>;
    if (block.type === "column_layout") {
      const p = properties as { columnDefs?: Array<{ id: string; span: number; blocks: T[] }> };
      if (p.columnDefs) {
        const newDefs = p.columnDefs.map((col) => ({
          ...col,
          blocks: ensureBlockSlugs(col.blocks, usedSlugs),
        }));
        properties = { ...properties, columnDefs: newDefs };
      }
    }

    if (!FIELD_BLOCK_TYPES.has(block.type)) {
      const changed = children !== block.children || properties !== (block.properties as Record<string, unknown>);
      return changed ? { ...block, properties: properties as T["properties"], children } : block;
    }

    const p2 = properties as Record<string, unknown>;
    const existingSlug = p2.slug as string | undefined;
    if (existingSlug && existingSlug.trim() !== "") {
      usedSlugs.add(existingSlug);
      const changed = children !== block.children || properties !== (block.properties as Record<string, unknown>);
      return changed ? { ...block, properties: properties as T["properties"], children } : block;
    }

    // Derive slug from label, de-duplicate with a numeric suffix if needed
    const base = slugify((p2.label as string | undefined) ?? block.type) || block.type;
    let candidate = base;
    let n = 1;
    while (usedSlugs.has(candidate)) {
      candidate = `${base}_${n++}`;
    }
    usedSlugs.add(candidate);
    return { ...block, properties: { ...p2, slug: candidate } as T["properties"], children };
  });
}

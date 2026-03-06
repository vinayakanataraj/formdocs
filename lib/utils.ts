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
export function ensureBlockSlugs<T extends { id: string; type: string; properties: any; children?: T[] }>(
  blocks: T[],
  usedSlugs = new Set<string>()
): T[] {
  return blocks.map((block) => {
    const children = block.children
      ? ensureBlockSlugs(block.children, usedSlugs)
      : block.children;

    if (!FIELD_BLOCK_TYPES.has(block.type)) {
      return children !== block.children ? { ...block, children } : block;
    }

    const p = block.properties;
    if (p.slug && p.slug.trim() !== "") {
      usedSlugs.add(p.slug);
      return children !== block.children ? { ...block, children } : block;
    }

    // Derive slug from label, de-duplicate with a numeric suffix if needed
    let base = slugify(p.label ?? block.type) || block.type;
    let candidate = base;
    let n = 1;
    while (usedSlugs.has(candidate)) {
      candidate = `${base}_${n++}`;
    }
    usedSlugs.add(candidate);
    return { ...block, properties: { ...p, slug: candidate }, children };
  });
}

import { put, get, del, head, list } from "@vercel/blob";
import type { Form, FormMeta } from "@/lib/types";

const PREFIX = "forms/";
const VALID_SLUG = /^[a-z0-9-]+$/;

function blobPath(slug: string) {
  return `${PREFIX}${slug}.json`;
}

export async function listForms(): Promise<FormMeta[]> {
  const metas: FormMeta[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: PREFIX, cursor });
    for (const blob of result.blobs) {
      if (!blob.pathname.endsWith(".json")) continue;
      try {
        const res = await get(blob.pathname, { access: "private" });
        if (!res) continue;
        const form: Form = JSON.parse(await new Response(res.stream).text());
        metas.push(form.meta);
      } catch {
        // skip malformed
      }
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return metas.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getForm(slug: string): Promise<Form | null> {
  if (!VALID_SLUG.test(slug)) return null;
  try {
    const res = await get(blobPath(slug), { access: "private" });
    if (!res) return null;
    return JSON.parse(await new Response(res.stream).text()) as Form;
  } catch {
    return null;
  }
}

export async function saveForm(form: Form): Promise<void> {
  await put(blobPath(form.meta.slug), JSON.stringify(form, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function deleteForm(slug: string): Promise<void> {
  if (!VALID_SLUG.test(slug)) return;
  await del(blobPath(slug));
}

export async function formExists(slug: string): Promise<boolean> {
  if (!VALID_SLUG.test(slug)) return false;
  try {
    await head(blobPath(slug));
    return true;
  } catch {
    return false;
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

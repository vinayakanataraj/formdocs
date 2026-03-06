import fs from "fs/promises";
import path from "path";
import type { Form, FormMeta } from "@/lib/types";

const FORMS_DIR = path.join(process.cwd(), "data", "forms");

async function ensureFormsDir() {
  await fs.mkdir(FORMS_DIR, { recursive: true });
}

const VALID_SLUG = /^[a-z0-9-]+$/;

export async function listForms(): Promise<FormMeta[]> {
  await ensureFormsDir();
  const files = await fs.readdir(FORMS_DIR);
  const metas: FormMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(FORMS_DIR, file), "utf-8");
      const form: Form = JSON.parse(raw);
      metas.push(form.meta);
    } catch {
      // skip malformed files
    }
  }

  return metas.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getForm(slug: string): Promise<Form | null> {
  if (!VALID_SLUG.test(slug)) return null;
  await ensureFormsDir();
  const filePath = path.join(FORMS_DIR, `${slug}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Form;
  } catch {
    return null;
  }
}

export async function saveForm(form: Form): Promise<void> {
  await ensureFormsDir();
  const filePath = path.join(FORMS_DIR, `${form.meta.slug}.json`);
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(form, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function deleteForm(slug: string): Promise<void> {
  if (!VALID_SLUG.test(slug)) return;
  await ensureFormsDir();
  const filePath = path.join(FORMS_DIR, `${slug}.json`);
  await fs.unlink(filePath);
}

export async function formExists(slug: string): Promise<boolean> {
  if (!VALID_SLUG.test(slug)) return false;
  await ensureFormsDir();
  try {
    await fs.access(path.join(FORMS_DIR, `${slug}.json`));
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

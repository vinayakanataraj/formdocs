/**
 * Storage for generated PDF documents.
 * Files stored at: data/documents/{slug}/{timestamp}-{random}.pdf
 */

import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.join(process.cwd(), "data", "documents");

export interface DocumentInfo {
  filename: string;
  slug: string;
  generatedAt: string;
  size: number;
  path: string;
}

export function saveGeneratedDocument(
  slug: string,
  pdfBuffer: Buffer,
  metadata: { formSlug: string; formTitle: string; generatedAt: string }
): string {
  const dir = path.join(DOCUMENTS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${random}.pdf`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, pdfBuffer);

  // Save metadata sidecar
  fs.writeFileSync(
    path.join(dir, `${timestamp}-${random}.json`),
    JSON.stringify(metadata, null, 2)
  );

  return filePath;
}

export function listGeneratedDocuments(slug: string): DocumentInfo[] {
  const dir = path.join(DOCUMENTS_DIR, slug);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".pdf"));
  return files
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);
      const match = filename.match(/^(\d+)-/);
      const ts = match ? parseInt(match[1]) : stat.mtimeMs;
      return {
        filename,
        slug,
        generatedAt: new Date(ts).toISOString(),
        size: stat.size,
        path: filePath,
      };
    })
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function getGeneratedDocument(slug: string, filename: string): Buffer | null {
  // Sanitize filename to prevent path traversal
  const sanitized = path.basename(filename);
  if (!sanitized.endsWith(".pdf") || sanitized !== filename) return null;

  const filePath = path.join(DOCUMENTS_DIR, slug, sanitized);
  if (!fs.existsSync(filePath)) return null;

  return fs.readFileSync(filePath);
}

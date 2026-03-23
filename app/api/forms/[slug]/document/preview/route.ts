import { NextRequest, NextResponse } from "next/server";
import { getForm } from "@/lib/forms";
import { isAdminRequestValid } from "@/lib/auth";
import { generateDocument } from "@/lib/document/generate";
import { ensureBlockSlugs } from "@/lib/utils";
import type { Block } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

function buildSampleData(blocks: Block[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const block of blocks) {
    if (block.type === "column_layout") {
      const p = block.properties as { columnDefs?: Array<{ blocks: Block[] }> };
      for (const col of p.columnDefs ?? []) {
        Object.assign(data, buildSampleData(col.blocks));
      }
    } else if (block.type === "itemisation" || block.type === "itemisation_advanced") {
      const p = block.properties as { slug?: string; label?: string };
      const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
      const sampleRow: Record<string, unknown> = {};
      for (const child of block.children ?? []) {
        const cp = child.properties as { slug?: string; label?: string };
        const childSlug = cp.slug ?? cp.label?.toLowerCase().replace(/\s+/g, "_") ?? child.id;
        if (child.type === "currency" || child.type === "number") {
          sampleRow[childSlug] = 1000;
        } else {
          sampleRow[childSlug] = `Sample ${cp.label ?? child.type}`;
        }
      }
      data[slug] = [sampleRow, { ...sampleRow }];
    } else {
      const p = block.properties as { slug?: string; label?: string };
      const slug = p.slug ?? p.label?.toLowerCase().replace(/\s+/g, "_") ?? block.id;
      if (slug && block.type !== "heading1" && block.type !== "heading2" &&
          block.type !== "heading3" && block.type !== "paragraph" &&
          block.type !== "divider" && block.type !== "spacer" &&
          block.type !== "page_break" && block.type !== "bulleted_list" &&
          block.type !== "numbered_list" && block.type !== "quote" &&
          block.type !== "callout") {
        data[slug] = `Sample ${p.label ?? block.type}`;
      }
    }
  }
  return data;
}

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequestValid(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  try {
    const normalizedBlocks = ensureBlockSlugs(form.blocks);
    const sampleData = buildSampleData(normalizedBlocks);

    const doc = generateDocument({ form, submissionData: sampleData });
    return NextResponse.json({ markdown: doc.markdown, metadata: doc.metadata });
  } catch (err) {
    console.error("Preview generation error:", err);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}

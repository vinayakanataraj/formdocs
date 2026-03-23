import { NextRequest, NextResponse } from "next/server";
import { getForm } from "@/lib/forms";
import { isAdminRequestValid } from "@/lib/auth";
import { generateDocument } from "@/lib/document/generate";
import { renderPdf } from "@/lib/document/pdf-renderer";
import { saveGeneratedDocument } from "@/lib/document/storage";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequestValid(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!form.documentTemplate?.enabled) {
    return NextResponse.json({ error: "Document template not enabled" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { submissionData?: Record<string, unknown>; format?: string };
    const submissionData = body.submissionData ?? {};
    const format = body.format ?? "pdf";

    const doc = generateDocument({ form, submissionData });

    if (format === "markdown") {
      return NextResponse.json({ markdown: doc.markdown, metadata: doc.metadata });
    }

    const pdfBuffer = await renderPdf({
      markdown: doc.markdown,
      branding: form.documentTemplate.branding,
      accentColor: form.meta.accentColor ?? "#0f172a",
    });

    saveGeneratedDocument(slug, pdfBuffer, doc.metadata);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}-quotation.pdf"`,
      },
    });
  } catch (err) {
    console.error("Document generation error:", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}

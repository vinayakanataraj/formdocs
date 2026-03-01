import { NextRequest, NextResponse } from "next/server";
import { getForm, saveForm, deleteForm, formExists } from "@/lib/forms";
import { isAdminRequestValid as isAdminRequest } from "@/lib/auth";
import { formSchema } from "@/lib/blocks/schemas";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ form });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  try {
    const body = await req.json();
    const result = formSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid form data", details: result.error.flatten() }, { status: 400 });
    }

    const form = result.data;
    // Ensure slug in URL matches slug in body
    if (form.meta.slug !== slug) {
      return NextResponse.json({ error: "Slug mismatch" }, { status: 400 });
    }

    form.meta.updatedAt = new Date().toISOString();
    await saveForm(form as any);
    return NextResponse.json({ form });
  } catch (err) {
    console.error("PUT /api/forms/[slug] error:", err);
    return NextResponse.json({ error: "Failed to save form" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  if (!(await formExists(slug))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteForm(slug);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { listForms, saveForm, formExists, slugify } from "@/lib/forms";
import { isAdminRequestValid as isAdminRequest } from "@/lib/auth";
import { nanoid } from "nanoid";
import { createDefaultForm } from "@/lib/form-defaults";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forms = await listForms();
  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(title) || `form-${nanoid(6)}`;
    let attempt = 0;
    while (await formExists(slug)) {
      attempt++;
      slug = `${slugify(title)}-${attempt}`;
    }

    const form = createDefaultForm(slug, title);

    await saveForm(form);
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    console.error("POST /api/forms error:", err);
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { listForms, saveForm, formExists, slugify } from "@/lib/forms";
import { isAdminRequestValid as isAdminRequest } from "@/lib/auth";
import { formSchema } from "@/lib/blocks/schemas";
import type { Form } from "@/lib/types";
import { nanoid } from "nanoid";

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

    const now = new Date().toISOString();
    const form: Form = {
      meta: {
        title,
        slug,
        description: "",
        coverImageUrl: "",
        iconEmoji: "",
        accentColor: "#0f172a",
        logoUrl: "",
        footerText: "",
        submitButtonText: "Submit",
        successMessage: "Thank you! Your response has been submitted.",
        redirectUrl: "",
        createdAt: now,
        updatedAt: now,
      },
      webhook: {
        url: "",
        method: "POST",
        headers: [{ key: "Content-Type", value: "application/json" }],
        payloadFormat: "json",
        retries: 2,
        timeoutSeconds: 10,
      },
      blocks: [],
    };

    await saveForm(form);
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    console.error("POST /api/forms error:", err);
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}

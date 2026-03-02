import { NextRequest, NextResponse } from "next/server";
import { getForm } from "@/lib/forms";
import { isAdminRequestValid } from "@/lib/auth";
import { buildSubmissionSchema } from "@/lib/validation/form-schema";
import type { WebhookPayload, WebhookHeader } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

// ─── SSRF protection ──────────────────────────────────────────────────────────

function isSafeWebhookUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const h = url.hostname;
    // Block loopback, private ranges, link-local, and cloud metadata endpoints
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") return false;
    if (h === "169.254.169.254") return false; // AWS/GCP metadata
    if (/^10\.\d+\.\d+\.\d+$/.test(h)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h)) return false;
    if (/^192\.168\.\d+\.\d+$/.test(h)) return false;
    if (h.endsWith(".internal") || h.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Webhook header builder ───────────────────────────────────────────────────

function buildHeaders(webhookHeaders: WebhookHeader[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const { key, value } of webhookHeaders) {
    if (key) headers[key] = value;
  }
  return headers;
}

// ─── Retry with exponential backoff ──────────────────────────────────────────

async function sendWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  timeoutMs: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError ?? new Error("Webhook request failed");
}

// ─── POST: public form submission ─────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const form = await getForm(slug);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (!form.webhook.url) {
    return NextResponse.json({ error: "No webhook configured" }, { status: 400 });
  }

  if (!isSafeWebhookUrl(form.webhook.url)) {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
  }

  try {
    const submission = await req.json();

    // Reconstruct flat data for server-side schema validation
    // Client sends { fields: { id: { label, value } }, itemisations: { id: rows[] } }
    const flatData: Record<string, unknown> = {};
    for (const [id, fieldData] of Object.entries(submission.fields ?? {})) {
      flatData[id] = (fieldData as any)?.value;
    }
    for (const [id, rows] of Object.entries(submission.itemisations ?? {})) {
      flatData[id] = rows;
    }
    const schema = buildSubmissionSchema(form.blocks);
    const result = schema.safeParse(flatData);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid submission", details: result.error.flatten() },
        { status: 422 }
      );
    }

    const payload: WebhookPayload = {
      meta: {
        slug: form.meta.slug,
        title: form.meta.title,
        submittedAt: new Date().toISOString(),
        userAgent: req.headers.get("user-agent") ?? undefined,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? undefined,
      },
      fields: submission.fields ?? {},
      itemisations: submission.itemisations ?? {},
    };

    const headers = buildHeaders(form.webhook.headers);

    let body: string;
    if (form.webhook.payloadFormat === "form_urlencoded") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams({ data: JSON.stringify(payload) }).toString();
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    const response = await sendWithRetry(
      form.webhook.url,
      { method: form.webhook.method, headers, body },
      form.webhook.retries,
      form.webhook.timeoutSeconds * 1000
    );

    if (!response.ok) {
      console.error(`Webhook returned ${response.status} for form ${slug}`);
      return NextResponse.json(
        { error: "Webhook returned an error", status: response.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: "Failed to deliver submission" }, { status: 500 });
  }
}

// ─── PUT: test webhook (admin only) ──────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequestValid(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const form = await getForm(slug);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (!form.webhook.url) return NextResponse.json({ error: "No webhook URL configured" }, { status: 400 });

  if (!isSafeWebhookUrl(form.webhook.url)) {
    return NextResponse.json({ error: "Webhook URL targets a disallowed address" }, { status: 400 });
  }

  const samplePayload: WebhookPayload = {
    meta: {
      slug: form.meta.slug,
      title: form.meta.title,
      submittedAt: new Date().toISOString(),
      userAgent: "Formdocs-Test/1.0",
    },
    fields: Object.fromEntries(
      form.blocks
        .filter((b) =>
          ["short_text", "long_text", "email", "phone", "number", "currency", "date",
            "single_select", "multi_select", "rating", "yes_no"].includes(b.type)
        )
        .map((b) => {
          const props = b.properties as any;
          return [b.id, { label: props.label ?? b.type, value: `[sample ${b.type}]` }];
        })
    ),
    itemisations: {},
  };

  const headers = buildHeaders(form.webhook.headers);
  headers["Content-Type"] = "application/json";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), form.webhook.timeoutSeconds * 1000);
    const response = await fetch(form.webhook.url, {
      method: form.webhook.method,
      headers,
      body: JSON.stringify(samplePayload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import type { Form } from "@/lib/types";

// Shared factory — safe to import from both client (editor store) and server (API routes).
export function createDefaultForm(slug: string, title: string = ""): Form {
  const now = new Date().toISOString();
  return {
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
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { Block, BaseBlockProps, Form } from "@/lib/types";
import { buildSubmissionSchema } from "@/lib/validation/form-schema";
import FormBlockRenderer from "@/components/form/form-block-renderer";
import ProgressBar from "@/components/form/progress-bar";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface FormRendererProps {
  form: Form;
}

// Split blocks into pages at PageBreak blocks
function splitIntoPages(blocks: Block[]): Block[][] {
  const pages: Block[][] = [[]];
  for (const block of blocks) {
    if (block.type === "page_break") {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(block);
    }
  }
  return pages;
}

const LAYOUT_TYPES = new Set(["heading1","heading2","heading3","paragraph","bulleted_list",
  "numbered_list","quote","callout","divider","spacer","page_break","column_layout"]);

// Get all field block IDs that are required (flat, for progress tracking)
function getRequiredFieldIds(blocks: Block[]): string[] {
  const ids: string[] = [];
  for (const b of blocks) {
    if ((b.properties as BaseBlockProps).required) ids.push(b.id);
    if (b.children) ids.push(...getRequiredFieldIds(b.children));
  }
  return ids;
}

// Get all field block IDs on a page (required or not), for page-transition validation
function getAllFieldIds(blocks: Block[]): string[] {
  const ids: string[] = [];
  for (const b of blocks) {
    if (!LAYOUT_TYPES.has(b.type)) ids.push(b.id);
    if (b.children) ids.push(...getAllFieldIds(b.children));
  }
  return ids;
}

const STORAGE_KEY = (slug: string) => `formdocs_autosave_${slug}`;

// Mirror the visibility check from form-block-renderer to filter hidden fields before submission
function isBlockVisible(block: Block, values: Record<string, unknown>): boolean {
  const rule = (block.properties as BaseBlockProps)?.visibilityRule;
  if (!rule) return true;
  const refValue = values[rule.fieldId];
  switch (rule.operator) {
    case "equals": return String(refValue) === String(rule.value);
    case "not_equals": return String(refValue) !== String(rule.value);
    case "contains": return String(refValue).includes(String(rule.value));
    case "is_empty": return refValue === undefined || refValue === null || refValue === "";
    case "is_not_empty": return refValue !== undefined && refValue !== null && refValue !== "";
    default: return true;
  }
}

export default function FormRenderer({ form }: FormRendererProps) {
  const router = useRouter();
  const pages = useMemo(() => splitIntoPages(form.blocks), [form.blocks]);
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<{ status: number; body: string } | null>(null);

  const schema = useMemo(() => buildSubmissionSchema(form.blocks), [form.blocks]);
  const requiredIds = useMemo(() => getRequiredFieldIds(form.blocks), [form.blocks]);

  const methods = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {},
  });

  const { watch, handleSubmit, trigger } = methods;
  const values = watch();
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Restore autosave on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY(form.meta.slug));
      if (saved) methods.reset(JSON.parse(saved));
    } catch {}
  }, [form.meta.slug, methods]);

  // Debounced autosave (500ms) — avoids writing to sessionStorage on every keystroke
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY(form.meta.slug), JSON.stringify(values));
      } catch {}
    }, 500);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [values, form.meta.slug]);

  // Progress: count how many required fields have values
  const progress = useMemo(() => {
    if (requiredIds.length === 0) return 100;
    const filled = requiredIds.filter((id) => {
      const v = (values as Record<string, unknown>)[id];
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });
    return Math.round((filled.length / requiredIds.length) * 100);
  }, [values, requiredIds]);

  const isLastPage = currentPage === pages.length - 1;
  const isMultiPage = pages.length > 1;

  async function handleNext() {
    // Validate ALL fields on the current page (required and non-required)
    const currentPageFieldIds = getAllFieldIds(pages[currentPage]);
    const valid = await trigger(currentPageFieldIds as Parameters<typeof trigger>[0]);
    if (valid) setCurrentPage((p) => p + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build webhook payload — exclude fields hidden by visibility rules
      const fields: Record<string, { label: string; value: unknown }> = {};
      const itemisations: Record<string, unknown[]> = {};

      for (const block of form.blocks) {
        // Skip fields that are currently hidden by visibility rules
        if (!isBlockVisible(block, data as Record<string, unknown>)) continue;

        if (block.type === "itemisation") {
          itemisations[block.id] = data[block.id] ?? [];
        } else if (data[block.id] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const props = block.properties as any;
          fields[block.id] = { label: props.label ?? block.type, value: data[block.id] };
        }
      }

      const res = await fetch(`/api/submit/${form.meta.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, itemisations }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        sessionStorage.removeItem(STORAGE_KEY(form.meta.slug));
        if (form.meta.redirectUrl && !result.webhookResponse) {
          router.push(form.meta.redirectUrl);
        } else {
          if (result.webhookResponse) setWebhookResponse(result.webhookResponse);
          setSubmitted(true);
        }
      } else if (result.webhookResponse) {
        // waitForResponse is on and webhook returned a non-2xx — show the error response
        sessionStorage.removeItem(STORAGE_KEY(form.meta.slug));
        setWebhookResponse(result.webhookResponse);
        setSubmitted(true);
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const isWebhookError = webhookResponse && webhookResponse.status >= 300;
    const StatusIcon = webhookResponse
      ? webhookResponse.status >= 500
        ? XCircle
        : webhookResponse.status >= 400
          ? AlertTriangle
          : CheckCircle
      : CheckCircle;
    const iconColor = webhookResponse
      ? webhookResponse.status >= 500
        ? "text-destructive"
        : webhookResponse.status >= 400
          ? "text-amber-500"
          : "text-green-500"
      : "text-green-500";

    return (
      <div className="text-center py-16 space-y-4">
        <StatusIcon className={`w-12 h-12 ${iconColor} mx-auto`} />
        <h2 className="text-xl font-semibold">
          {isWebhookError
            ? `Server returned an error (HTTP ${webhookResponse.status})`
            : (form.meta.successMessage || "Thank you! Your response has been submitted.")}
        </h2>
        {webhookResponse != null && (
          <div className="mt-2 mx-auto max-w-lg text-left">
            <div className={`p-4 rounded-md text-xs ${isWebhookError ? "bg-destructive/10 border border-destructive/20" : "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"}`}>
              <p className="font-medium text-muted-foreground mb-2">Response (HTTP {webhookResponse.status})</p>
              <pre className="text-foreground whitespace-pre-wrap break-words font-mono">
                {webhookResponse.body || "(empty response body)"}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      {/* Progress bar */}
      <ProgressBar progress={progress} />

      {/* Multi-page indicator */}
      {isMultiPage && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 mt-2">
          <span>Step {currentPage + 1} of {pages.length}</span>
          <span>{progress}% complete</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Render current page's blocks */}
        {pages[currentPage]?.map((block) => (
          <FormBlockRenderer key={block.id} block={block} allValues={values} />
        ))}

        {/* Error message */}
        {submitError && (
          <div className="p-4 rounded-[4px] bg-destructive/10 border-none text-sm text-destructive">
            {submitError}
            <button
              type="submit"
              disabled={submitting}
              className="ml-3 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          {isMultiPage && currentPage > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-6 py-2.5 text-sm border border-border rounded-[4px] hover:bg-muted transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {!isLastPage ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 transition-colors"
              style={form.meta.accentColor ? { backgroundColor: form.meta.accentColor } : undefined}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={form.meta.accentColor ? { backgroundColor: form.meta.accentColor } : undefined}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting
                ? (form.webhook.waitForResponse ? "Waiting for response…" : "Submitting…")
                : (form.meta.submitButtonText || "Submit")}
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

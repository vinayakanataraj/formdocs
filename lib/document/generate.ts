/**
 * Core document generation orchestrator.
 * Produces a Markdown document from form + submission data.
 */

import type { Form } from "@/lib/types";
import { interpolateTemplate, processTableBlocks } from "./template-engine";

export interface GenerateDocumentInput {
  form: Form;
  submissionData: Record<string, unknown>;
}

export interface GenerateDocumentOutput {
  markdown: string;
  metadata: {
    formSlug: string;
    formTitle: string;
    generatedAt: string;
  };
}

export function generateDocument(input: GenerateDocumentInput): GenerateDocumentOutput {
  const { form, submissionData } = input;
  const template = form.documentTemplate;

  if (!template || !template.markdown) {
    return {
      markdown: "",
      metadata: {
        formSlug: form.meta.slug,
        formTitle: form.meta.title,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  const { branding } = template;
  const opts = {
    currencySymbol: branding.currencySymbol,
    numberFormat: branding.numberFormat,
    decimalPlaces: 2,
  };

  // Build template variables: form fields + built-ins
  const variables: Record<string, unknown> = {
    ...submissionData,
    company_name: branding.companyName,
    form_title: form.meta.title,
    date: new Date().toLocaleDateString("en-IN"),
  };

  // First pass: process {{#table slug}}...{{/table slug}} blocks
  let markdown = processTableBlocks(template.markdown, submissionData, form.blocks, opts);

  // Second pass: interpolate remaining {{field}} tokens
  markdown = interpolateTemplate(markdown, variables, opts);

  return {
    markdown,
    metadata: {
      formSlug: form.meta.slug,
      formTitle: form.meta.title,
      generatedAt: new Date().toISOString(),
    },
  };
}

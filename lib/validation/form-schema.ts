import { z } from "zod";
import type { Block } from "@/lib/types";

/**
 * Build a dynamic Zod schema for a form submission based on the form's blocks.
 * Each field block contributes a key to the schema.
 */
export function buildSubmissionSchema(blocks: Block[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const block of blocks) {
    addBlockToSchema(shape, block);
  }

  return z.object(shape);
}

function addBlockToSchema(shape: Record<string, z.ZodTypeAny>, block: Block) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = block.properties as any;

  switch (block.type) {
    case "short_text": {
      let s = z.string();
      if (p.minLength) s = s.min(p.minLength, `Minimum ${p.minLength} characters`);
      if (p.maxLength) s = s.max(p.maxLength, `Maximum ${p.maxLength} characters`);
      if (p.regex) {
        try {
          // Guard against ReDoS: reject patterns longer than 200 chars or with nested quantifiers
          if (p.regex.length <= 200 && !/(\+\+|\*\*|\+\*|\*\+|\{[^}]+\}[+*])/.test(p.regex)) {
            s = s.regex(new RegExp(p.regex), p.patternMessage ?? "Invalid format");
          }
        } catch {}
      }
      shape[block.id] = p.required ? s.min(1, "This field is required") : s.optional();
      break;
    }

    case "long_text": {
      let s = z.string();
      if (p.minLength) s = s.min(p.minLength, `Minimum ${p.minLength} characters`);
      if (p.maxLength) s = s.max(p.maxLength, `Maximum ${p.maxLength} characters`);
      shape[block.id] = p.required ? s.min(1, "This field is required") : s.optional();
      break;
    }

    case "email": {
      const s = z.string().email("Please enter a valid email address");
      shape[block.id] = p.required ? s : s.optional().or(z.literal(""));
      break;
    }

    case "phone": {
      const s = z.string().min(1);
      shape[block.id] = p.required ? s : s.optional();
      break;
    }

    case "number": {
      let s = z.number({ message: "Please enter a number" });
      if (p.min !== undefined) s = s.min(p.min, `Minimum value is ${p.min}`);
      if (p.max !== undefined) s = s.max(p.max, `Maximum value is ${p.max}`);
      shape[block.id] = p.required ? s : s.optional();
      break;
    }

    case "currency": {
      let s = z.number({ message: "Please enter an amount" });
      if (p.min !== undefined) s = s.min(p.min);
      if (p.max !== undefined) s = s.max(p.max);
      shape[block.id] = p.required ? s : s.optional();
      break;
    }

    case "date": {
      let s = z.string();
      if (p.minDate) s = s.refine((d) => d >= p.minDate!, `Date must be on or after ${p.minDate}`);
      if (p.maxDate) s = s.refine((d) => d <= p.maxDate!, `Date must be on or before ${p.maxDate}`);
      shape[block.id] = p.required ? s.min(1, "Please select a date") : s.optional();
      break;
    }

    case "single_select": {
      const s = z.string();
      shape[block.id] = p.required ? s.min(1, "Please select an option") : s.optional();
      break;
    }

    case "multi_select": {
      const s = z.array(z.string());
      if (p.maxSelections) {
        shape[block.id] = p.required
          ? s.min(1, "Please select at least one option").max(p.maxSelections)
          : s.max(p.maxSelections).optional();
      } else {
        shape[block.id] = p.required ? s.min(1, "Please select at least one option") : s.optional();
      }
      break;
    }

    case "rating": {
      const s = z.number().min(1).max(p.maxStars ?? 10);
      shape[block.id] = p.required ? s : s.optional();
      break;
    }

    case "yes_no": {
      const s = z.boolean();
      shape[block.id] = p.required ? s : s.optional();
      break;
    }

    case "file_upload": {
      const maxBytes = (p.maxFileSizeMb ?? 10) * 1024 * 1024;
      const acceptedTypes: string[] = p.acceptedTypes ?? [];

      const fileSchema = z.any().superRefine((v, ctx) => {
        if (v == null) {
          if (p.required) ctx.addIssue({ code: "custom", message: "Please upload a file" });
          return;
        }
        // v is expected to be { name: string, type: string, data: string (base64) }
        if (typeof v !== "object") return;
        const file = v as { name?: string; type?: string; data?: string };

        // Validate MIME type against allowed types
        if (acceptedTypes.length > 0 && file.type) {
          const allowed = acceptedTypes.some((t) => {
            if (t.endsWith("/*")) return file.type!.startsWith(t.slice(0, -2));
            return file.type === t;
          });
          if (!allowed) {
            ctx.addIssue({ code: "custom", message: `File type not allowed. Accepted: ${acceptedTypes.join(", ")}` });
          }
        }

        // Validate file size via base64 length (base64 is ~4/3 of binary size)
        if (file.data) {
          const estimatedBytes = Math.ceil((file.data.length * 3) / 4);
          if (estimatedBytes > maxBytes) {
            ctx.addIssue({ code: "custom", message: `File exceeds maximum size of ${p.maxFileSizeMb ?? 10}MB` });
          }
        }
      });

      shape[block.id] = fileSchema;
      break;
    }

    // For itemisation blocks, handle as nested arrays
    case "itemisation": {
      const rowSchema: Record<string, z.ZodTypeAny> = {};
      for (const child of block.children ?? []) {
        addBlockToSchema(rowSchema, child);
      }
      const rowZod = z.object(rowSchema);
      const minRows = p.minRows ?? 1;
      const maxRows = p.maxRows ?? 50;
      shape[block.id] = z.array(rowZod).min(minRows, `At least ${minRows} row(s) required`).max(maxRows);
      break;
    }

    case "column_layout": {
      const colProps = block.properties as import("@/lib/types").ColumnLayoutProps;
      for (const col of colProps.columnDefs ?? []) {
        for (const child of col.blocks) {
          addBlockToSchema(shape, child);
        }
      }
      break;
    }

    // Content/layout blocks — skip
    default:
      break;
  }
}

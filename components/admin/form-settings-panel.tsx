"use client";

import { useEditorStore } from "@/lib/store/editor";

export default function FormSettingsPanel() {
  const form = useEditorStore((s) => s.form);
  const updateMeta = useEditorStore((s) => s.updateMeta);
  const meta = form.meta;

  return (
    <div className="space-y-5 text-sm">
      {/* Slug */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">URL Slug</label>
        <div className="flex items-center gap-1 px-3 py-2 border border-border rounded-md bg-muted/30 text-xs font-mono">
          <span className="text-muted-foreground">/f/</span>
          <input
            type="text"
            value={meta.slug}
            onChange={(e) => updateMeta({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            className="flex-1 bg-transparent outline-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only.</p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Description</label>
        <textarea
          value={meta.description ?? ""}
          onChange={(e) => updateMeta({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="Brief description of this form"
        />
      </div>

      {/* Icon emoji */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Icon Emoji</label>
        <input
          type="text"
          value={meta.iconEmoji ?? ""}
          onChange={(e) => updateMeta({ iconEmoji: e.target.value })}
          placeholder="📋"
          maxLength={2}
          className="w-16 px-3 py-2 text-xl text-center border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Accent color */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Accent Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={meta.accentColor ?? "#0f172a"}
            onChange={(e) => updateMeta({ accentColor: e.target.value })}
            className="w-10 h-9 border border-border rounded cursor-pointer p-0.5 bg-background"
          />
          <input
            type="text"
            value={meta.accentColor ?? ""}
            onChange={(e) => updateMeta({ accentColor: e.target.value })}
            placeholder="#0f172a"
            className="flex-1 px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Logo URL</label>
        <input
          type="url"
          value={meta.logoUrl ?? ""}
          onChange={(e) => updateMeta({ logoUrl: e.target.value })}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Cover image URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Cover Image URL</label>
        <input
          type="url"
          value={meta.coverImageUrl ?? ""}
          onChange={(e) => updateMeta({ coverImageUrl: e.target.value })}
          placeholder="https://example.com/cover.jpg"
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Submit button text */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Submit Button Text</label>
        <input
          type="text"
          value={meta.submitButtonText ?? "Submit"}
          onChange={(e) => updateMeta({ submitButtonText: e.target.value })}
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Success message */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Success Message</label>
        <textarea
          value={meta.successMessage ?? ""}
          onChange={(e) => updateMeta({ successMessage: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="Thank you! Your response has been submitted."
        />
      </div>

      {/* Redirect URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Redirect URL</label>
        <input
          type="url"
          value={meta.redirectUrl ?? ""}
          onChange={(e) => updateMeta({ redirectUrl: e.target.value })}
          placeholder="https://example.com/thank-you"
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">If set, overrides the success message.</p>
      </div>

      {/* Footer text */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Footer Text</label>
        <input
          type="text"
          value={meta.footerText ?? ""}
          onChange={(e) => updateMeta({ footerText: e.target.value })}
          placeholder="Powered by Formdocs"
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}

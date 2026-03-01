import { getForm } from "@/lib/forms";
import { notFound } from "next/navigation";
import FormRenderer from "@/components/form/form-renderer";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return { title: "Form Not Found" };
  return {
    title: form.meta.title || "Formdocs Form",
    description: form.meta.description,
  };
}

export const revalidate = 60; // ISR: refresh every 60s

export default async function PublicFormPage({ params }: Props) {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) {
    notFound();
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={
        form.meta.accentColor
          ? ({ "--accent-color": form.meta.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {/* Cover image */}
      {form.meta.coverImageUrl && (
        <div className="w-full h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.meta.coverImageUrl}
            alt="Form cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-[720px] mx-auto px-6 py-12 md:px-16 lg:px-24">
        {/* Logo */}
        {form.meta.logoUrl && (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.meta.logoUrl} alt="Logo" className="h-10 object-contain" />
          </div>
        )}

        {/* Form title */}
        <div className="mb-8">
          {form.meta.iconEmoji && (
            <div className="text-5xl mb-3">{form.meta.iconEmoji}</div>
          )}
          <h1 className="text-[40px] font-bold leading-tight mb-2">{form.meta.title}</h1>
          {form.meta.description && (
            <p className="text-muted-foreground">{form.meta.description}</p>
          )}
        </div>

        {/* Form renderer (client) */}
        <FormRenderer form={form} />

        {/* Footer */}
        {form.meta.footerText && (
          <p className="text-xs text-center text-muted-foreground mt-12">
            {form.meta.footerText}
          </p>
        )}
      </div>
    </div>
  );
}

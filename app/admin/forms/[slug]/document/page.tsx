import { getForm } from "@/lib/forms";
import { notFound } from "next/navigation";
import DocumentEditorShell from "@/components/editor/document-editor-shell";

type Props = { params: Promise<{ slug: string }> };

export default async function DocumentTemplatePage({ params }: Props) {
  const { slug } = await params;

  const form = await getForm(slug);
  if (!form) notFound();

  return <DocumentEditorShell initialForm={form} />;
}

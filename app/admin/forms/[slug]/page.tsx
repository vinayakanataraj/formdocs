import { getForm } from "@/lib/forms";
import { notFound } from "next/navigation";
import EditorShell from "@/components/editor/editor-shell";

type Props = { params: Promise<{ slug: string }> };

export default async function FormEditorPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "new") {
    notFound();
  }

  const form = await getForm(slug);
  if (!form) notFound();

  return <EditorShell initialForm={form} />;
}

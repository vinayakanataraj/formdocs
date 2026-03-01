import { listForms } from "@/lib/forms";
import FormCard from "@/components/admin/form-card";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const forms = await listForms();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {forms.length} {forms.length === 1 ? "form" : "forms"}
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-medium mb-1">No forms yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first form to get started.
          </p>
          <Link
            href="/admin/forms/new"
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((meta) => (
            <FormCard key={meta.slug} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}

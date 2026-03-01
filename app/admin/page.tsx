import { listForms } from "@/lib/forms";
import FormCard from "@/components/admin/form-card";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const forms = await listForms();

  return (
    <div className="max-w-[800px] mx-auto px-16 py-14">
      <div className="mb-8">
        <h1 className="text-[40px] font-bold leading-tight">Forms</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {forms.length === 0 ? "No forms yet" : `${forms.length} ${forms.length === 1 ? "form" : "forms"}`}
        </p>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Create your first form to get started.
          </p>
          <Link
            href="/admin/forms/new"
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-[4px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Form
          </Link>
        </div>
      ) : (
        <div className="space-y-0.5">
          {forms.map((meta) => (
            <FormCard key={meta.slug} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}

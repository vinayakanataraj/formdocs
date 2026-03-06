import type { Form, FormMeta } from "@/lib/types";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const backend = useBlob ? require("./forms-blob") : require("./forms-fs");

export const listForms: () => Promise<FormMeta[]> = backend.listForms;
export const getForm: (slug: string) => Promise<Form | null> = backend.getForm;
export const saveForm: (form: Form) => Promise<void> = backend.saveForm;
export const deleteForm: (slug: string) => Promise<void> = backend.deleteForm;
export const formExists: (slug: string) => Promise<boolean> = backend.formExists;
export const slugify: (title: string) => string = backend.slugify;

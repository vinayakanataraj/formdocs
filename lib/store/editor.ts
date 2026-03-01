"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Block, BlockType, Form, FormMeta, WebhookConfig } from "@/lib/types";
import { createBlock } from "@/lib/blocks/defaults";

// ─── Default empty form ────────────────────────────────────────────────────────

function defaultForm(slug: string = ""): Form {
  return {
    meta: {
      title: "",
      slug,
      description: "",
      coverImageUrl: "",
      iconEmoji: "",
      accentColor: "#0f172a",
      logoUrl: "",
      footerText: "",
      submitButtonText: "Submit",
      successMessage: "Thank you! Your response has been submitted.",
      redirectUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    webhook: {
      url: "",
      method: "POST",
      headers: [{ key: "Content-Type", value: "application/json" }],
      payloadFormat: "json",
      retries: 2,
      timeoutSeconds: 10,
    },
    blocks: [],
  };
}

// ─── Store Interface ───────────────────────────────────────────────────────────

export type EditorPanel = "none" | "webhook" | "settings" | "field-config";

interface EditorStore {
  form: Form;
  selectedBlockId: string | null;
  activePanel: EditorPanel;
  isDirty: boolean;
  isSaving: boolean;
  slashCommandOpen: boolean;
  slashCommandQuery: string;
  slashCommandBlockId: string | null; // block after which to insert

  // Form-level actions
  initForm: (form: Form) => void;
  updateMeta: (meta: Partial<FormMeta>) => void;
  updateWebhook: (webhook: Partial<WebhookConfig>) => void;
  markSaved: () => void;
  setIsSaving: (value: boolean) => void;

  // Block actions
  addBlock: (type: BlockType, afterId?: string | null) => string;
  updateBlock: (id: string, props: Partial<Block["properties"]>) => void;
  updateBlockContent: (id: string, content: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (activeId: string, overId: string) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;

  // Itemisation child block actions
  addChildBlock: (parentId: string, type: BlockType) => string;
  updateChildBlock: (parentId: string, childId: string, props: Partial<Block["properties"]>) => void;
  deleteChildBlock: (parentId: string, childId: string) => void;

  // UI state
  setActivePanel: (panel: EditorPanel) => void;
  openSlashCommand: (blockId: string | null, query?: string) => void;
  closeSlashCommand: () => void;
  setSlashQuery: (query: string) => void;
}

// ─── Helper: update nested blocks ─────────────────────────────────────────────

function updateBlockById(blocks: Block[], id: string, updater: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    if (b.children?.length) {
      return { ...b, children: updateBlockById(b.children, id, updater) };
    }
    return b;
  });
}

function removeBlockById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) =>
      b.children?.length ? { ...b, children: removeBlockById(b.children, id) } : b
    );
}

function insertAfter(blocks: Block[], afterId: string | null | undefined, newBlock: Block): Block[] {
  if (!afterId) return [...blocks, newBlock];
  const idx = blocks.findIndex((b) => b.id === afterId);
  if (idx === -1) return [...blocks, newBlock];
  const result = [...blocks];
  result.splice(idx + 1, 0, newBlock);
  return result;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get) => ({
  form: defaultForm(),
  selectedBlockId: null,
  activePanel: "none",
  isDirty: false,
  isSaving: false,
  slashCommandOpen: false,
  slashCommandQuery: "",
  slashCommandBlockId: null,

  initForm: (form) => set({ form, isDirty: false }),

  updateMeta: (meta) =>
    set((s) => ({
      form: { ...s.form, meta: { ...s.form.meta, ...meta, updatedAt: new Date().toISOString() } },
      isDirty: true,
    })),

  updateWebhook: (webhook) =>
    set((s) => ({
      form: { ...s.form, webhook: { ...s.form.webhook, ...webhook } },
      isDirty: true,
    })),

  markSaved: () => set({ isDirty: false }),
  setIsSaving: (value) => set({ isSaving: value }),

  addBlock: (type, afterId) => {
    const block = createBlock(type);
    set((s) => ({
      form: { ...s.form, blocks: insertAfter(s.form.blocks, afterId, block) },
      selectedBlockId: block.id,
      isDirty: true,
    }));
    return block.id;
  },

  updateBlock: (id, props) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, id, (b) => ({
          ...b,
          properties: { ...b.properties, ...props },
        })),
      },
      isDirty: true,
    })),

  updateBlockContent: (id, content) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, id, (b) => ({ ...b, ...content })),
      },
      isDirty: true,
    })),

  deleteBlock: (id) =>
    set((s) => ({
      form: { ...s.form, blocks: removeBlockById(s.form.blocks, id) },
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
      isDirty: true,
    })),

  moveBlock: (activeId, overId) =>
    set((s) => {
      const blocks = [...s.form.blocks];
      const fromIdx = blocks.findIndex((b) => b.id === activeId);
      const toIdx = blocks.findIndex((b) => b.id === overId);
      if (fromIdx === -1 || toIdx === -1) return s;
      const [moved] = blocks.splice(fromIdx, 1);
      blocks.splice(toIdx, 0, moved);
      return { form: { ...s.form, blocks }, isDirty: true };
    }),

  duplicateBlock: (id) => {
    set((s) => {
      const block = s.form.blocks.find((b) => b.id === id);
      if (!block) return s;
      const dup: Block = JSON.parse(JSON.stringify(block));
      dup.id = nanoid();
      if (dup.children?.length) {
        dup.children = dup.children.map((c) => ({ ...c, id: nanoid() }));
      }
      return {
        form: { ...s.form, blocks: insertAfter(s.form.blocks, id, dup) },
        selectedBlockId: dup.id,
        isDirty: true,
      };
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  addChildBlock: (parentId, type) => {
    const child = createBlock(type);
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, parentId, (b) => ({
          ...b,
          children: [...(b.children ?? []), child],
        })),
      },
      isDirty: true,
    }));
    return child.id;
  },

  updateChildBlock: (parentId, childId, props) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, parentId, (b) => ({
          ...b,
          children: updateBlockById(b.children ?? [], childId, (c) => ({
            ...c,
            properties: { ...c.properties, ...props },
          })),
        })),
      },
      isDirty: true,
    })),

  deleteChildBlock: (parentId, childId) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, parentId, (b) => ({
          ...b,
          children: (b.children ?? []).filter((c) => c.id !== childId),
        })),
      },
      isDirty: true,
    })),

  setActivePanel: (panel) => set({ activePanel: panel }),

  openSlashCommand: (blockId, query = "") =>
    set({ slashCommandOpen: true, slashCommandBlockId: blockId, slashCommandQuery: query }),

  closeSlashCommand: () =>
    set({ slashCommandOpen: false, slashCommandQuery: "", slashCommandBlockId: null }),

  setSlashQuery: (query) => set({ slashCommandQuery: query }),
}));

"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Block, BlockType, Form, FormMeta, WebhookConfig, ColumnLayoutProps } from "@/lib/types";
import { createBlock } from "@/lib/blocks/defaults";
import { createDefaultForm } from "@/lib/form-defaults";
import { ensureBlockSlugs } from "@/lib/utils";
import { redistributeBlocks } from "@/lib/blocks/column-presets";

// ─── Container Location ───────────────────────────────────────────────────────

export type ContainerLocation =
  | { type: "top-level" }
  | { type: "column"; layoutId: string; columnIndex: number };

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

  // Column layout actions
  addBlockToColumn: (layoutId: string, columnIndex: number, type: BlockType, afterId?: string | null) => string;
  deleteBlockFromColumn: (layoutId: string, columnIndex: number, blockId: string) => void;
  updateColumnLayout: (layoutId: string, newSpans: number[]) => void;
  moveBlockBetweenContainers: (blockId: string, source: ContainerLocation, target: ContainerLocation) => void;

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
    if (b.type === "column_layout") {
      const p = b.properties as ColumnLayoutProps;
      if (p.columnDefs?.length) {
        const newDefs = p.columnDefs.map((col) => ({
          ...col,
          blocks: updateBlockById(col.blocks, id, updater),
        }));
        return { ...b, properties: { ...p, columnDefs: newDefs } };
      }
    }
    return b;
  });
}

function removeBlockById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => {
      if (b.children?.length) {
        return { ...b, children: removeBlockById(b.children, id) };
      }
      if (b.type === "column_layout") {
        const p = b.properties as ColumnLayoutProps;
        if (p.columnDefs?.length) {
          const newDefs = p.columnDefs.map((col) => ({
            ...col,
            blocks: removeBlockById(col.blocks, id),
          }));
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        }
      }
      return b;
    });
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

export const useEditorStore = create<EditorStore>((set) => ({
  form: createDefaultForm(""),
  selectedBlockId: null,
  activePanel: "none",
  isDirty: false,
  isSaving: false,
  slashCommandOpen: false,
  slashCommandQuery: "",
  slashCommandBlockId: null,

  initForm: (form) => {
    // Migrate old column_layout blocks (columns: 2|3 + flat children) to new columnDefs format
    const migrateBlocks = (blocks: Block[]): Block[] =>
      blocks.map((b) => {
        if (b.type === "column_layout") {
          const p = b.properties as Record<string, unknown>;
          if (!("columnDefs" in p) && ("columns" in p || (b.children && b.children.length > 0))) {
            const cols = (p.columns as number) ?? 2;
            const children = b.children ?? [];
            const columnDefs = Array.from({ length: cols }, (_, i) => ({
              id: nanoid(),
              span: 12 / cols,
              blocks: children.filter((_, bi) => bi % cols === i),
            }));
            return { ...b, properties: { columnDefs }, children: undefined };
          }
        }
        return b;
      });
    set({
      form: { ...form, blocks: ensureBlockSlugs(migrateBlocks(form.blocks)) },
      isDirty: false,
    });
  },

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
      // Search top-level and columns
      let block: Block | undefined = s.form.blocks.find((b) => b.id === id);
      let isInColumn = false;
      if (!block) {
        for (const b of s.form.blocks) {
          if (b.type === "column_layout") {
            const p = b.properties as ColumnLayoutProps;
            for (const col of p.columnDefs ?? []) {
              const found = col.blocks.find((cb) => cb.id === id);
              if (found) { block = found; isInColumn = true; break; }
            }
          }
          if (block) break;
        }
      }
      if (!block) return s;
      const dup: Block = JSON.parse(JSON.stringify(block));
      dup.id = nanoid();
      const idMap = new Map<string, string>();
      if (dup.children?.length) {
        dup.children = dup.children.map((c) => {
          const newId = nanoid();
          idMap.set(c.id, newId);
          return { ...c, id: newId };
        });
      }
      if (dup.type === "itemisation_advanced") {
        const p = dup.properties as import("@/lib/types").ItemisationAdvancedProps;
        dup.properties = {
          ...p,
          defaultItems: (p.defaultItems ?? []).map((item) => ({
            ...item,
            id: nanoid(),
            values: item.values.map((v) => ({
              ...v,
              fieldId: idMap.get(v.fieldId) ?? v.fieldId,
            })),
          })),
        };
      }
      // If it's a column_layout, give new IDs to all columnDefs and their blocks
      if (dup.type === "column_layout") {
        const dp = dup.properties as ColumnLayoutProps;
        dup.properties = {
          ...dp,
          columnDefs: (dp.columnDefs ?? []).map((col) => ({
            ...col,
            id: nanoid(),
            blocks: col.blocks.map((cb) => ({ ...cb, id: nanoid() })),
          })),
        };
      }
      if (isInColumn) {
        const newBlocks = s.form.blocks.map((b) => {
          if (b.type === "column_layout") {
            const p = b.properties as ColumnLayoutProps;
            const newDefs = p.columnDefs.map((col) => {
              const idx = col.blocks.findIndex((cb) => cb.id === id);
              if (idx === -1) return col;
              const newColBlocks = [...col.blocks];
              newColBlocks.splice(idx + 1, 0, dup);
              return { ...col, blocks: newColBlocks };
            });
            return { ...b, properties: { ...p, columnDefs: newDefs } };
          }
          return b;
        });
        return { form: { ...s.form, blocks: newBlocks }, selectedBlockId: dup.id, isDirty: true };
      }
      return {
        form: { ...s.form, blocks: insertAfter(s.form.blocks, id, dup) },
        selectedBlockId: dup.id,
        isDirty: true,
      };
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  addBlockToColumn: (layoutId, columnIndex, type, afterId) => {
    const block = createBlock(type);
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, layoutId, (b) => {
          const p = b.properties as ColumnLayoutProps;
          const newDefs = p.columnDefs.map((col, i) => {
            if (i !== columnIndex) return col;
            return { ...col, blocks: insertAfter(col.blocks, afterId ?? null, block) };
          });
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        }),
      },
      selectedBlockId: block.id,
      isDirty: true,
    }));
    return block.id;
  },

  deleteBlockFromColumn: (layoutId, columnIndex, blockId) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, layoutId, (b) => {
          const p = b.properties as ColumnLayoutProps;
          const newDefs = p.columnDefs.map((col, i) => {
            if (i !== columnIndex) return col;
            return { ...col, blocks: col.blocks.filter((cb) => cb.id !== blockId) };
          });
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        }),
      },
      selectedBlockId: null,
      isDirty: true,
    })),

  updateColumnLayout: (layoutId, newSpans) =>
    set((s) => ({
      form: {
        ...s.form,
        blocks: updateBlockById(s.form.blocks, layoutId, (b) => {
          const p = b.properties as ColumnLayoutProps;
          const newDefs = redistributeBlocks(p.columnDefs ?? [], newSpans);
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        }),
      },
      isDirty: true,
    })),

  moveBlockBetweenContainers: (blockId, source, target) =>
    set((s) => {
      let movedBlock: Block | undefined;
      let newBlocks = [...s.form.blocks];

      if (source.type === "top-level") {
        movedBlock = newBlocks.find((b) => b.id === blockId);
        newBlocks = newBlocks.filter((b) => b.id !== blockId);
      } else {
        newBlocks = newBlocks.map((b) => {
          if (b.id !== source.layoutId || b.type !== "column_layout") return b;
          const p = b.properties as ColumnLayoutProps;
          const newDefs = p.columnDefs.map((col, i) => {
            if (i !== source.columnIndex) return col;
            const found = col.blocks.find((cb) => cb.id === blockId);
            if (found) movedBlock = found;
            return { ...col, blocks: col.blocks.filter((cb) => cb.id !== blockId) };
          });
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        });
      }

      if (!movedBlock) return s;

      if (target.type === "top-level") {
        newBlocks = [...newBlocks, movedBlock];
      } else {
        newBlocks = newBlocks.map((b) => {
          if (b.id !== target.layoutId || b.type !== "column_layout") return b;
          const p = b.properties as ColumnLayoutProps;
          const newDefs = p.columnDefs.map((col, i) => {
            if (i !== target.columnIndex) return col;
            return { ...col, blocks: [...col.blocks, movedBlock!] };
          });
          return { ...b, properties: { ...p, columnDefs: newDefs } };
        });
      }

      return { form: { ...s.form, blocks: newBlocks }, isDirty: true };
    }),

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
        blocks: updateBlockById(s.form.blocks, parentId, (b) => {
          const updated: Block = {
            ...b,
            children: (b.children ?? []).filter((c) => c.id !== childId),
          };
          if (b.type === "itemisation_advanced") {
            const p = b.properties as import("@/lib/types").ItemisationAdvancedProps;
            const defaultItems = (p.defaultItems ?? []).map((item) => ({
              ...item,
              values: item.values.filter((v) => v.fieldId !== childId),
            }));
            updated.properties = { ...p, defaultItems };
          }
          return updated;
        }),
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

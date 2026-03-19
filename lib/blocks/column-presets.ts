import { nanoid } from "nanoid";
import type { ColumnDef } from "@/lib/types";

export interface ColumnPreset {
  id: string;
  label: string;
  spans: number[];
  description: string;
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  { id: "6-6",     label: "1/2 + 1/2",     spans: [6, 6],      description: "Two equal columns" },
  { id: "4-4-4",   label: "1/3 + 1/3 + 1/3", spans: [4, 4, 4],  description: "Three equal columns" },
  { id: "3-3-3-3", label: "1/4 x 4",       spans: [3, 3, 3, 3], description: "Four equal columns" },
  { id: "8-4",     label: "2/3 + 1/3",     spans: [8, 4],      description: "Wide left" },
  { id: "4-8",     label: "1/3 + 2/3",     spans: [4, 8],      description: "Wide right" },
  { id: "9-3",     label: "3/4 + 1/4",     spans: [9, 3],      description: "Extra wide left" },
  { id: "3-9",     label: "1/4 + 3/4",     spans: [3, 9],      description: "Extra wide right" },
  { id: "3-6-3",   label: "1/4 + 1/2 + 1/4", spans: [3, 6, 3], description: "Wide center" },
  { id: "6-3-3",   label: "1/2 + 1/4 + 1/4", spans: [6, 3, 3], description: "Wide left, two narrow right" },
  { id: "3-3-6",   label: "1/4 + 1/4 + 1/2", spans: [3, 3, 6], description: "Two narrow left, wide right" },
];

export function createColumnsFromPreset(spans: number[]): ColumnDef[] {
  return spans.map((span) => ({ id: nanoid(), span, blocks: [] }));
}

export function redistributeBlocks(oldDefs: ColumnDef[], newSpans: number[]): ColumnDef[] {
  const allBlocks = oldDefs.flatMap((col) => col.blocks);
  const newDefs = createColumnsFromPreset(newSpans);
  allBlocks.forEach((block, i) => {
    const targetCol = Math.min(i, newDefs.length - 1);
    newDefs[targetCol].blocks.push(block);
  });
  return newDefs;
}

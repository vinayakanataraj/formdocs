import type { Block, SpacerProps } from "@/lib/types";

export default function SpacerBlock({ block }: { block: Block }) {
  const p = block.properties as SpacerProps;
  const height = p.height ?? 32;
  return <div style={{ height: `${height}px` }} className="w-full" aria-hidden />;
}

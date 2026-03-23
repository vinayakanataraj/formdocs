/**
 * Minimal Markdown parser for the subset we produce in document generation.
 * Handles: headings, paragraphs, bold, pipe tables, horizontal rules.
 */

export type MdNode =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][]; alignments: ("left" | "right" | "center")[] }
  | { type: "hr" }
  | { type: "blank" };

function parseAlignment(cell: string): "left" | "right" | "center" {
  const t = cell.trim();
  if (t.startsWith(":") && t.endsWith(":")) return "center";
  if (t.endsWith(":")) return "right";
  return "left";
}

function parseTableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseMarkdown(md: string): MdNode[] {
  const lines = md.split("\n");
  const nodes: MdNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      nodes.push({ type: "blank" });
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: "hr" });
      i++;
      continue;
    }

    const h3 = line.match(/^###\s+(.*)/);
    if (h3) { nodes.push({ type: "heading", level: 3, text: h3[1].trim() }); i++; continue; }
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) { nodes.push({ type: "heading", level: 2, text: h2[1].trim() }); i++; continue; }
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) { nodes.push({ type: "heading", level: 1, text: h1[1].trim() }); i++; continue; }

    if (line.trim().startsWith("|")) {
      const headerCells = parseTableRow(line);
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        const sepLine = lines[i + 1];
        const sepCells = parseTableRow(sepLine);
        if (sepCells.every((c) => /^:?-+:?$/.test(c.trim()))) {
          const alignments = sepCells.map(parseAlignment);
          const rows: string[][] = [];
          let j = i + 2;
          while (j < lines.length && lines[j].trim().startsWith("|")) {
            rows.push(parseTableRow(lines[j]));
            j++;
          }
          nodes.push({ type: "table", headers: headerCells, rows, alignments });
          i = j;
          continue;
        }
      }
    }

    nodes.push({ type: "paragraph", text: line });
    i++;
  }

  return nodes;
}

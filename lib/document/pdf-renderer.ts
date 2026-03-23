/**
 * PDF renderer using @react-pdf/renderer.
 * Converts Markdown AST to a styled PDF document.
 */

import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { parseMarkdown } from "./markdown-parser";
import type { MdNode } from "./markdown-parser";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1");
}

function isBold(text: string): boolean {
  return /\*\*[^*]+\*\*/.test(text);
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  h1: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 12,
    color: "#0f172a",
  },
  h2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
    color: "#334155",
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 4,
    color: "#334155",
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 8,
  },
  table: {
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderRow: {
    flexDirection: "row" as const,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    color: "#334155",
  },
  tableCellRight: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    color: "#334155",
    textAlign: "right" as const,
  },
  tableCellCenter: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    color: "#334155",
    textAlign: "center" as const,
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  tableHeaderCellRight: {
    padding: 4,
    fontSize: 8,
    flex: 1,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right" as const,
  },
  accentBar: {
    height: 4,
    marginBottom: 16,
    backgroundColor: "#0f172a",
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 7,
    color: "#94a3b8",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
  },
});

interface RenderPdfOptions {
  markdown: string;
  branding?: {
    companyName?: string;
    currencySymbol?: string;
    numberFormat?: string;
  };
  accentColor?: string;
}

function renderNode(node: MdNode, idx: number): React.ReactElement | null {
  switch (node.type) {
    case "heading":
      return React.createElement(
        Text,
        { key: idx, style: node.level === 1 ? styles.h1 : node.level === 2 ? styles.h2 : styles.h3 },
        stripMarkdown(node.text)
      );
    case "paragraph":
      if (!node.text.trim()) return null;
      return React.createElement(
        Text,
        { key: idx, style: [styles.paragraph, isBold(node.text) ? styles.boldText : {}] },
        stripMarkdown(node.text)
      );
    case "hr":
      return React.createElement(View, { key: idx, style: styles.hr });
    case "table": {
      const { headers, rows, alignments } = node;
      return React.createElement(
        View,
        { key: idx, style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeaderRow },
          ...headers.map((h, hi) =>
            React.createElement(
              Text,
              {
                key: hi,
                style: alignments[hi] === "right" ? styles.tableHeaderCellRight : styles.tableHeaderCell,
              },
              stripMarkdown(h)
            )
          )
        ),
        ...rows.map((row, ri) =>
          React.createElement(
            View,
            { key: ri, style: styles.tableRow },
            ...row.map((cell, ci) =>
              React.createElement(
                Text,
                {
                  key: ci,
                  style:
                    alignments[ci] === "right"
                      ? styles.tableCellRight
                      : alignments[ci] === "center"
                      ? styles.tableCellCenter
                      : styles.tableCell,
                },
                stripMarkdown(cell)
              )
            )
          )
        )
      );
    }
    default:
      return null;
  }
}

export async function renderPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const nodes = parseMarkdown(opts.markdown);
  const accentColor = opts.accentColor ?? "#0f172a";
  const companyName = opts.branding?.companyName ?? "";

  const children: (React.ReactElement | null)[] = [
    React.createElement(View, { key: "accent", style: { ...styles.accentBar, backgroundColor: accentColor } }),
  ];

  if (companyName) {
    children.push(React.createElement(Text, { key: "company", style: styles.companyName }, companyName));
  }

  for (let i = 0; i < nodes.length; i++) {
    children.push(renderNode(nodes[i], i));
  }

  children.push(
    React.createElement(
      Text,
      {
        key: "footer",
        style: styles.footer,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Page ${pageNumber} of ${totalPages}`,
      }
    )
  );

  const page = React.createElement(
    Page,
    { size: "A4", style: styles.page },
    ...children.filter(Boolean)
  );

  const doc = React.createElement(Document, {}, page);

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

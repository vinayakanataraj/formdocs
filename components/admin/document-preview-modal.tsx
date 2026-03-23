"use client";

import { X } from "lucide-react";

interface DocumentPreviewModalProps {
  markdown: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({ markdown, onClose }: DocumentPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Document Preview</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground bg-muted/30 rounded p-3 leading-relaxed">
            {markdown}
          </pre>
        </div>
      </div>
    </div>
  );
}

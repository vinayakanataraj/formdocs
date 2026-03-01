"use client";

import { useState } from "react";
import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor";
import WebhookSettings from "@/components/admin/webhook-settings";
import FormSettingsPanel from "@/components/admin/form-settings-panel";
import FieldConfigPanel from "@/components/editor/field-config-panel";
import { Webhook, Settings, X } from "lucide-react";

type Tab = "webhook" | "settings";

function findBlockById(blocks: Block[], id: string): Block | undefined {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children?.length) {
      const found = findBlockById(b.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export default function EditorSidebar() {
  const { activePanel, setActivePanel, selectedBlockId, form } = useEditorStore();
  const [tab, setTab] = useState<Tab>("webhook");

  const isOpen = activePanel !== "none";
  const selectedBlock = selectedBlockId
    ? findBlockById(form.blocks, selectedBlockId)
    : null;

  // Always show when a field is selected for config
  const showFieldConfig = activePanel === "field-config" && selectedBlock;

  return (
    <div
      className={`border-l border-border bg-background transition-all duration-200 flex flex-col ${
        isOpen ? "w-80 shrink-0" : "w-0 overflow-hidden"
      }`}
    >
      {isOpen && (
        <>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
            {!showFieldConfig && (
              <div className="flex gap-1">
                <button
                  onClick={() => { setTab("webhook"); setActivePanel("webhook"); }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 transition-colors border-b-2 ${
                    tab === "webhook" && activePanel === "webhook" ? "text-foreground font-medium border-foreground" : "text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  <Webhook className="w-3.5 h-3.5" />
                  Webhook
                </button>
                <button
                  onClick={() => { setTab("settings"); setActivePanel("settings"); }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 transition-colors border-b-2 ${
                    tab === "settings" && activePanel === "settings" ? "text-foreground font-medium border-foreground" : "text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </button>
              </div>
            )}
            {showFieldConfig && (
              <span className="text-xs font-medium">Field Configuration</span>
            )}
            <button
              onClick={() => setActivePanel("none")}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            {showFieldConfig && selectedBlock ? (
              <FieldConfigPanel block={selectedBlock} />
            ) : activePanel === "webhook" || (activePanel !== "settings" && activePanel !== "field-config") ? (
              <WebhookSettings />
            ) : (
              <FormSettingsPanel />
            )}
          </div>
        </>
      )}

      {/* Toggle buttons (when sidebar closed) */}
      {!isOpen && (
        <div className="absolute right-0 top-20 flex flex-col gap-1 p-1">
          <button
            onClick={() => { setActivePanel("webhook"); setTab("webhook"); }}
            title="Webhook Settings"
            className="flex items-center justify-center w-8 h-8 rounded-l-[3px] border border-r-0 border-border bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Webhook className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActivePanel("settings"); setTab("settings"); }}
            title="Form Settings"
            className="flex items-center justify-center w-8 h-8 rounded-l-[3px] border border-r-0 border-border bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

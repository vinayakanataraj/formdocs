"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store/editor";
import WebhookSettings from "@/components/admin/webhook-settings";
import FormSettingsPanel from "@/components/admin/form-settings-panel";
import FieldConfigPanel from "@/components/editor/field-config-panel";
import { Webhook, Settings, X } from "lucide-react";

type Tab = "webhook" | "settings";

export default function EditorSidebar() {
  const { activePanel, setActivePanel, selectedBlockId, form } = useEditorStore();
  const [tab, setTab] = useState<Tab>("webhook");

  const isOpen = activePanel !== "none";
  const selectedBlock = selectedBlockId
    ? form.blocks.find((b) => b.id === selectedBlockId)
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            {!showFieldConfig && (
              <div className="flex gap-1">
                <button
                  onClick={() => { setTab("webhook"); setActivePanel("webhook"); }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    tab === "webhook" && activePanel === "webhook" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Webhook className="w-3.5 h-3.5" />
                  Webhook
                </button>
                <button
                  onClick={() => { setTab("settings"); setActivePanel("settings"); }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    tab === "settings" && activePanel === "settings" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
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
            className="flex items-center justify-center w-8 h-8 rounded-l-md border border-r-0 border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Webhook className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActivePanel("settings"); setTab("settings"); }}
            title="Form Settings"
            className="flex items-center justify-center w-8 h-8 rounded-l-md border border-r-0 border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

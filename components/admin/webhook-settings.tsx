"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store/editor";
import { Plus, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";

const PRESETS = [
  {
    name: "Zapier",
    url: "https://hooks.zapier.com/hooks/catch/",
    headers: [{ key: "Content-Type", value: "application/json" }],
  },
  {
    name: "Make.com",
    url: "https://hook.eu1.make.com/",
    headers: [{ key: "Content-Type", value: "application/json" }],
  },
  {
    name: "n8n",
    url: "https://your-n8n.com/webhook/",
    headers: [{ key: "Content-Type", value: "application/json" }],
  },
];

interface TestResult {
  status?: number;
  ok?: boolean;
  body?: string;
  error?: string;
  duration?: number;
}

export default function WebhookSettings() {
  const { form, updateWebhook } = useEditorStore();
  const wh = form.webhook;
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const start = Date.now();
      const res = await fetch(`/api/submit/${form.meta.slug}`, {
        method: "PUT",
      });
      const data = await res.json();
      setTestResult({ ...data, duration: Date.now() - start });
    } catch (err) {
      setTestResult({ error: String(err) });
    } finally {
      setTesting(false);
    }
  }

  function addHeader() {
    updateWebhook({ headers: [...wh.headers, { key: "", value: "" }] });
  }

  function updateHeader(idx: number, field: "key" | "value", val: string) {
    const headers = [...wh.headers];
    headers[idx] = { ...headers[idx], [field]: val };
    updateWebhook({ headers });
  }

  function removeHeader(idx: number) {
    updateWebhook({ headers: wh.headers.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5 text-sm">
      {/* Presets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => updateWebhook({ url: p.url, headers: p.headers })}
              className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-muted transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Webhook URL <span className="text-destructive">*</span></label>
        <input
          type="url"
          value={wh.url}
          onChange={(e) => updateWebhook({ url: e.target.value })}
          placeholder="https://hooks.example.com/…"
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
      </div>

      {/* Method */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">HTTP Method</label>
        <select
          value={wh.method}
          onChange={(e) => updateWebhook({ method: e.target.value as any })}
          className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Headers</label>
          <button onClick={addHeader} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {wh.headers.map((h, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeader(i, "key", e.target.value)}
                placeholder="Key"
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHeader(i, "value", e.target.value)}
                placeholder="Value"
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
              <button
                onClick={() => removeHeader(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payload format */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Payload Format</label>
        <div className="flex gap-3">
          {(["json", "form_urlencoded"] as const).map((fmt) => (
            <label key={fmt} className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="payloadFormat"
                value={fmt}
                checked={wh.payloadFormat === fmt}
                onChange={() => updateWebhook({ payloadFormat: fmt })}
                className="accent-primary"
              />
              {fmt === "json" ? "JSON" : "Form URL-Encoded"}
            </label>
          ))}
        </div>
      </div>

      {/* Retry / Timeout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Retries (0–3)</label>
          <input
            type="number"
            min={0}
            max={3}
            value={wh.retries}
            onChange={(e) => updateWebhook({ retries: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Timeout (s)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={wh.timeoutSeconds}
            onChange={(e) => updateWebhook({ timeoutSeconds: parseInt(e.target.value) || 10 })}
            className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Test button */}
      <div className="space-y-2">
        <button
          onClick={handleTest}
          disabled={testing || !wh.url}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {testing ? "Testing…" : "Test Webhook"}
        </button>

        {testResult && (
          <div className={`p-3 rounded-md text-xs space-y-1 ${testResult.ok ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-destructive/10 border border-destructive/20"}`}>
            <div className="flex items-center gap-1.5 font-medium">
              {testResult.ok
                ? <><CheckCircle className="w-3.5 h-3.5 text-green-600" /> Success — HTTP {testResult.status}</>
                : <><XCircle className="w-3.5 h-3.5 text-destructive" /> {testResult.error ?? `HTTP ${testResult.status}`}</>
              }
              {testResult.duration && <span className="text-muted-foreground ml-auto">{testResult.duration}ms</span>}
            </div>
            {testResult.body && (
              <pre className="text-muted-foreground overflow-auto max-h-24 font-mono">{testResult.body.slice(0, 300)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

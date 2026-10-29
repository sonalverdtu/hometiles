"use client";

import type { TraceEntry } from "@/lib/qloo/trace";
import { Modal } from "./Modal";

const SHOW_PARAMS = [
  "filter.type",
  "signal.interests.entities",
  "a.signal.interests.entities",
  "b.signal.interests.entities",
  "signal.location.query",
  "filter.location.query",
  "filter.location",
  "filter.location.radius",
  "filter.location.geohash",
  "signal.demographics.age",
  "bias.trends",
  "feature.explainability",
  "filter.start_date",
  "query",
  "types",
];

export function TraceDialog({ trace, onClose }: { trace: TraceEntry[]; onClose: () => void }) {
  const endpoints = [...new Set(trace.map((t) => (t.params["filter.type"]?.startsWith("urn:") && !t.params["filter.type"].startsWith("urn:entity") ? `${t.endpoint} (${t.params["filter.type"]})` : t.endpoint)))];
  const fallbacks = trace.filter((t) => t.status === "fallback" || t.status === "error");
  const mode = trace[0]?.mode ?? "mock";
  return (
    <Modal title="Qloo trace: every call behind this board" onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-[#f4efe7] px-2 py-1 font-semibold">{trace.length} calls</span>
        <span className={`rounded-lg px-2 py-1 font-semibold ${mode === "live" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
          {mode === "live" ? "LIVE · hackathon.api.qloo.com" : "MOCK · synthetic demo data (no API key yet)"}
        </span>
        {endpoints.map((e) => (
          <span key={e} className="rounded-lg bg-[#eef3ff] px-2 py-1 font-mono text-xs">{e}</span>
        ))}
        {fallbacks.length > 0 && <span className="rounded-lg bg-orange-100 px-2 py-1 font-semibold text-orange-900">{fallbacks.length} fallback/error</span>}
      </div>
      <ol className="space-y-2">
        {trace.map((t) => (
          <li key={t.id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--muted)]">{t.id}</span>
              <span className="rounded bg-[#f4efe7] px-1.5 py-0.5 font-mono text-xs">{t.tool}</span>
              <span className="font-mono font-semibold">GET {t.endpoint}</span>
              <span className={`ml-auto rounded px-1.5 py-0.5 text-xs font-bold ${t.status === 200 ? "bg-emerald-100 text-emerald-900" : "bg-orange-100 text-orange-900"}`}>
                {String(t.status)}
              </span>
              <span className="text-xs text-[var(--muted)]">{t.ms} ms · {t.count} results</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-[var(--muted)]">
              {SHOW_PARAMS.filter((k) => t.params[k]).map((k) => (
                <span key={k}>
                  {k}={t.params[k].length > 60 ? `${t.params[k].slice(0, 60)}…` : t.params[k]}
                </span>
              ))}
            </div>
            {t.top.length > 0 && <div className="mt-1 text-[13px]">→ {t.top.join(" · ")}</div>}
            {t.note && <div className="mt-1 text-[13px] text-orange-800">{t.note}</div>}
          </li>
        ))}
      </ol>
    </Modal>
  );
}

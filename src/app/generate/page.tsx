"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveBoard, takePendingProfile } from "@/lib/client/store";
import type { StreamEvent } from "@/lib/board/types";

interface Step {
  text: string;
  tool?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [calls, setCalls] = useState(0);
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const profile = takePendingProfile();
    if (!profile) {
      setMissing(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }) });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line) as StreamEvent;
            if (ev.type === "step") setSteps((s) => [...s, { text: ev.text, tool: ev.tool }]);
            else if (ev.type === "trace") {
              setCalls((c) => c + 1);
              setEndpoints((e) => (e.includes(ev.entry.endpoint) ? e : [...e, ev.entry.endpoint]));
            } else if (ev.type === "board") {
              saveBoard(ev.board);
              router.replace(`/board?id=${ev.board.id}`);
            } else if (ev.type === "error") setError(ev.message);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [router]);

  if (missing)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg">Nothing to build yet.</p>
        <Link href="/create" className="btn btn-primary mt-4">Create a board</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Building the board…</h1>
      <p className="mt-1 text-sm text-[var(--muted)]" aria-live="polite">
        {calls} Qloo calls so far{endpoints.length ? ` · ${endpoints.join(" · ")}` : ""}
      </p>
      <ol className="mt-6 space-y-2" aria-live="polite">
        {steps.map((s, i) => {
          const last = i === steps.length - 1 && !error;
          return (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <span aria-hidden className={last ? "animate-pulse" : ""}>{last ? "⏳" : "✅"}</span>
              <span>{s.text}</span>
              {s.tool && <span className="ml-auto rounded-md bg-[#f4efe7] px-2 py-0.5 font-mono text-xs text-[var(--muted)]">{s.tool}</span>}
            </li>
          );
        })}
      </ol>
      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4">
          {error} <Link href="/" className="underline">Try again</Link>
        </div>
      )}
    </div>
  );
}

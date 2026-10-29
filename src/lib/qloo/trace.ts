// Records every Qloo call so the UI can show judges exactly what was asked.

export interface TraceEntry {
  id: string;
  tool: string;
  endpoint: string;
  params: Record<string, string>;
  status: number | "fallback" | "error";
  ms: number;
  count: number;
  top: string[];
  mode: "live" | "mock";
  note?: string;
}

export class Tracer {
  readonly entries: TraceEntry[] = [];
  private seq = 0;
  constructor(private onEntry?: (e: TraceEntry) => void) {}

  nextId() {
    this.seq += 1;
    return `q${this.seq}`;
  }

  add(entry: Omit<TraceEntry, "id"> & { id?: string }) {
    const full: TraceEntry = { ...entry, id: entry.id ?? this.nextId() };
    this.entries.push(full);
    this.onEntry?.(full);
    return full;
  }
}

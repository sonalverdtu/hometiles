"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop no-print fixed inset-0 z-50 flex items-end justify-center bg-[#1d1b26]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`modal-panel max-h-[90vh] w-full overflow-y-auto rounded-t-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)] outline-none sm:rounded-[1.75rem] sm:p-6 ${wide ? "sm:max-w-5xl" : "sm:max-w-lg"}`}
      >
        <div aria-hidden className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-[var(--line)] sm:hidden" />
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="btn ml-auto h-10 w-10 rounded-full p-0" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

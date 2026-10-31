import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Baloo_2, Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { LockGuard } from "@/components/LockGuard";
import "./globals.css";

const latin = Noto_Sans({ variable: "--font-latin", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700", "800"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "600", "700"] });
// Rounded display face that also covers Devanagari, so Hindi headings and tile labels match the Latin ones.
const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin", "latin-ext", "devanagari"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "HomeTiles",
  description: "Communication boards that sound like home: an agent that builds AAC boards from a person's own culture, places and favourite things, using Qloo's taste graph.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff8ef" };

function Logo() {
  return (
    <span aria-hidden className="grid h-9 w-9 grid-cols-2 gap-[3px] rounded-xl border border-[var(--line)] bg-white p-[5px] shadow-[0_3px_0_var(--line)] transition-transform duration-300 group-hover:-rotate-6">
      <span className="rounded-[4px] bg-[var(--brand)]" />
      <span className="rounded-[4px] bg-[var(--sun)]" />
      <span className="rounded-[4px] bg-[var(--accent)]" />
      <span className="rounded-[4px] bg-[var(--grape)]" />
    </span>
  );
}

const REPO = "https://github.com/sosodtu/hometiles";

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, ColorZilla…) add attributes to <html>/<body>
    // before React loads. It only ignores attribute differences on these two elements, not their children.
    <html lang="en" suppressHydrationWarning className={`${latin.variable} ${deva.variable} ${baloo.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <LockGuard />
        <header className="site-chrome no-print glass sticky top-0 z-40 border-b border-[var(--line)]/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="group flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-xl font-extrabold tracking-tight">HomeTiles</span>
            </Link>
            <nav className="flex items-center gap-1 whitespace-nowrap text-sm font-bold sm:gap-3">
              <a href={REPO} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-white/70 sm:flex" aria-label="Source code on GitHub">
                <GitHubMark /> GitHub
              </a>
              <Link href="/board" className="rounded-lg px-2 py-1.5 hover:bg-white/70">My board</Link>
              <Link href="/create" className="btn btn-primary">
                <span aria-hidden>＋</span> New<span className="hidden sm:inline"> board</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="site-chrome no-print border-t border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--muted)]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-5 gap-y-5 px-4 py-8 leading-relaxed md:grid-cols-[1.2fr_repeat(4,1fr)]">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-[var(--ink)]">
                <Logo />
                <span className="font-display text-base font-extrabold">HomeTiles</span>
              </Link>
              <p className="mt-2 max-w-[16rem] text-sm text-[var(--ink)]">Made for kids who talk with pictures, and the people who listen.</p>
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wide text-[var(--ink)]">Where the words come from</p>
              <p>
                <strong>Qloo</strong>&apos;s taste graph finds the snacks, shows and places. Gemini runs the agent that asks it.
              </p>
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wide text-[var(--ink)]">Pictures</p>
              <p>
                Pictograms by Sergio Palao, from{" "}
                <a className="underline" href="https://arasaac.org" target="_blank" rel="noreferrer">
                  ARASAAC
                </a>{" "}
                (Government of Aragón), CC BY-NC-SA 4.0.
              </p>
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wide text-[var(--ink)]">Good to know</p>
              <p>Leo, Aarav and Sofía are made up. HomeTiles works alongside speech therapists, not instead of them.</p>
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wide text-[var(--ink)]">The code</p>
              <p>
                Open source under MIT.{" "}
                <a className="inline-flex items-center gap-1 font-semibold text-[var(--ink)] underline" href={REPO} target="_blank" rel="noreferrer">
                  <GitHubMark /> Read it on GitHub
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

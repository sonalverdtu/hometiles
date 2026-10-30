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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${latin.variable} ${deva.variable} ${baloo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LockGuard />
        <header className="site-chrome no-print glass sticky top-0 z-40 border-b border-[var(--line)]/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="group flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-xl font-extrabold tracking-tight">HomeTiles</span>
            </Link>
            <nav className="flex items-center gap-1 whitespace-nowrap text-sm font-bold sm:gap-3">
              <Link href="/board" className="rounded-lg px-2 py-1.5 hover:bg-white/70">My board</Link>
              <Link href="/create" className="btn btn-primary">
                <span aria-hidden>＋</span> New<span className="hidden sm:inline"> board</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="site-chrome no-print border-t border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--muted)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 leading-relaxed sm:flex-row sm:items-start">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-[var(--ink)]">
              <Logo />
              <span className="font-display text-base font-extrabold">HomeTiles</span>
            </Link>
            <p className="sm:ml-6">
              Powered by the <strong>Qloo</strong> taste graph · Pictograms by Sergio Palao, from{" "}
              <a className="underline" href="https://arasaac.org" target="_blank" rel="noreferrer">ARASAAC</a> (Government of Aragón), CC BY-NC-SA 4.0 ·
              Demo personas are fictional. HomeTiles supports, and doesn&apos;t replace, speech-language therapists. · MIT licensed
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

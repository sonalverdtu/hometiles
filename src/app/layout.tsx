import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const latin = Noto_Sans({ variable: "--font-latin", subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "HomeTiles",
  description: "Communication boards that sound like home: an agent that builds AAC boards from a person's own culture, places and favourite things, using Qloo's taste graph.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff7ed" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${latin.variable} ${deva.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="no-print border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand)] text-white">▦</span>
              HomeTiles
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/create" className="hover:underline">Create a board</Link>
              <Link href="/board" className="hover:underline">My board</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="no-print border-t border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--muted)]">
          <div className="mx-auto max-w-6xl px-4 py-4 leading-relaxed">
            Powered by the <strong>Qloo</strong> taste graph · Pictograms by Sergio Palao, from{" "}
            <a className="underline" href="https://arasaac.org" target="_blank" rel="noreferrer">ARASAAC</a> (Government of Aragón), CC BY-NC-SA 4.0 ·
            Demo personas are fictional. HomeTiles supports, and doesn&apos;t replace, speech-language therapists. · MIT licensed
          </div>
        </footer>
      </body>
    </html>
  );
}

import { describe, expect, it } from "vitest";
import { composeSentence, tileSpeech } from "../src/lib/board/sentence";
import type { Tile } from "../src/lib/board/types";

const tile = (id: string, kind: Tile["kind"], en: string, hi: string): Tile => ({
  id, kind, category: kind === "core" ? "core" : "food", label: { en, hi }, speak: { en: `${en}!!! long phrase`, hi: `${hi} बहुत पसंद है` }, emoji: "", locked: false, reasons: [],
});
const I = tile("core-i", "core", "I", "मैं");
const want = tile("core-want", "core", "want", "चाहिए");
const go = tile("core-go", "core", "go", "चलो");
const parle = tile("t-parle", "rotating", "Parle-G", "पारले-जी");
const dadaji = tile("people-0", "people", "Dada ji", "दादा जी");

describe("what the board says (Cboard rule: say the label)", () => {
  it("a tap says exactly the label, never a longer phrase", () => {
    expect(tileSpeech(dadaji, "hi")).toBe("दादा जी");
    expect(tileSpeech(parle, "en")).toBe("Parle-G");
  });
  it("I + want + thing becomes a grammatical sentence built only from the shown labels", () => {
    expect(composeSentence([I, want, parle], "hi")).toBe("मुझे पारले-जी चाहिए");
    expect(composeSentence([want, parle], "en")).toBe("I want Parle-G");
    expect(composeSentence([go, parle], "hi")).toBe("मुझे पारले-जी जाना है");
  });
  it("anything else says the labels in order", () => {
    expect(composeSentence([dadaji, parle], "hi")).toBe("दादा जी पारले-जी");
    expect(composeSentence([dadaji], "hi")).toBe("दादा जी");
  });
});

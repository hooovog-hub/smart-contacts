import { describe, expect, it } from "vitest";
import { type PickContact, sanitizePicks, selectCandidates } from "./picks.ts";

const today = "2026-11-17";
const c = (id: string, over: Partial<PickContact> = {}): PickContact => ({
  id,
  display_name: id,
  category_key: "unsorted",
  source: "phonebook",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("selectCandidates", () => {
  it("prioritises open needs, then new acquaintances, then business", () => {
    const out = selectCandidates(
      [
        c("biz", { category_key: "work" }),
        c("new", { source: "qr", created_at: "2026-11-10T00:00:00Z" }),
        c("seek", { linked_seeks: ["дистрибьютор в Грузии"] }),
      ],
      today,
      new Set(),
    );
    expect(out.map((x) => x.id)).toEqual(["seek", "new", "biz"]);
    expect(out[0].hint).toContain("дистрибьютор");
  });

  it("never treats a phonebook import as a new acquaintance", () => {
    const out = selectCandidates([c("imported", { created_at: "2026-11-10T00:00:00Z" })], today, new Set());
    expect(out).toEqual([]);
  });

  it("skips too fresh and too old acquaintances", () => {
    const out = selectCandidates(
      [
        c("yesterday", { source: "manual", created_at: "2026-11-16T00:00:00Z" }),
        c("old", { source: "manual", created_at: "2026-09-01T00:00:00Z" }),
      ],
      today,
      new Set(),
    );
    expect(out).toEqual([]);
  });

  it("skips recently shown people and respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => c(`w${i}`, { category_key: "work" }));
    const out = selectCandidates(many, today, new Set(["w0", "w1"]));
    expect(out).toHaveLength(3);
    expect(out.some((x) => x.id === "w0" || x.id === "w1")).toBe(false);
  });

  it("is deterministic for the same day", () => {
    const many = Array.from({ length: 10 }, (_, i) => c(`w${i}`, { category_key: "work" }));
    expect(selectCandidates(many, today, new Set())).toEqual(selectCandidates(many, today, new Set()));
  });
});

describe("sanitizePicks", () => {
  const cands = [{ id: "a", kind: "new" as const, hint: "Познакомились 7 дн. назад" }];
  it("keeps only offered candidates and falls back to the hint", () => {
    const out = sanitizePicks(
      {
        picks: [
          { id: "a", reason: "", message: "Привет! Как дела?" },
          { id: "x", reason: "r", message: "m" },
        ],
      },
      cands,
    );
    expect(out).toEqual([{ id: "a", reason: "Познакомились 7 дн. назад", message: "Привет! Как дела?" }]);
  });
  it("drops empty messages and bad input", () => {
    expect(sanitizePicks({ picks: [{ id: "a", message: "  " }] }, cands)).toEqual([]);
    expect(sanitizePicks(null, cands)).toEqual([]);
  });
});

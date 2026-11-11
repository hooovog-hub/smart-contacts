import { describe, expect, it } from "vitest";
import { TEMP_RE, UNSORTED, chunk, orderedSections, sectionColor, type Section } from "./sections.logic";

const s = (key: string, name = key): Section => ({ key, name, color: "#000" });

describe("orderedSections", () => {
  const all = [s("repair"), UNSORTED, s("friends"), s("med"), s("work"), s("family"), s("taxi")];

  it("puts Семья, Работа, Друзья first, then by size, Без раздела last", () => {
    const counts = { repair: 5, unsorted: 100, friends: 2, med: 9, work: 1, family: 3, taxi: 9 };
    expect(orderedSections(all, counts).map((x) => x.key)).toEqual([
      "family",
      "work",
      "friends",
      "med",
      "taxi",
      "repair",
      "unsorted",
    ]);
  });

  it("hides empty sections", () => {
    expect(orderedSections(all, { med: 1, unsorted: 0 }).map((x) => x.key)).toEqual(["med"]);
  });

  it("does not mutate the input", () => {
    const copy = [...all];
    orderedSections(all, { repair: 1, family: 1 });
    expect(all).toEqual(copy);
  });
});

describe("sectionColor", () => {
  it("maps palette tokens, passes hex through, greys out empty", () => {
    expect(sectionColor("a1")).toBe("#6E7BFF");
    expect(sectionColor("#123456")).toBe("#123456");
    expect(sectionColor(null)).toBe("#8E8E93");
  });
});

describe("TEMP_RE", () => {
  it("detects temporary contacts", () => {
    for (const t of ["Yandex Taxi", "такси Гор", "Курьер", "трансфер аэропорт"]) expect(TEMP_RE.test(t)).toBe(true);
    for (const t of ["Karen varpet", "Mama"]) expect(TEMP_RE.test(t)).toBe(false);
  });
});

describe("chunk", () => {
  it("splits into batches of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 120)).toEqual([]);
  });
  it("rejects a non-positive size", () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import {
  buildContactLines,
  countSorted,
  groupAssignments,
  normalizeKey,
  parseModelJson,
  sanitizeNewSections,
  type ContactRow,
} from "./classify.ts";

const rows: ContactRow[] = [
  { id: "c1", display_name: "Mama" },
  { id: "c2", display_name: "Karen varpet", role: "двери" },
  { id: "c3", display_name: "Ashot ahper", note: "сосед" },
];

describe("parseModelJson", () => {
  it("parses plain JSON", () => {
    expect(parseModelJson('{"add":[]}')).toEqual({ add: [] });
  });
  it("extracts JSON wrapped in prose or code fences", () => {
    expect(parseModelJson('Вот ответ:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("returns null instead of throwing on garbage", () => {
    expect(parseModelJson("no json here")).toBeNull();
    expect(parseModelJson("{broken")).toBeNull();
  });
});

describe("normalizeKey", () => {
  it("keeps latin snake_case only, max 30 chars", () => {
    expect(normalizeKey("Team-Papaya!")).toBe("teampapaya");
    expect(normalizeKey("Такси")).toBe("");
    expect(normalizeKey("a".repeat(50))).toHaveLength(30);
    expect(normalizeKey(undefined)).toBe("");
  });
});

describe("sanitizeNewSections", () => {
  const existing = [
    { key: "family", name: "Семья" },
    { key: "work", name: "Работа" },
  ];

  it("drops invalid, duplicate and reserved sections", () => {
    const out = sanitizeNewSections(
      [
        { key: "taxi", name: "Такси" },
        { key: "family", name: "Родные" }, // duplicate key
        { key: "clients", name: "работа" }, // duplicate name (case-insensitive)
        { key: "unsorted", name: "Без раздела" }, // reserved
        { key: "Такси", name: "Такси 2" }, // empty after normalisation
        { key: "taxi", name: "Такси снова" }, // duplicate inside the answer
        { key: "sport", name: "" }, // no name
      ],
      existing,
    );
    expect(out).toEqual([{ key: "taxi", name: "Такси" }]);
  });

  it("returns at most 6 sections", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ key: `g${i}`, name: `Группа ${i}` }));
    expect(sanitizeNewSections(many, existing)).toHaveLength(6);
  });

  it("tolerates a non-array answer", () => {
    expect(sanitizeNewSections(null, existing)).toEqual([]);
    expect(sanitizeNewSections({ key: "x" }, existing)).toEqual([]);
  });
});

describe("buildContactLines", () => {
  it("includes index, name, role and note", () => {
    expect(buildContactLines(rows)).toBe("0\tMama\n1\tKaren varpet — двери\n2\tAshot ahper (заметка: сосед)");
  });

  it("never sends phone numbers to the model", () => {
    const withPhone = [{ id: "x", display_name: "Gor", phone: "+37499123456" } as ContactRow];
    expect(buildContactLines(withPhone)).not.toContain("37499");
  });
});

describe("groupAssignments", () => {
  const keys = new Set(["family", "repair"]);

  it("groups ids by section", () => {
    const out = groupAssignments(
      [
        { i: 0, k: "family" },
        { i: 1, k: "repair" },
        { i: 2, k: "unsorted" },
      ],
      rows,
      keys,
    );
    expect(Object.fromEntries(out)).toEqual({ family: ["c1"], repair: ["c2"], unsorted: ["c3"] });
    expect(countSorted(out)).toBe(2);
  });

  it("sends unknown sections and skipped rows to unsorted", () => {
    const out = groupAssignments([{ i: 0, k: "made_up" }], rows, keys);
    expect(Object.fromEntries(out)).toEqual({ unsorted: ["c1", "c2", "c3"] });
    expect(countSorted(out)).toBe(0);
  });

  it("ignores bad indexes and assigns each contact only once", () => {
    const out = groupAssignments(
      [
        { i: 99, k: "family" },
        { i: "x", k: "family" },
        { i: 1.5, k: "family" },
        { i: 0, k: "family" },
        { i: 0, k: "repair" },
      ],
      rows,
      keys,
    );
    expect(out.get("family")).toEqual(["c1"]);
    expect(out.get("repair")).toBeUndefined();
    expect(out.get("unsorted")).toEqual(["c2", "c3"]);
  });

  it("treats a missing answer as all unsorted", () => {
    expect(Object.fromEntries(groupAssignments(undefined, rows, keys))).toEqual({ unsorted: ["c1", "c2", "c3"] });
  });
});

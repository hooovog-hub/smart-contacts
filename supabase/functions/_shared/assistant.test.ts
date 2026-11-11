import { describe, expect, it } from "vitest";
import { sanitizeAnswer } from "./assistant.ts";

const mine = new Set(["karen", "ashot", "gor", "lilit", "aram"]);

describe("sanitizeAnswer", () => {
  it("keeps only the owner's own contacts", () => {
    const out = sanitizeAnswer(
      {
        category: "home",
        reply: "Вот кто поможет",
        people: [
          { id: "karen", kind: "direct", why: "делает двери", ask: "Привет!" },
          { id: "stranger", kind: "direct", why: "выдуман", ask: "" },
        ],
      },
      "",
      mine,
    );
    expect(out.category).toBe("home");
    expect(out.people.map((p) => p.contactId)).toEqual(["karen"]);
  });

  it("returns at most 4 people and no duplicates", () => {
    const people = ["karen", "karen", "ashot", "gor", "lilit", "aram"].map((id) => ({ id, kind: "direct" }));
    const out = sanitizeAnswer({ people }, "", mine);
    expect(out.people.map((p) => p.contactId)).toEqual(["karen", "ashot", "gor", "lilit"]);
  });

  it("normalises kind and category", () => {
    const out = sanitizeAnswer({ category: "hacking", people: [{ id: "gor", kind: "weird" }] }, "", mine);
    expect(out.category).toBe("biz");
    expect(out.people[0]).toEqual({ contactId: "gor", kind: "direct", why: "", ask: "" });
  });

  it("falls back to raw text when the model did not return JSON", () => {
    expect(sanitizeAnswer(null, "Не понял задачу", mine)).toEqual({
      category: "biz",
      reply: "Не понял задачу",
      people: [],
    });
  });
});

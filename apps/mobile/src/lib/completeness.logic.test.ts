import { describe, expect, it } from "vitest";
import { completeness, normalizeLink } from "./completeness.logic";
import type { Profile } from "./types";

const base: Profile = { id: "u1", handle: "h", full_name: "Hovhannes Ghazaryan", links: {}, plan: "pro" };

describe("completeness", () => {
  it("counts only the name for a fresh profile", () => {
    const r = completeness(base);
    expect(r.done).toBe(1);
    expect(r.total).toBe(10);
    expect(r.pct).toBe(10);
    expect(r.todo.map((t) => t.id)).toContain("instagram");
  });

  it("reaches 100% when everything is filled", () => {
    const full: Profile = {
      ...base,
      role: "CEO",
      phone: "+37495944844",
      bio: "Строю продукты",
      city: "Ереван",
      links: { instagram: "@h", linkedin: "https://linkedin.com/in/h", site: "https://df.am" },
      brands: [{ name: "Digital Factory", links: {}, position: 0 }],
      memberships: [{ org_name: "Манташянц" }],
    };
    const r = completeness(full);
    expect(r.pct).toBe(100);
    expect(r.todo).toEqual([]);
  });

  it("treats whitespace as empty", () => {
    expect(completeness({ ...base, bio: "   " }).todo.some((t) => t.id === "bio")).toBe(true);
  });
});

describe("normalizeLink", () => {
  it("normalises Instagram handles and URLs", () => {
    expect(normalizeLink("instagram", "hovhannes.g")).toBe("@hovhannes.g");
    expect(normalizeLink("instagram", "@@hovhannes.g")).toBe("@hovhannes.g");
    expect(normalizeLink("instagram", "https://www.instagram.com/hovhannes.g/")).toBe("@hovhannes.g");
  });
  it("rejects invalid Instagram input", () => {
    expect(normalizeLink("instagram", "https://instagram.com/")).toBeNull();
    expect(normalizeLink("instagram", "my name")).toBeNull();
  });
  it("builds LinkedIn URLs", () => {
    expect(normalizeLink("linkedin", "hovhannes")).toBe("https://www.linkedin.com/in/hovhannes");
    expect(normalizeLink("linkedin", "linkedin.com/in/h")).toBe("https://linkedin.com/in/h");
  });
  it("adds https to sites and returns null for empty", () => {
    expect(normalizeLink("site", "df.am")).toBe("https://df.am");
    expect(normalizeLink("site", "  ")).toBeNull();
  });
});

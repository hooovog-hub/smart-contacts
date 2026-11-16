import { describe, expect, it } from "vitest";
import { completeness, HIDDEN, messenger, normalizeLink } from "./completeness.logic";
import type { Profile } from "./types";

const base: Profile = { id: "u1", handle: "h", full_name: "Hovhannes Ghazaryan", links: {}, plan: "pro" };

describe("completeness", () => {
  it("starts at zero for a fresh profile (name is not counted)", () => {
    const r = completeness(base);
    expect(r.done).toBe(0);
    expect(r.total).toBe(10);
    expect(r.todo.map((t) => t.id)).toContain("photo");
    expect(r.todo.some((t) => t.id === "site")).toBe(false);
  });

  it("reaches 100% when everything is filled", () => {
    const full: Profile = {
      ...base,
      avatar_url: "https://x/a.jpg",
      role: "CEO",
      phone: "+37495944844",
      bio: "Строю продукты",
      city: "Ереван",
      links: { instagram: "@h", linkedin: "https://linkedin.com/in/h" },
      brands: [{ name: "Digital Factory", links: {}, position: 0 }],
      memberships: [{ org_name: "Манташянц" }],
    };
    const r = completeness(full, 1);
    expect(r.pct).toBe(100);
    expect(r.todo).toEqual([]);
  });

  it("counts open needs", () => {
    expect(completeness(base, 0).todo.some((t) => t.id === "seeks")).toBe(true);
    expect(completeness(base, 2).todo.some((t) => t.id === "seeks")).toBe(false);
  });
});

describe("normalizeLink", () => {
  it("Instagram", () => {
    expect(normalizeLink("instagram", "hovhannes.g")).toBe("@hovhannes.g");
    expect(normalizeLink("instagram", "https://www.instagram.com/hovhannes.g/")).toBe("@hovhannes.g");
    expect(normalizeLink("instagram", "my name")).toBeNull();
  });
  it("LinkedIn", () => {
    expect(normalizeLink("linkedin", "hovhannes")).toBe("https://www.linkedin.com/in/hovhannes");
    expect(normalizeLink("linkedin", "linkedin.com/in/h")).toBe("https://linkedin.com/in/h");
  });
  it("Telegram: username or number", () => {
    expect(normalizeLink("telegram", "@hovo_g")).toBe("@hovo_g");
    expect(normalizeLink("telegram", "https://t.me/hovo_g")).toBe("@hovo_g");
    expect(normalizeLink("telegram", "+374 95 944 844")).toBe("+37495944844");
  });
  it("WhatsApp and email", () => {
    expect(normalizeLink("whatsapp", "374 95 944 844")).toBe("+37495944844");
    expect(normalizeLink("whatsapp", "123")).toBeNull();
    expect(normalizeLink("email", "Me@Mail.com")).toBe("me@mail.com");
    expect(normalizeLink("email", "nope")).toBeNull();
  });
});

describe("messenger", () => {
  it("defaults to the phone, can be custom or hidden", () => {
    expect(messenger({ phone: "+374", links: {} }, "whatsapp")).toEqual({ mode: "same", value: "+374" });
    expect(messenger({ phone: "+374", links: { telegram: "@me" } }, "telegram")).toEqual({
      mode: "custom",
      value: "@me",
    });
    expect(messenger({ phone: "+374", links: { whatsapp: HIDDEN } }, "whatsapp").mode).toBe("hidden");
    expect(messenger({ phone: null, links: {} }, "whatsapp").mode).toBe("none");
  });
});

import { describe, expect, it } from "vitest";
import { LINK_TTL_SEC, REQUIRED_ENV, canHaveCard, cardContent, missingEnv, signLink, verifyLink } from "./_wallet.js";
import { PASS_IMAGES_B64 } from "./_pass-images.js";

const UID = "3f2a9c1e-8b7d-4e6f-9a0b-1c2d3e4f5a6b";
const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

describe("signed download link", () => {
  it("round-trips the user id", () => {
    expect(verifyLink(signLink(UID, SECRET, NOW), SECRET, NOW)).toBe(UID);
  });

  it("expires after 5 minutes", () => {
    const t = signLink(UID, SECRET, NOW);
    expect(verifyLink(t, SECRET, NOW + (LINK_TTL_SEC - 1) * 1000)).toBe(UID);
    expect(verifyLink(t, SECRET, NOW + (LINK_TTL_SEC + 1) * 1000)).toBeNull();
  });

  it("rejects a forged or altered link", () => {
    const t = signLink(UID, SECRET, NOW);
    const other = "00000000-0000-4000-8000-000000000000";
    expect(verifyLink(t, "other-secret", NOW)).toBeNull();
    expect(verifyLink(t.replace(UID, other), SECRET, NOW)).toBeNull();
    const [u, , sig] = t.split(".");
    expect(verifyLink(`${u}.99999999999.${sig}`, SECRET, NOW)).toBeNull();
  });

  it("never throws on garbage", () => {
    for (const bad of [undefined, "", "a.b", "a.b.c.d", `${UID}.x.y`, 42])
      expect(verifyLink(bad, SECRET, NOW)).toBeNull();
    expect(verifyLink(signLink(UID, SECRET, NOW), "", NOW)).toBeNull();
  });

  it("refuses to sign without a valid user id or secret", () => {
    expect(() => signLink("not-a-uuid", SECRET)).toThrow();
    expect(() => signLink(UID, "")).toThrow();
  });
});

describe("missingEnv", () => {
  it("lists missing certificates and secrets", () => {
    expect(missingEnv({})).toEqual(REQUIRED_ENV);
    const full = Object.fromEntries(REQUIRED_ENV.map((k) => [k, "x"]));
    expect(missingEnv(full)).toEqual([]);
    expect(missingEnv({ ...full, WALLET_TEAM_ID: "  " })).toEqual(["WALLET_TEAM_ID"]);
  });
});

describe("canHaveCard", () => {
  it("is a Pro/Business feature", () => {
    expect(canHaveCard("pro")).toBe(true);
    expect(canHaveCard("business")).toBe(true);
    expect(canHaveCard("free")).toBe(false);
    expect(canHaveCard(undefined)).toBe(false);
  });
});

describe("cardContent", () => {
  it("matches the design: name, role · company, phone, email, QR to the profile", () => {
    const c = cardContent(
      {
        handle: "hovhannes",
        full_name: " Hovhannes Ghazaryan ",
        role: "Основатель",
        phone: "+374 00 000 000",
        links: { email: "name@factorydf.am", instagram: "x" },
        brands: [{ name: "Factory DF" }, { name: "Other" }],
      },
      "https://smartcontacts.app/",
    );
    expect(c).toEqual({
      name: "Hovhannes Ghazaryan",
      roleLine: "Основатель · Factory DF",
      phone: "+374 00 000 000",
      email: "name@factorydf.am",
      profileUrl: "https://smartcontacts.app/hovhannes",
    });
  });

  it("drops empty parts instead of printing separators", () => {
    const c = cardContent({ handle: "a", full_name: "A", role: null, brands: [], links: null }, "https://x.am");
    expect(c.roleLine).toBe("");
    expect(c.email).toBe("");
    expect(cardContent({ handle: "a", role: "", brands: [{ name: "Brand" }] }, "https://x.am").roleLine).toBe("Brand");
  });

  it("encodes the handle in the QR url", () => {
    expect(cardContent({ handle: "a b" }, "https://x.am").profileUrl).toBe("https://x.am/a%20b");
  });
});

describe("pass images", () => {
  it("ships the icon Apple requires, in all three sizes, as real PNGs", () => {
    for (const k of ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"]) {
      const buf = Buffer.from(PASS_IMAGES_B64[k], "base64");
      expect(buf.subarray(1, 4).toString()).toBe("PNG");
    }
  });
});

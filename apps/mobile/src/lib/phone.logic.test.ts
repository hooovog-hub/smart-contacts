import { describe, expect, it } from "vitest";
import { COUNTRIES, DEFAULT_COUNTRY, fromE164, isPlausible, toE164 } from "./phone.logic";

const AM = DEFAULT_COUNTRY;
const RU = COUNTRIES.find((c) => c.iso === "RU")!;

describe("toE164", () => {
  it("adds the country code to a national number", () => {
    expect(toE164(AM, "95944844")).toBe("+37495944844");
    expect(toE164(AM, "95 94-48 44")).toBe("+37495944844");
  });
  it("drops the national leading zero", () => {
    expect(toE164(AM, "095 944 844")).toBe("+37495944844");
  });
  it("keeps a pasted full number", () => {
    expect(toE164(AM, "+7 916 123-45-67")).toBe("+79161234567");
    expect(toE164(AM, "0037495944844")).toBe("+37495944844");
  });
  it("does not double the dial code if the user typed it", () => {
    expect(toE164(AM, "37495944844")).toBe("+37495944844");
    expect(toE164(RU, "79161234567")).toBe("+79161234567");
  });
  it("returns null for empty input", () => {
    expect(toE164(AM, "  ")).toBeNull();
    expect(toE164(AM, "-")).toBeNull();
  });
});

describe("fromE164", () => {
  it("splits a stored number into country and national part", () => {
    expect(fromE164("+37495944844")).toEqual({ country: AM, national: "95944844" });
    expect(fromE164("+79161234567").country.dial).toBe("7");
  });
  it("prefers the longest dial code", () => {
    expect(fromE164("+375291234567").country.iso).toBe("BY");
  });
  it("handles empty and legacy values", () => {
    expect(fromE164(null)).toEqual({ country: AM, national: "" });
    expect(fromE164("095944844")).toEqual({ country: AM, national: "095944844" });
  });
  it("round-trips", () => {
    const { country, national } = fromE164("+995555123456");
    expect(toE164(country, national)).toBe("+995555123456");
  });
});

describe("isPlausible", () => {
  it("accepts empty (optional) and normal numbers", () => {
    expect(isPlausible(null)).toBe(true);
    expect(isPlausible("+37495944844")).toBe(true);
  });
  it("rejects too short or too long", () => {
    expect(isPlausible("+3749")).toBe(false);
    expect(isPlausible("+3749594484412345")).toBe(false);
  });
});

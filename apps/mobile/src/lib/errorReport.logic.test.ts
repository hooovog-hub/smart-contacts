import { describe, expect, it } from "vitest";
import { MAX_MESSAGE, buildReport, createThrottle, errorMessage, scrub } from "./errorReport.logic";

describe("scrub", () => {
  it("masks phone numbers", () => {
    expect(scrub("failed for +374 99 123-456")).toBe("failed for [number]");
    expect(scrub("id 37499123456 bad")).toBe("id [number] bad");
  });
  it("keeps short numbers (line numbers, status codes)", () => {
    expect(scrub("HTTP 502 at line 42")).toBe("HTTP 502 at line 42");
  });
});

describe("errorMessage", () => {
  it("handles Error, string and objects", () => {
    expect(errorMessage(new TypeError("boom"))).toBe("boom");
    expect(errorMessage("plain")).toBe("plain");
    expect(errorMessage({ code: 1 })).toBe('{"code":1}');
    expect(errorMessage(undefined)).toBe("Unknown error");
  });
  it("survives circular objects", () => {
    const o: Record<string, unknown> = {};
    o.self = o;
    expect(errorMessage(o)).toBe("Unknown error");
  });
});

describe("buildReport", () => {
  it("builds a bounded mobile row", () => {
    const row = buildReport(new Error("x".repeat(5000)), { fatal: true, appVersion: "0.1.0", platform: "ios 18" });
    expect(row.source).toBe("mobile");
    expect(row.fatal).toBe(true);
    expect(row.message).toHaveLength(MAX_MESSAGE);
    expect(row.app_version).toBe("0.1.0");
    expect(row.stack).toContain("Error");
  });
  it("defaults to non-fatal with nulls", () => {
    expect(buildReport("oops")).toEqual({
      source: "mobile",
      message: "oops",
      stack: null,
      fatal: false,
      app_version: null,
      platform: null,
      context: null,
    });
  });
});

describe("createThrottle", () => {
  it("sends each message once and caps the session", () => {
    const allow = createThrottle(2);
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(false);
    expect(allow("b")).toBe(true);
    expect(allow("c")).toBe(false);
  });
});

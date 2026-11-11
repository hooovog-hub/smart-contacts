import { describe, expect, it } from "vitest";
import {
  FREE_AI_TASKS_PER_MONTH,
  MAX_MESSAGE_CHARS,
  limitMessage,
  limitResponse,
  limitsFor,
  validateMessage,
} from "./limits.ts";

describe("limitsFor", () => {
  it("gives Free a monthly quota of new AI tasks", () => {
    expect(limitsFor("assistant_task", "free").perMonth).toBe(FREE_AI_TASKS_PER_MONTH);
    expect(FREE_AI_TASKS_PER_MONTH).toBe(5);
  });

  it("treats unknown or missing plan as Free", () => {
    expect(limitsFor("assistant_task", undefined).perMonth).toBe(5);
    expect(limitsFor("assistant_task", "vip").perMonth).toBe(5);
  });

  it("removes the monthly quota for paid plans", () => {
    expect(limitsFor("assistant_task", "pro").perMonth).toBeNull();
    expect(limitsFor("assistant_task", "business").perMonth).toBeNull();
  });

  it("rate-limits every AI function for every plan", () => {
    for (const plan of ["free", "pro", "business"]) {
      expect(limitsFor("assistant", plan).perMinute).toBeGreaterThan(0);
      expect(limitsFor("classify", plan).perMinute).toBeGreaterThan(0);
      expect(limitsFor("classify_plan", plan).perDay).toBeGreaterThan(0);
    }
  });

  it("returns a copy, so callers cannot change the shared table", () => {
    const l = limitsFor("assistant", "pro");
    l.perMinute = 9999;
    expect(limitsFor("assistant", "pro").perMinute).not.toBe(9999);
  });
});

describe("limitResponse", () => {
  it("builds a 429 with Retry-After", () => {
    const r = limitResponse({ ok: false, reason: "rate_minute", retry_after: 60 });
    expect(r.status).toBe(429);
    expect(r.headers["Retry-After"]).toBe("60");
    expect(r.body).toMatchObject({ error: "limit", reason: "rate_minute", retryAfter: 60 });
  });

  it("explains the Free quota and suggests Pro", () => {
    expect(limitMessage("quota_month")).toContain("Pro");
    expect(limitMessage("whatever")).toBeTruthy();
  });

  it("sanitises a bad retry_after", () => {
    expect(limitResponse({ ok: false, retry_after: -5 }).headers["Retry-After"]).toBe("0");
  });
});

describe("validateMessage", () => {
  it("rejects empty and non-string messages", () => {
    expect(validateMessage("")).not.toBeNull();
    expect(validateMessage("   ")).not.toBeNull();
    expect(validateMessage(42)).not.toBeNull();
    expect(validateMessage(undefined)).not.toBeNull();
  });

  it("rejects messages that are too long", () => {
    expect(validateMessage("a".repeat(MAX_MESSAGE_CHARS + 1))).not.toBeNull();
    expect(validateMessage("a".repeat(MAX_MESSAGE_CHARS))).toBeNull();
  });

  it("accepts a normal message", () => {
    expect(validateMessage("Нужны двери в офис")).toBeNull();
  });
});

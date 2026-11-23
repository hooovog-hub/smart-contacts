import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({ default: {} }));
vi.mock("./supabase", () => ({ supabase: {} }));
vi.mock("./config", () => ({ SITE_URL: "https://becontact.app" }));

const { inviteCodeFromUrl, inviteMessage } = await import("./invite");

describe("inviteCodeFromUrl", () => {
  it("reads the code from deep links and web links", () => {
    expect(inviteCodeFromUrl("smartcontacts://i/AB12cd34")).toBe("ab12cd34");
    expect(inviteCodeFromUrl("https://becontact.app/i/ab12cd34?x=1")).toBe("ab12cd34");
  });
  it("ignores other links", () => {
    expect(inviteCodeFromUrl("https://becontact.app/hovhannes")).toBeNull();
    expect(inviteCodeFromUrl("smartcontacts://i/!!")).toBeNull();
    expect(inviteCodeFromUrl(null)).toBeNull();
  });
});

describe("inviteMessage", () => {
  it("contains the personal link and the name", () => {
    const m = inviteMessage("Ованнес", "ab12cd34");
    expect(m).toContain("https://becontact.app/i/ab12cd34");
    expect(m).toContain("Ованнес");
  });
});

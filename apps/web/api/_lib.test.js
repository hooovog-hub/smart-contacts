import { afterEach, describe, expect, it, vi } from "vitest";

async function load(secret) {
  vi.resetModules();
  vi.stubEnv("SUPABASE_URL", "https://db.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example");
  vi.stubEnv("SUPABASE_SECRET_KEY", secret);
  return import("./_lib.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("profilePhone (SC-103)", () => {
  it("returns null without the secret key and does not call the database", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { profilePhone } = await load("");
    expect(await profilePhone({ handle: "ani" })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks for exactly one profile with the secret key and returns its phone", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ phone: "+37491000000" }] });
    vi.stubGlobal("fetch", fetch);
    const { profilePhone } = await load("sb_secret_test");
    expect(await profilePhone({ handle: "a&b=c" })).toBe("+37491000000");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://db.example/rest/v1/profiles?handle=eq.a%26b%3Dc&select=phone&limit=1");
    expect(init.headers.apikey).toBe("sb_secret_test");
  });

  it("returns null on errors and empty results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    let { profilePhone } = await load("k");
    expect(await profilePhone({ id: "x" })).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    ({ profilePhone } = await load("k"));
    expect(await profilePhone({ id: "x" })).toBeNull();
    expect(await profilePhone({})).toBeNull();
  });
});

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

describe("withinHourlyLimit (SC-103)", () => {
  const req = (h) => ({ headers: h });

  it("reads the visitor IP from Vercel headers", async () => {
    const { clientIp } = await load("k");
    expect(clientIp(req({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientIp(req({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(req({}))).toBe("");
  });

  it("sends a hashed IP, never the IP itself, and follows the database answer", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => true });
    vi.stubGlobal("fetch", fetch);
    const { withinHourlyLimit } = await load("sb_secret_test");
    expect(await withinHourlyLimit(req({ "x-real-ip": "1.2.3.4" }), "vcard", 20)).toBe(true);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://db.example/rest/v1/rpc/web_rate_hit");
    const body = JSON.parse(init.body);
    expect(body.p_limit).toBe(20);
    expect(body.p_key).toMatch(/^vcard:[0-9a-f]{64}$/);
    expect(init.body).not.toContain("1.2.3.4");
  });

  it("says no when over the limit or unsure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => false }));
    let { withinHourlyLimit } = await load("k");
    expect(await withinHourlyLimit(req({ "x-real-ip": "1.2.3.4" }), "vcard", 20)).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    ({ withinHourlyLimit } = await load("k"));
    expect(await withinHourlyLimit(req({ "x-real-ip": "1.2.3.4" }), "vcard", 20)).toBe(false);
    expect(await withinHourlyLimit(req({}), "vcard", 20)).toBe(false);
    ({ withinHourlyLimit } = await load(""));
    expect(await withinHourlyLimit(req({ "x-real-ip": "1.2.3.4" }), "vcard", 20)).toBe(false);
  });
});

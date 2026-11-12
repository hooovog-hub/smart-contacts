// k6 load test for Smart Contacts. Does NOT call Claude (no AI cost).
//
//   brew install k6
//   k6 run tests/load/smart-contacts.js                       # smoke: 1 user, 30 s
//   PROFILE=load k6 run tests/load/smart-contacts.js          # ramp to 50 users, ~5 min
//   TEST_EMAIL=... TEST_PASSWORD=... k6 run tests/load/...    # + signed-in reads (use a TEST account only)
//
// Thresholds come from PRD §6: public profile < 1.5 s; plus fast DB reads and < 1 % errors.
import http from "k6/http";
import { check, group, sleep } from "k6";

const SITE = __ENV.SITE_URL || "https://smart-contacts.vercel.app";
const SUPABASE = __ENV.SUPABASE_URL || "https://nqaooorpdptdsucgmwkg.supabase.co";
const ANON = __ENV.SUPABASE_ANON_KEY || "sb_publishable_GfWvjvyRAIdtg95QRTjdUg_UjFysWxI"; // publishable key
const HANDLES = (__ENV.HANDLES || "ani.mkrtchyan").split(",");
const PROFILE = __ENV.PROFILE || "smoke";

const stages = {
  smoke: [{ duration: "30s", target: 1 }],
  load: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 },
  ],
};

export const options = {
  scenarios: { users: { executor: "ramping-vus", startVUs: 1, stages: stages[PROFILE] || stages.smoke } },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:web_profile}": ["p(95)<1500"],
    "http_req_duration{name:rest_public_profile}": ["p(95)<800"],
    "http_req_duration{name:rest_contacts}": ["p(95)<800"],
  },
};

const restHeaders = (token) => ({ apikey: ANON, Authorization: `Bearer ${token || ANON}` });

export function setup() {
  if (!__ENV.TEST_EMAIL || !__ENV.TEST_PASSWORD) return { token: null };
  const res = http.post(
    `${SUPABASE}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: __ENV.TEST_EMAIL, password: __ENV.TEST_PASSWORD }),
    { headers: { apikey: ANON, "Content-Type": "application/json" } },
  );
  check(res, { "test user signed in": (r) => r.status === 200 });
  return { token: res.status === 200 ? res.json("access_token") : null };
}

export default function (data) {
  const handle = HANDLES[Math.floor(Math.random() * HANDLES.length)];

  group("guest opens a profile by QR", () => {
    const res = http.get(`${SITE}/${handle}`, { tags: { name: "web_profile" } });
    check(res, { "profile 200": (r) => r.status === 200 });
  });

  group("public profile via API", () => {
    const res = http.get(
      `${SUPABASE}/rest/v1/profiles?handle=eq.${encodeURIComponent(handle)}&select=id,full_name,role,plan,brands(name)`,
      { headers: restHeaders(), tags: { name: "rest_public_profile" } },
    );
    check(res, { "rest profile 200": (r) => r.status === 200 });
  });

  if (data.token) {
    group("owner opens the contact book", () => {
      const res = http.get(
        `${SUPABASE}/rest/v1/contacts?select=id,display_name,role,category_key&archived=eq.false&order=display_name&limit=200`,
        { headers: restHeaders(data.token), tags: { name: "rest_contacts" } },
      );
      check(res, { "contacts 200": (r) => r.status === 200 });
    });
  }

  sleep(1 + Math.random() * 2);
}

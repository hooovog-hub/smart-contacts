// Pure crash-report logic (no React Native imports — unit-tested with Vitest).
// Reports go to public.client_errors (migration 0007). Never put contact data (names, phones, notes) in reports.

export type ErrorRow = {
  source: "mobile";
  message: string;
  stack: string | null;
  fatal: boolean;
  app_version: string | null;
  platform: string | null;
  context: Record<string, unknown> | null;
};

export const MAX_MESSAGE = 1000;
export const MAX_STACK = 8000;
export const MAX_REPORTS_PER_SESSION = 20;

/** Phone-like digit runs are masked so a number that ended up in an error message is not stored. */
export function scrub(text: string): string {
  return text.replace(/\+?\d[\d\s\-()]{6,}\d/g, "[number]");
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || err.name || "Error";
  if (typeof err === "string") return err || "Error";
  try {
    return JSON.stringify(err) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}

/** Turn any thrown value into a bounded, scrubbed row for client_errors. */
export function buildReport(
  err: unknown,
  opts: {
    fatal?: boolean;
    appVersion?: string | null;
    platform?: string | null;
    context?: Record<string, unknown>;
  } = {},
): ErrorRow {
  const stack = err instanceof Error && err.stack ? scrub(err.stack).slice(0, MAX_STACK) : null;
  return {
    source: "mobile",
    message: scrub(errorMessage(err)).slice(0, MAX_MESSAGE) || "Error",
    stack,
    fatal: Boolean(opts.fatal),
    app_version: opts.appVersion?.slice(0, 40) ?? null,
    platform: opts.platform?.slice(0, 40) ?? null,
    context: opts.context ?? null,
  };
}

/** Per-session throttle: at most N reports, and the same message only once. */
export function createThrottle(max = MAX_REPORTS_PER_SESSION) {
  const seen = new Set<string>();
  return (message: string): boolean => {
    if (seen.size >= max || seen.has(message)) return false;
    seen.add(message);
    return true;
  };
}

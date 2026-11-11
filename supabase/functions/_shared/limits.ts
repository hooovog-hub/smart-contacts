// AI limits and rate limits (pure, unit-tested). Enforced in the database by public.ai_consume (migration 0006).
// Plans: docs/01-product/features/plans-billing.md — Free has 5 AI tasks per month.

export type Plan = "free" | "pro" | "business";
export type AiFn = "assistant" | "assistant_task" | "classify" | "classify_plan";
export type Limits = { perMinute: number | null; perDay: number | null; perMonth: number | null };
export type ConsumeResult = { ok: boolean; reason?: string; retry_after?: number };

/** Longest message accepted by the assistant (keeps prompts and cost bounded). */
export const MAX_MESSAGE_CHARS = 2000;
export const FREE_AI_TASKS_PER_MONTH = 5;

const BASE: Record<AiFn, Limits> = {
  // Every assistant message (new task or follow-up).
  assistant: { perMinute: 10, perDay: 200, perMonth: null },
  // New assistant tasks: monthly quota for Free only (set in limitsFor).
  assistant_task: { perMinute: null, perDay: null, perMonth: null },
  // One batch of up to 150 contacts; 400/day ≈ 60 000 contacts.
  classify: { perMinute: 30, perDay: 400, perMonth: null },
  // Planning sections reads the whole book — rare by design.
  classify_plan: { perMinute: 2, perDay: 10, perMonth: null },
};

/** Limits for a function and plan. Unknown plan is treated as Free. */
export function limitsFor(fn: AiFn, plan: string | null | undefined): Limits {
  const base = BASE[fn];
  const isPaid = plan === "pro" || plan === "business";
  if (fn === "assistant_task" && !isPaid) return { ...base, perMonth: FREE_AI_TASKS_PER_MONTH };
  return { ...base };
}

/** Human message for a refusal, in Russian (UI language of the MVP). */
export function limitMessage(reason: string | undefined): string {
  switch (reason) {
    case "rate_minute":
      return "Слишком много запросов. Подождите минуту и попробуйте снова.";
    case "rate_day":
      return "Дневной лимит AI исчерпан. Попробуйте завтра.";
    case "quota_month":
      return `На тарифе Free доступно ${FREE_AI_TASKS_PER_MONTH} задач AI в месяц. Перейдите на Pro, чтобы снять лимит.`;
    default:
      return "AI сейчас недоступен. Попробуйте позже.";
  }
}

/** Body + headers for an HTTP 429 answer. */
export function limitResponse(result: ConsumeResult): {
  status: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
} {
  const retry = Math.max(0, Math.floor(Number(result.retry_after ?? 60)));
  return {
    status: 429,
    body: {
      error: "limit",
      reason: result.reason ?? "unknown",
      message: limitMessage(result.reason),
      retryAfter: retry,
    },
    headers: { "Retry-After": String(retry) },
  };
}

/** Validate the assistant message: non-empty, not too long. Returns an error text or null. */
export function validateMessage(message: unknown): string | null {
  if (typeof message !== "string" || !message.trim()) return "Empty message";
  if (message.length > MAX_MESSAGE_CHARS) return `Message too long (max ${MAX_MESSAGE_CHARS} chars)`;
  return null;
}

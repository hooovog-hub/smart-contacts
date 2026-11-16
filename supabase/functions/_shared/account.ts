// Pure helpers for the delete-account Edge Function (no Deno APIs, so they run in vitest too).

/** The client must send this exact phrase; protects against an accidental or replayed empty call. */
export const DELETE_CONFIRMATION = "DELETE_MY_ACCOUNT";

/** Returns an error message for a bad request body, or null when the request may proceed. */
export function validateDeleteRequest(body: unknown): string | null {
  if (!body || typeof body !== "object") return "bad_request";
  if ((body as { confirm?: unknown }).confirm !== DELETE_CONFIRMATION) return "confirmation_required";
  return null;
}

/** Minimal slice of the Storage bucket API used to walk a user's folder (lets tests use a fake). */
export type StorageLister = (
  prefix: string,
  opts: { limit: number; offset: number },
) => Promise<{ data: { name: string; id: string | null }[] | null; error: unknown }>;

const PAGE = 1000;
const MAX_ENTRIES = 100_000; // safety stop: never loop forever on a misbehaving Storage backend

/**
 * Collects every object path under "<prefix>/" recursively (folders have id === null), with paging.
 * Throws on a listing error or when the safety limit is hit, so deletion fails loudly instead of partially.
 */
export async function collectObjectPaths(list: StorageLister, prefix: string): Promise<string[]> {
  const files: string[] = [];
  const folders = [prefix];
  let seen = 0;
  while (folders.length) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await list(folder, { limit: PAGE, offset });
      if (error) throw error;
      const entries = data ?? [];
      seen += entries.length;
      if (seen > MAX_ENTRIES) throw new Error("storage_walk_limit");
      for (const e of entries) {
        if (!e.name) continue;
        if (e.id === null) folders.push(`${folder}/${e.name}`);
        else files.push(`${folder}/${e.name}`);
      }
      if (entries.length < PAGE) break;
    }
  }
  return files;
}

/** Splits paths into chunks for Storage remove() calls. */
export function chunk<T>(items: T[], size = PAGE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

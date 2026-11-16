import { describe, expect, it } from "vitest";
import {
  chunk,
  collectObjectPaths,
  DELETE_CONFIRMATION,
  type StorageLister,
  validateDeleteRequest,
} from "./account.ts";

describe("validateDeleteRequest", () => {
  it("accepts the exact confirmation phrase", () => {
    expect(validateDeleteRequest({ confirm: DELETE_CONFIRMATION })).toBeNull();
  });
  it("rejects a missing or wrong body", () => {
    expect(validateDeleteRequest(null)).toBe("bad_request");
    expect(validateDeleteRequest("DELETE_MY_ACCOUNT")).toBe("bad_request");
    expect(validateDeleteRequest({})).toBe("confirmation_required");
    expect(validateDeleteRequest({ confirm: "delete_my_account" })).toBe("confirmation_required");
  });
});

/** Fake Storage: a map of folder → entries (folders have id null). */
const fake =
  (tree: Record<string, { name: string; id: string | null }[]>): StorageLister =>
  async (prefix, { limit, offset }) => ({ data: (tree[prefix] ?? []).slice(offset, offset + limit), error: null });

describe("collectObjectPaths", () => {
  it("walks nested folders", async () => {
    const paths = await collectObjectPaths(
      fake({
        u1: [
          { name: "photos", id: null },
          { name: "avatar.jpg", id: "a" },
        ],
        "u1/photos": [{ name: "x.jpg", id: "b" }],
      }),
      "u1",
    );
    expect(paths.sort()).toEqual(["u1/avatar.jpg", "u1/photos/x.jpg"]);
  });

  it("pages through large folders", async () => {
    const many = Array.from({ length: 2500 }, (_, i) => ({ name: `f${i}`, id: String(i) }));
    const paths = await collectObjectPaths(fake({ u1: many }), "u1");
    expect(paths).toHaveLength(2500);
  });

  it("returns nothing for an empty folder", async () => {
    expect(await collectObjectPaths(fake({}), "u1")).toEqual([]);
  });

  it("throws on a listing error", async () => {
    const failing: StorageLister = async () => ({ data: null, error: new Error("boom") });
    await expect(collectObjectPaths(failing, "u1")).rejects.toThrow("boom");
  });

  it("stops on a backend that never ends", async () => {
    const endless: StorageLister = async () => ({
      data: Array.from({ length: 1000 }, (_, i) => ({ name: `f${i}`, id: String(i) })),
      error: null,
    });
    await expect(collectObjectPaths(endless, "u1")).rejects.toThrow("storage_walk_limit");
  });
});

describe("chunk", () => {
  it("splits into fixed-size parts", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

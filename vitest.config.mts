import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./apps/mobile/src", import.meta.url)) } },
  test: {
    include: ["apps/**/*.test.ts", "apps/web/**/*.test.js", "packages/**/*.test.ts", "supabase/functions/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
  },
});

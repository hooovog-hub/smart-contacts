// ESLint flat config for the whole repo: mobile (TS/React Native), web (Node JS), Edge Functions (Deno TS).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/dist/**",
      "**/.vercel/**",
      "prototype/**",
      "marketing/**",
      "packages/shared/src/db.types.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Existing code still has `any` at API boundaries; new code should avoid it (docs/04-engineering/conventions.md).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/mobile/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["apps/web/**/*.js", "scripts/**/*.{js,mjs}", "*.{js,mjs}", "tests/**/*.{js,mjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["tests/load/**/*.js"],
    languageOptions: { globals: { __ENV: "readonly", __VU: "readonly", __ITER: "readonly" } },
  },
  {
    files: ["supabase/functions/**/*.ts"],
    languageOptions: { globals: { Deno: "readonly", ...globals.browser } },
  },
  prettier,
);

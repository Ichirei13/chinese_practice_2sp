import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next.js 16 introduced strict new hooks rules. We relax them here since
      // the patterns used (Math.random in useMemo, fn refs in effects, setState
      // in init effects) are correct and intentional in this codebase.
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off / legacy helper scripts that are not part of the app bundle and
    // intentionally use CommonJS (run directly with node, not built).
    "legacy/**",
    "src/data/add_sentences.js",
  ]),
]);

export default eslintConfig;

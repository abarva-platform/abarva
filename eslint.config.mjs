import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/scripts/**", "scripts/**"],
    rules: {
      // Node scripts share the repo but are not React surfaces. Several
      // helpers happen to use a `use*` prefix, which triggers false
      // positives from the React hooks plugin when we lint scripts as app code.
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Historical spec snapshots and orphaned code are reference material,
    // not runtime source. Keep them out of product lint baselines.
    "docs/specs/_archive/**",
  ]),
]);

export default eslintConfig;

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
  {
    files: [
      "src/components/OutputRenderer.tsx",
      "src/data/knowledge/scoring.ts",
      "src/lib/demo-data/**/*.ts",
      "src/lib/knowledge/client-datasets.ts",
      "src/lib/retrieval.ts",
      "src/lib/supabase.ts",
      "src/lib/dataset-extractor.ts",
      "src/app/api/admin/seed-clerk-metadata/route.ts",
      "src/app/api/org-search/route.ts",
      "src/app/(maestro)/platform/admin/data/page.tsx",
    ],
    rules: {
      // Legacy data / renderer seams still rely on dynamic payloads. Keep
      // lint pressure on product surfaces without blocking CI on a large
      // typing refactor in this cleanup pass.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "src/app/(maestro)/platform/admin/brief/page.tsx",
      "src/app/(maestro)/platform/admin/context/page.tsx",
      "src/app/(maestro)/platform/admin/data-governance/page.tsx",
      "src/app/(maestro)/platform/data/page.tsx",
      "src/components/OutputRenderer.tsx",
      "src/components/engagement/EngagementConsole.tsx",
      "src/components/intelligence/AskIntelligenceConsole.tsx",
      "src/components/tower/DemoDataBanner.tsx",
    ],
    rules: {
      // Quoted editorial/source language is intentional in these content-heavy
      // surfaces; escaping it would reduce readability more than it helps.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["src/components/engagement/TraceDrawer.tsx"],
    rules: {
      // This effect deliberately mirrors an async fetch lifecycle into UI state.
      "react-hooks/set-state-in-effect": "off",
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

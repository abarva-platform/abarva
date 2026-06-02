import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next.js 16.2.7 now surfaces stricter React compiler lint checks through
      // eslint-config-next. Keep this dependency refresh behavior-preserving;
      // adopt these rules later as a deliberate cleanup wave.
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/scripts/**",
      "scripts/**",
    ],
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
      "src/scripts/seed/seed-*-dom*.ts",
      "scripts/corpus/**/*.{ts,mts,cts,js,mjs,cjs}",
    ],
    rules: {
      // ADR-0001 D.5: authored genome seed data files must be data-only — no
      // direct Supabase infrastructure imports. Legacy migration/audit scripts
      // remain under the tracked Azure/Postgres cleanup backlog; runtime app
      // code is guarded separately below.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='@supabase/supabase-js']",
          message:
            "ADR-0001 D.5: scripts must not import @supabase/supabase-js directly. " +
            "Use createSeedClient() from seed-wave-lib (returns PostgresCompatClient). " +
            "Genome seed files should be data-only *PATTERNS arrays with no imports at all.",
        },
      ],
    },
  },
  // Packet 30 Phase 2D / ADR-0001 D.5:
  // Runtime app code must not import Supabase packages or compatibility
  // helpers. Migration/seed/audit utilities live under scripts/ and are
  // intentionally outside this runtime rule.
  {
    files: ["src/app/**/*.{ts,tsx,js,jsx}", "src/lib/**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "src/lib/supabase-server.ts",
      "src/lib/supabase.ts",
      "src/lib/**/*.test.{ts,tsx,js,jsx}",
      "src/lib/**/__tests__/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/^@supabase\\//]",
          message:
            "I2/Phase 2D: Runtime code in src/app and src/lib must not import @supabase/*; use the Azure/Postgres data-plane adapters instead. Supabase is allowed only in scripts/ migration and tooling utilities.",
        },
        {
          selector: "ImportDeclaration[source.value=/^@\\/lib\\/supabase(-server)?$/]",
          message:
            "I2/Phase 2D: New runtime code must not import the Supabase compatibility helper; use direct Azure/Postgres read/write adapters instead.",
        },
      ],
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
  // CLEAN1-4: block re-introduction of retired directory names.
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["*/components/agents", "*/components/agents/*"],
            message: "Use @/components/agent/ (canonical path — see CLEAN1)",
          },
          {
            group: ["*/components/brand", "*/components/brand/*"],
            message: "Use @/components/abarva/ (canonical path — see CLEAN1)",
          },
          {
            group: ["*/components/identity", "*/components/identity/*"],
            message: "Use @/components/abarva/ (canonical path — see CLEAN1)",
          },
          {
            group: ["*/lib/agents", "*/lib/agents/*"],
            message: "Use @/lib/agent/ (canonical path — see CLEAN1)",
          },
        ],
      }],
    },
  },
  // TD-1: app-tier code MUST go through AgentContextBroker. Direct imports
  // of the tenant-data adapter from outside src/lib/knowledge/ are not
  // allowed. See feedback_broker_boundary and TENANT_DATA_INTEGRATION_DESIGN §6.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/knowledge/**", "src/lib/integrations/ai-egress/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@/lib/knowledge/tenant-data",
              "@/lib/knowledge/tenant-data/*",
              "*/lib/knowledge/tenant-data",
              "*/lib/knowledge/tenant-data/*",
              "@anthropic-ai/sdk",
              "@anthropic-ai/sdk/*",
            ],
            message:
              "App-tier code must go through AgentContextBroker for tenant data and src/lib/integrations/ai-egress for provider SDKs.",
          },
        ],
      }],
    },
  },
  // TD-1: the stub adapter intentionally ignores most parameters. Allow
  // underscore-prefixed names to mark them as unused without a warning.
  {
    files: ["src/lib/knowledge/tenant-data/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // I9: Ask surfaces must not bypass the tenant-scoped pattern retriever.
  // Direct corpus retrieval is allowed only in the scoped retriever and corpus
  // API boundary, where tenant industry overlays are intersected before search.
  {
    files: ["src/lib/intelligence/ask/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/intelligence/ask/retrievers/pattern.ts",
      "src/lib/intelligence/ask/**/*.test.ts",
      "src/lib/intelligence/ask/**/__tests__/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='@/lib/corpus/retrieval']",
          message:
            "I9: Ask surfaces must use retrievePattern(), which applies tenant industry + cross_industry scoping before returning corpus patterns.",
        },
        {
          selector: "ImportDeclaration[source.value='@/lib/intelligence/canonical/runtime-pattern-index']",
          message:
            "I9: canonical_industry_ai_patterns is deprecated for Ask fallback; use the tenant-scoped corpus_patterns retriever.",
        },
      ],
    },
  },
  // I9: tenant-facing pattern grounding must use the scoped corpus-pattern
  // index. The legacy runtime index reads deprecated canonical storage and
  // can be used only by its own implementation/tests/migration utilities.
  {
    files: [
      "src/app/api/v1/programs/**/nexus/ask/route.ts",
      "src/lib/sentinel/orchestrator.ts",
      "src/lib/atlas/value-grounding.ts",
      "src/lib/knowledge/context-broker/broker.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          {
            name: "@/lib/intelligence/canonical/runtime-pattern-index",
            importNames: ["searchCanonicalPatternIndex"],
            message:
              "I9: tenant-facing pattern grounding must use searchIndustryScopedCorpusPatternIndex(), which reads corpus_patterns with tenant industry + cross_industry scoping.",
          },
        ],
      }],
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

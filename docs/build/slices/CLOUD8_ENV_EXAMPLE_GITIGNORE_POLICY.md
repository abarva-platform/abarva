# CLOUD8 — Env Example Gitignore Policy

> Status: code_complete (documentation + .gitignore policy + Jest
> contract). No application code, no runtime, no migrations, no auth
> changes, no model calls, no live cloud calls. production_deployment
> status is preserved (still blocked).

## A. Purpose

Allow safe `.env*.example` placeholder templates to be committed
without `git add -f` while keeping every real env file ignored.

CLOUD4 introduced `.env.private-lab.example` and discovered that the
existing `.env*` ignore rule blocked committing the example. The
operator had to bypass it with `git add -f`. CLOUD8 makes this no
longer necessary, while keeping real env files (`.env`, `.env.local`,
`.env.production`, etc.) ignored.

## B. What changed

### B.1 `.gitignore` — minimally updated

Two new allow rules are added immediately under the existing `.env*`
line. No existing ignore rule is removed or weakened.

```
# env files (can opt-in for committing if needed)
.env*
# Env examples are safe to commit — placeholders only, no real secrets.
!.env.example
!.env.*.example
```

The `.env*.local` rule (which lives further down the file) is left
in place verbatim — it ensures local-only env files are never
committed.

### B.2 `docs/deployment/ENV_EXAMPLE_POLICY.md` — new

Founder-facing policy doc covering:

- Purpose.
- What is allowed (`.env.example`, `.env.<role>.example`).
- What is NEVER allowed (`.env`, `.env.local`,
  `.env.production`, `.env.development`, real values).
- Required content of `.env.*.example` files (header comment,
  placeholder values, no real tokens / keys / secrets).
- How to add a future env example.
- Verification (CLOUD8 Jest contract).
- Cross-references to CLOUD1 / CLOUD2 / CLOUD3 / CLOUD4 / CLOUD5.

### B.3 `src/__tests__/integration/deployment/env-example-policy.test.ts` — new

Deterministic, file-pure Jest suite that asserts:

- `.gitignore` still ignores real env files (the blanket `.env*` rule
  plus the `.env*.local` rule remain).
- The two CLOUD8 allow rules are present (`!.env.example` and
  `!.env.*.example`).
- Every `.env.*.example` file currently in the repo root contains the
  literal substring `EXAMPLE` or `example` (header marker).
- No committed `.env.*.example` file contains any of four
  likely-secret regex patterns:
  - `/ghp_[A-Za-z0-9]{36,}/`
  - `/sk-(ant-)?[A-Za-z0-9_-]{32,}/`
  - `/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/`
  - `/AKIA[0-9A-Z]{16}/`

The test reads the repo with `fs.readFileSync` and `fs.readdirSync`;
no network, no shell, no provider calls.

### B.4 Manifest updates

- `docs/build/build-slices.json` — appends a CLOUD8 entry with status
  `code_complete`, risk `low`, dependsOn `CLOUD4`, lastUpdated
  `2026-04-26`.
- `docs/build/production-readiness.json` — UNION-updates the
  `production_deployment` notes and `nextAction` to acknowledge
  CLOUD8; status is preserved (still `blocked`); top-level
  `lastUpdated` is bumped to `2026-04-26`.

## C. Out of scope

- No new env files are added in this slice.
- No real env files are committed.
- No application code, runtime, auth, supabase, or migrations are
  modified.
- No infrastructure-as-code, no `.github/workflows`, no `next.config.ts`.
- No deploy, no Vercel poll, no GitHub poll, no model call.
- Pre-commit hook to scan staged env-example files for likely secrets
  is deferred (CLOUD9+).
- Forbidding `git add -f` repo-wide is out of scope; the policy and
  Jest contract are the deterrent.

## D. Why this is safe

- The `.gitignore` change is **additive**. The blanket `.env*` rule
  is preserved, so real env files (`.env`, `.env.local`,
  `.env.production`, `.env.development`, etc.) remain ignored. The
  two new `!` rules whitelist a narrow shape (`.env.example`,
  `.env.*.example`) that, by file naming convention, contains
  placeholders only.
- The Jest contract asserts every committed `.env.*.example` has the
  expected header marker and contains no likely-secret-shaped values.
- No application behavior changes. No runtime path is altered.

## E. How to re-run

```
# Type-check
npx tsc --noEmit --pretty false

# CLOUD8 contract test
npx jest src/__tests__/integration/deployment/env-example-policy.test.ts

# Build (symlink panic in this worktree may be skipped per the
# integration agent runbook; the build is canonical from the main
# worktree.)
npm run build

# Manifest JSON parse check
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"
```

## F. Readiness impact

production_deployment is preserved at `blocked`. CLOUD8 does not
deploy, does not poll Vercel, does not call any provider, and does
not promote any component. The `prod-deploy-verification` blocker is
preserved verbatim.

## G. Cross-references

- CLOUD1 — Enterprise / Private Deployment Strategy.
- CLOUD2 — Azure VNet reference lab blueprint.
- CLOUD3 — Docker runtime packaging.
- CLOUD4 — Local private deployment lab (first env example governed
  by this policy).
- CLOUD5 — Azure Container Apps + VNet IaC starter.
- `docs/deployment/ENV_EXAMPLE_POLICY.md` — the policy itself.
- `src/__tests__/integration/deployment/env-example-policy.test.ts` —
  the Jest contract.

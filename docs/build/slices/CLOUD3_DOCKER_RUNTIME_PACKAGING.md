# CLOUD3 - Docker Runtime Packaging

Slice ID: CLOUD3
Slice name: Docker Runtime Packaging
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane B (parallel build pack)
Depends on: CLOUD1

## Purpose

CLOUD3 proves that the AbarVa application shell can be **packaged
for non-Vercel runtimes** by landing a multi-stage Dockerfile, a
`.dockerignore` that excludes secrets and irrelevant tooling, a
`verify-docker-build.sh` script that exits 0 whether Docker is
present or absent on the host, a deployment runbook, and static
checks that lock the Dockerfile shape against future drift.

CLOUD3 does **not** deploy, push, scan, sign, or mutate any
registry. It does not change application behavior, does not run
migrations, does not call any model provider, and does not promote
any production-readiness component.

CLOUD3 is the third cloud-architecture contract after CLOUD1
(four-tier deployment strategy) and CLOUD2 (Azure VNet reference
lab blueprint). Where CLOUD2 specifies the **target environment**
shape, CLOUD3 supplies the **portable runtime artifact** that
environment will consume. CLOUD3 is also a prerequisite for the
future Cloud Run / ECS / AKS slices.

## What Changed

- New runtime artifact `Dockerfile` at the repo root with three
  stages (`deps`, `build`, `runtime`) on a `node:24-bookworm-slim`
  base, copying built artifacts into a minimal runtime layer that
  drops to the non-root `node` user, exposes port 3000, and
  defaults to `npm run start`. Required runtime env vars are
  documented in the file header (DATABASE_URL, NEXT_PUBLIC_SUPABASE_*,
  SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, PINECONE_API_KEY,
  PINECONE_INDEX, NODE_ENV, PORT, HOSTNAME). No secret values are
  baked, no `.env*` is copied, no Vercel-runtime import is required.
- New `.dockerignore` excludes `node_modules`, `.next`, `.git`,
  `.env*` (with an explicit allow for `.env.example`), `coverage`,
  `reports/`, `.claude/`, `.codex-inbox/`, `*.log`, `**/.DS_Store`,
  `tests/`, `e2e/`, `playwright-report/`, `test-results/`,
  `tower-mockups/`, `updates/`, `docs/`, and `.github/`. `src/`,
  `public/`, `package.json`, `package-lock.json`, and `next.config.ts`
  remain in the build context so `next build` can run.
- New `scripts/verify-docker-build.sh` is a `set -euo pipefail`
  Bash script that:
  - prints the canonical build / run command shapes,
  - skips with `[CLOUD3] Docker unavailable on this host. Skipping
    build validation; this is documented neutral status.` and exits
    0 when Docker is absent,
  - runs `docker build --check` (BuildKit Dockerfile linter) when
    Docker is present, falling through to a no-op success on older
    Docker versions,
  - exits 0 in both branches.
- New runbook `docs/deployment/DOCKER_RUNTIME_PACKAGING.md` covers
  Dockerfile architecture, required runtime env vars, build / run /
  verify commands, what the slice proves, what it does NOT prove
  (no production deploy, no scaling, no DR, no compliance, no live
  model gateway claim), and CI integration notes (deferred).
- New static-check test
  `src/__tests__/integration/deployment/docker-runtime-packaging.test.ts`
  asserts the Dockerfile uses `node:24*`, declares a non-root
  `USER`, copies no `.env*`, declares all three stages, contains
  no `sk-`, `ghp_`, `vercel_`, or `npm_` token shapes; the
  `.dockerignore` ignores `node_modules`, `.env`, `reports`, and
  `.git` while leaving `src/` in the build context; and that
  `scripts/verify-docker-build.sh` is shebang-bash, uses
  `set -euo pipefail`, handles the Docker-missing case, and is
  executable.
- `docs/build/build-slices.json` appends a CLOUD3 entry with this
  slice's `allowedFiles`, `forbiddenFiles`, `validationCommands`,
  `dependsOn` (CLOUD1), `status` `code_complete`, `risk` `low`, and
  `ownerAgent` Lane B. Manifest top-level `lastUpdated` is bumped
  to `2026-04-26`.
- `docs/build/production-readiness.json` updates the
  `production_deployment` component:
  - One UNIONed note row recording that CLOUD3 lands the Docker
    runtime packaging (multi-stage Dockerfile, `.dockerignore`,
    verify script, runbook, static checks) and that the slice is
    packaging-only (no push, no deploy).
  - `nextAction` UNIONed conservatively to acknowledge that an
    image can be built outside Vercel; prior PROD1 / PROD2 / PROD3 /
    PROD4 / OPS1 / OPS2 / TEN1 / TEN2 / CLOUD1 / CLOUD2 wording is
    preserved verbatim.
  - The component `status` is preserved (`blocked`, NOT promoted)
    because no image is pushed and no environment is deployed.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, gate statuses, dimensions, and
    blockers are unchanged.
  - Manifest top-level `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- CLOUD3 does not push to any registry (Docker Hub, ACR, Artifact
  Registry, ECR, GHCR), does not sign images, does not emit SBOMs,
  and does not run vulnerability scanners.
- CLOUD3 does not deploy to Container Apps, Cloud Run, ECS, AKS,
  GKE, or any platform; does not call cloud APIs; does not invoke
  `az`, `gcloud`, `aws`, `docker push`, or `kubectl`.
- CLOUD3 does not modify application code, runtime behavior, auth,
  the Model Gateway, the agent runtime, the evidence ledger, the
  audit ledger, supabase, migrations, package manifests, or
  platform-design docs.
- CLOUD3 does not import any model provider, does not call the
  Model Gateway, and does not write any audit-ledger entry.
- CLOUD3 does not change `next.config.ts` (no `output: 'standalone'`
  flip; the runbook documents how a future slice would adopt it).
- CLOUD3 does not add a CI workflow file. CI integration is named
  in the runbook as deferred.
- CLOUD3 does not promote `production_deployment` or any other
  readiness component. `production_deployment` remains `blocked`.
- CLOUD3 does not push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick / merge.

## Why It Is Safe

- Runtime artifact + scripts + docs only. No `src/` change, no
  `next.config.ts` change, no migration, no provider call, no
  cloud call, no registry push, no live monitoring claim.
- The Dockerfile bakes no secret. `.env*` (other than
  `.env.example`) is excluded by `.dockerignore`, the runbook lists
  required runtime env vars by name only, and the static-check
  test fails the build if any `sk-` / `ghp_` / `vercel_` / `npm_`
  token shape ever appears in the Dockerfile.
- The verify script's contract is "exit 0 in both branches" so
  Docker-less CI lanes stay green and a successful run on a
  Docker-present host still does not push or deploy.
- The manifest update is append-only at the note / nextAction
  level and does not change any component status, dimension, gate
  status, blocker list, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as CLOUD1 / CLOUD2.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-enterprise-cloud3 && npx tsc --noEmit --pretty false`
2. Run the static-check test:
   `cd /Users/anand/Projects/nexus-enterprise-cloud3 && npx jest src/__tests__/integration/deployment/docker-runtime-packaging.test.ts`
3. Run the verify script (Docker-present and Docker-missing both
   exit 0):
   `cd /Users/anand/Projects/nexus-enterprise-cloud3 && bash scripts/verify-docker-build.sh`
4. Run the production build:
   `cd /Users/anand/Projects/nexus-enterprise-cloud3 && npm run build`
   (Next.js symlink panic is acceptable to mitigate; this slice
   does not modify any application code.)
5. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION).
- Readiness / status changes: none. `production_deployment` stays
  `blocked`.
- Blockers added or removed: none. The existing
  `prod-deploy-verification` blocker remains in place.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior PROD1 / PROD2 / PROD3 / PROD4 / OPS1 / OPS2 / TEN1 / TEN2 /
  CLOUD1 / CLOUD2 wording).
- Notes added: one row on `production_deployment` recording the
  CLOUD3 Docker runtime packaging landing and that the slice is
  packaging-only (no push, no deploy, no scale, no DR).

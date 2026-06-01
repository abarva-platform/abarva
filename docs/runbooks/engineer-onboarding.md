# Engineer Onboarding Runbook

## Purpose

This runbook gives a new AbarVa/Nexus engineer the minimum safe path from a clean checkout to a release-ready PR. `AGENTS.md` remains the source of truth for coding conventions and release discipline.

## First-Day Setup

1. Clone the repository and confirm the remote points at the canonical GitHub repository.
2. Install Node.js 24.x to match the Dockerfile and `AGENTS.md`.
3. Run `npm install` to install dependencies and Husky hooks.
4. Confirm local hooks are active with `npm run secrets:staged`.
5. Read `AGENTS.md`, `GOVERNANCE.md`, and the current PR template before opening any PR.

## Environment Expectations

Local routes beyond `/` and `/sign-in` require Clerk credentials. Data-backed pages require `DATABASE_URL` and any required Azure/Postgres adapter configuration. Placeholder Clerk publishable keys must still be validly formatted `pk_test_*` or `pk_live_*` keys because Clerk validates the key shape at middleware startup.

Optional services such as Anthropic, OpenAI, Stripe, Resend, and PostHog must degrade gracefully when credentials are absent. Do not add a new hard dependency on an optional service without documenting the rollout and rollback path in the release record.

## Branch and PR Flow

1. Start from a clean branch off `origin/main`.
2. Keep each PR to one release lane and one obvious change family.
3. Add or update a release record in `docs/releases/records/` for any release-relevant change.
4. Use Conventional Commits with one of the allowed types from `commitlint.config.js`.
5. Push the branch and open a PR with the required release classification, validation, rollout, and rollback sections.

## Local Validation Baseline

Use the smallest validation set that covers the change:

| Change type                     | Minimum local validation                                                      |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Docs-only governance            | `git diff --check`; `npm run release:check -- --base origin/main --head HEAD` |
| Frontend or routing             | Focused Jest or Playwright test, then `npm run lint` or targeted ESLint       |
| Shared TypeScript logic         | Focused Jest suite plus `npx tsc --noEmit --pretty false` when risk is broad  |
| Data-plane adapter or migration | Focused integration tests; migration replay or drift check when available     |
| Release-control files           | `npm run release:check -- --base origin/main --head HEAD`                     |
| Secret or dependency controls   | The added npm script or workflow-equivalent command                           |

Run broader checks when the change touches shared app shell, auth, ingestion, release controls, or cross-client behavior.

## Safety Rules

- Do not commit secrets, client files, raw PHI, raw PII, or private customer artifacts.
- Do not introduce direct runtime dependencies on legacy Supabase, Neo4j, or Pinecone paths; use current Azure/Postgres data-plane adapters and approved compatibility shims only where they already exist.
- Do not bypass release records for release-relevant changes.
- Do not claim a route or workflow is fixed until the relevant test, preview, or browser path has been verified.
- Do not hand-edit generated AI-rule files; run `npm run sync-ai-rules`.

## Handoff Checklist

Before requesting review:

- Branch is current enough with `origin/main` for a clean PR diff.
- Release lane, layer impact, client applicability, QA, rollout, and rollback are documented.
- Local validation commands and results are listed in the PR.
- Known gaps are explicit rather than hidden.
- Any follow-up tracker status is truthful: use `Done` only when the backlog item is actually closed.

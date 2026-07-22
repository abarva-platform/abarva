# 2026-07-22-home-enterprise-brief-typed-read-model — Home Enterprise Brief Typed Read Model

## Release ID

`2026-07-22-home-enterprise-brief-typed-read-model`

## Status

`candidate`

## Plain-English Summary

Home already reads the approved Home Knowledge Pack from Postgres through `home_knowledge_packs.render_pack`, with a JSON file fallback. This release keeps that path and enriches it with the approved typed Home Enterprise Brief tables so the CXO cockpit can render the executive read, AI readiness, strategic narratives, richer use-case portfolio, evidence requests, and dimension rows from the governed pack instead of leaving those populated tables unused.

## Layer Impact

- `global-control-lane`: Updates the shared Home page read model and rendering surface for the Knowledge/Home cockpit.
- `client-data-lane`: Reads approved tenant-scoped Home Knowledge Pack child tables already populated by the governed data-build job. No schema migration or data mutation is included in this PR.

## Client Applicability

- All clients: Any tenant with an approved `public.home_knowledge_packs` record and related Home Knowledge child rows receives the richer Home Enterprise Brief experience.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends `src/lib/home/home-knowledge-design-contract.ts` so the existing Postgres-first loader overlays typed child tables onto `render_pack`:
  - `home_knowledge_dimension_rows`
  - `home_knowledge_use_cases`
  - `home_knowledge_evidence_sources`
  - `home_knowledge_executive_read`
  - `home_knowledge_pack_tier`
  - `home_knowledge_ai_readiness`
  - `home_knowledge_dimension_module_implications`
  - `home_knowledge_next_evidence_requests`
  - `home_knowledge_strategic_narratives`
- Updates `src/components/home/HomeKnowledgeDesignContractSurface.tsx` with the first Home Enterprise Brief cockpit sections:
  - Executive read
  - Industry force × tenant reality
  - AI readiness bar chart
  - Use-case value/readiness portfolio scatter
  - Strategic narrative chapters
- Increases the Home Knowledge Pack v2 server read timeout in `src/app/(maestro)/home/page.tsx` from 1.2s to 2.5s so the richer Postgres read does not prematurely fall back to stale file content.

## QA / Validation

- `npx eslint src/lib/home/home-knowledge-design-contract.ts src/components/home/HomeKnowledgeDesignContractSurface.tsx 'src/app/(maestro)/home/page.tsx'` — passed.
- `git diff --check` — passed.
- `npm run test:nav` — passed, 26 tests. Existing duplicate Jest manual mock warnings were emitted and are unrelated to this change.
- `npx tsc --noEmit --pretty false` — passed.
- `npm run build` — passed. Existing Turbopack broad-file-pattern warnings were emitted from pre-existing filesystem readers.

## Rollout Plan

Merge to `main` through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. No manual data job is required for this PR because it only reads already approved Home Knowledge Pack tables.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home/Knowledge page for at least one approved tenant and spot checks across the active tenant set where auth/session state permits.

## Rollback Plan

Revert the PR and redeploy through ACA main. The underlying `render_pack` and child tables remain intact; the file JSON fallback and base `render_pack` behavior are preserved by this change.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI run: To be added after PR checks.
- ACA deploy evidence: revision, digest, traffic, and health captured after merge/deploy.
- Browser proof: signed-in Home/Knowledge screenshot and DOM checks showing the executive read, AI readiness, strategic narratives, and use-case scatter rendering from the Postgres pack.

## Known Gaps

Relationship graph visual quality is a separate active stream and is not changed by this PR. This release does not regenerate Home Knowledge content; it renders approved content already populated in the Home Knowledge Pack tables.

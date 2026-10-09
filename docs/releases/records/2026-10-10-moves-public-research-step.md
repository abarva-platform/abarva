# 2026-10-10 — Moves public-source research: storage contract and research step

## Release ID

`2026-10-10-moves-public-research-step`

## Status

`candidate`

## Plain-English Summary

This release ships the first two of four changes that let a Moves deliverable
build look up PUBLIC outside sources (program rules, payment rules, published
studies) through the audited Anthropic path, and cite them only after a
consultant approves them. The two changes ship together as one pull request.
The storage contract is also described in
`2026-10-10-moves-public-research-core.md`; this record covers both.

Storage contract:

- Two new tables. `move_public_research_runs` records every research attempt,
  including one that found nothing, timed out or was denied.
  `move_public_sources` stores each source for one tenant and one Move, with an
  https URL, a retrieval date, and a verbatim excerpt of 1 to 300 characters.
  Every source starts as pending.
- A server-only repository reads and writes these tables. Every read, dedupe
  check and decision is fenced to every alias of one tenant and the exact
  Move. Failures come back as failures, never as an empty list.
- Governance: a `public_source` source layer (policy version 1.1.0), never
  allowed in shared corpus and never `agent_ready`, and a dataset manifest.

Research step (new in this release):

- Before a flagged Moves build assembles its evidence, the build makes one
  audited Anthropic call with the web search and web fetch server tools.
- The only thing about the Move that is sent is a short brief built from an
  allowlist: the tenant's declared industry, the archetype, a use-case label,
  value-lever names and open register questions. A value that carries a
  figure, any tenant name or cover name known to the registry, the client's
  display name, or free text is dropped whole, not trimmed.
- Sources are taken only from the API's own citation and search-result
  blocks. The excerpt is the API's cited text, cut to 300 characters, and the
  URL must be https. The model's JSON can only annotate a cited URL
  (publisher, published date, claim, confidence); it cannot add a source.
- Budgets: at most 6 searches and 3 fetches, 6,000 tokens per fetched page,
  4,096 output tokens, 12 stored sources, a 90-second timeout, and a bounded
  resume of a paused turn.
- One search per Move and brief: a successful run for the same Move and brief
  within 14 days is reused instead of searching again.
- A timeout, an egress denial, an unreadable answer or a storage failure is
  recorded with its status, and the build continues with no outside sources.
  The step never fails a build.
- Results are only stored as pending. Nothing is cited and nothing reaches the
  drafting prompt. The build result carries a note drafting can show, such as
  "2 outside sources found, awaiting review".

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged.
- Canonical model: two new tenant-scoped, Move-scoped tables (one additive,
  re-runnable migration). No existing table, column or policy changes.
- Governance contract: `public_source` layer and two block rules; manifest
  validator refuses a `public_source` manifest scoped to shared corpus. Policy
  version 1.0.0 to 1.1.0.
- Products: Moves deliverable builds for enrolled tenants gain a research step
  before evidence assembly. Its output is stored, not cited. The build result
  gains an optional `publicResearch` outcome and a `public_research:` note in
  its warnings.
- AI egress: one new audited Anthropic call per research run, through
  `preflightAnthropicDirectClient`, workflow `deliverable:research:<type>`,
  workload `moves_public_research` (offline-generation key lane), data class
  `internal`. No new provider and no direct SDK import outside the egress
  layer.

## Client Applicability

- All clients: no visible change unless enrolled in the flag.
- Specific clients: the synthetic demo tenant is enrolled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_public_source_research` (tenant policy). When the flag
  is off, nothing runs: no egress, no write.

## Changes Included

- `supabase/migrations/20261010130000_move_public_research.sql` (new): the two
  tables, CHECK constraints, unique dedupe key, indexes and RLS.
- `src/lib/deliverables/public-research/types.ts` (new): contract types,
  limits and validators that mirror every CHECK.
- `src/lib/deliverables/public-research/repository.ts` (new, server-only):
  insert a run, insert sources with dedupe, list approved sources, decide a
  pending source, and (this release) find a reusable recent run for a brief.
- `src/lib/deliverables/public-research/research-brief.ts` (new): the
  allowlisted brief, its screens and its hash.
- `src/lib/deliverables/public-research/research-runner.ts` (new,
  server-only): the audited call, the pause-turn loop, citation parsing,
  budgets, cache, and status recording.
- `src/lib/deliverables/orchestrator/generate-service.ts`: the flagged hook
  before evidence assembly, and the outcome on the build result.
- `src/lib/governance/context-corpus-policy.ts`, `dataset-manifest.ts`, and
  the governance docs, exceptions file, tracker and dataset manifest
  `moves-public-source-research-v1.json`.
- `src/lib/features/registry.ts`: the flag and its summary. The generated
  manual is updated.
- `src/lib/observability/ai-workload-taxonomy.ts`: the workload.
- Tests: four new suites under `src/lib/deliverables/__tests__/` (contract,
  repository, brief, runner and hook) and new cases in the policy, manifest
  and key-lane suites.

## QA / Validation

- New suites pass: contract (17), repository including the cache read (30),
  brief (16), runner and build hook (37).
- Combined run of the deliverables, governance, AI egress, features,
  observability, queue worker and generate route suites: pass.
- Mutation checks, applied one at a time and restored from an in-memory copy:
  storage contract 49 mutations, 48 killed (the survivor is behaviour-neutral:
  the decision column defaults to pending); research step 84 mutations, 84
  killed. They cover each brief screen and limit, the hash, each budget and
  tool setting, the pause-turn loop and its bounds, citation and https
  parsing, the excerpt cut, the per-run cap, each failure status, the cache
  and its window, the egress identity, workflow, workload and data class, the
  cache read's fences and filters, and the hook's flag, module, order, note
  and failure handling.
- `npm run typecheck`: pass. ESLint on changed files: no errors.
- `validate:context-corpus` and its five sub-checks: pass.
- Census regenerated: every new test file is swept (2,766 to 2,770).
- `audit:lib-orphans`: no change against the baseline. The runner, brief,
  repository and types are reached from the generate service.
- `audit:ai-surface-controls`, `audit:ai-surface-control-cases`,
  architecture rules and `docs:nexus-manual:check`: pass.
- No live call was made. The tests use a mocked egress preflight that returns
  fixture content blocks shaped like the API's. The migration was not applied
  to any database.

## Rollout Plan

Merge through the protected main branch. Apply the migration through the
client-data lane's governed migration path before the flag can store anything
(until then each research attempt reports that its run was not recorded and
the build continues). The repo-owned ACA main deploy workflow builds and
deploys the digest-pinned image. The research step runs in the deliverable
worker for enrolled tenants only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the deliverable worker image matches the
  approved digest, because the research step runs there.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: after the migration is applied, run one
  flagged Moves build for the synthetic demo tenant and read back one run row
  with its status and audit id, any pending sources with https URLs and
  excerpts of at most 300 characters, and the coverage note on the build
  result. Confirm the egress audit row carries workload
  `moves_public_research`.

## Rollback Plan

Remove the tenant from `includeTenants` and deploy through the main workflow,
or revert through a pull request. With the flag off nothing runs. The tables are
additive; stored pending sources are never cited by this release and can stay
or be removed by a later reviewed migration. Policy version 1.0.0 objects
remain valid under 1.1.0.

## Audit Evidence

- Pull request and CI results.
- The suites, mutation results and validator output above.
- The committed dataset manifest.
- Per run in production: the `ai_egress_audit` row and the
  `move_public_research_runs` row it is linked to by audit id.

## Known Gaps

- Nothing is cited yet. The review queue and the citation and validation
  rules are the next two changes.
- The worker does not yet pass the use-case label, value-lever names or
  register questions, so a brief today carries the industry and archetype
  only. The service accepts the other fields; wiring them from capture and
  the register is follow-up work.
- Sources come only from web search citations. A fetched page's own
  citations carry no URL in the API response, so web fetch only informs the
  model's reading.
- `web_fetch_20260309` and `web_search_20260209` match the installed SDK
  types; whether the default working-draft model accepts the fetch version is
  confirmed only at the first live run, where a refusal is recorded as
  `failed` and the build continues.
- With the flag off the runner records nothing, not a `skipped` row: an
  unenrolled tenant gets no write at all. A brief with nothing left after
  screening is recorded as `skipped`.
- The dataset manifest's `load_approval` is still empty; enabling writes in a
  shared environment needs that human approval.

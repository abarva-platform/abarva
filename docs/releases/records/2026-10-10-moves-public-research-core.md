# 2026-10-10 — Moves public-source research: storage contract

## Release ID

`2026-10-10-moves-public-research-core`

## Status

`candidate`

## Plain-English Summary

The first of four changes that let a Moves deliverable build look up PUBLIC
outside sources (program rules, payment rules, published studies) through the
audited Anthropic path, and cite them only after a consultant approves them.

This change adds only the storage contract. Nothing calls it yet, so no build,
page or answer changes.

- Two new tables. `move_public_research_runs` records every research attempt,
  including one that found nothing, timed out or was denied, so a later build
  can say "no outside sources" honestly. `move_public_sources` stores each
  source for one tenant and one Move.
- The database refuses a bad source:
  - the kind must be `public_source`;
  - the URL must be https;
  - the excerpt is a short quotation of 1 to 300 characters;
  - the decision is pending, approved or rejected;
  - a decided source must name its reviewer and the time, and a pending one
    names neither;
  - the same quotation from the same page is stored once per Move.
- Row-level security mirrors the existing Move evidence table. A signed-in
  session reads only its own tenant's rows and cannot write. The server
  writes.
- A server-only repository reads and writes these tables. Every read, dedupe
  check and decision is fenced to every alias of one tenant and the exact
  Move. It checks the same rules before the write and returns a reason for
  each refused source. Failures come back as failures, never as an empty list.
  A decision only moves a pending source to approved or rejected; a decided
  source is never decided again.
- Governance: the policy gains a `public_source` source layer (additive; the
  policy version stays 1.0.0). Such an object is refused in shared corpus and can never be
  `agent_ready`. A dataset manifest declares the dataset before anything
  writes it.
- A tenant feature flag, `moves_public_source_research`, on for the synthetic
  demo tenant only, and an AI workload, `moves_public_research`, billed on the
  offline-generation key lane.

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged.
- Canonical model: two new tenant-scoped, Move-scoped tables (one additive,
  re-runnable migration). No existing table, column or policy changes.
- Governance contract: new `public_source` source layer and two new block
  rules (no shared corpus, never `agent_ready`); manifest validator refuses a
  `public_source` manifest scoped to shared corpus. The policy version stays 1.0.0: the layer is additive, and a bump would invalidate every stored readiness proof (Home narrative admission requires a matching version).
- Products: no product reads or writes the new tables yet.
- AI egress: a new workload label only; no new model call.

## Client Applicability

- All clients: no visible change. Nothing calls the new repository yet.
- Specific clients: the synthetic demo tenant is enrolled in the feature flag
  for the later slices.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_public_source_research` (tenant policy).

## Changes Included

- `supabase/migrations/20261010130000_move_public_research.sql` (new): the two
  tables, CHECK constraints, unique dedupe key, indexes and RLS.
- `src/lib/deliverables/public-research/types.ts` (new): the contract types,
  statuses, decisions, the 300-character limit, the per-run limit of 12
  sources, and the validators that mirror every CHECK.
- `src/lib/deliverables/public-research/repository.ts` (new, server-only):
  insert a run, insert sources with dedupe, list approved sources for a Move,
  decide a pending source.
- `src/lib/governance/context-corpus-policy.ts`: `public_source` layer, the two
  block rules, `POLICY_VERSION` unchanged (1.0.0). `dataset-manifest.ts`: the shared-corpus
  refusal.
- `docs/governance/CONTEXT_CORPUS_POLICY.md`, `policy-exceptions.json`,
  `context-corpus-enforcement-tracker.json`: version and the public-source
  rules.
- `docs/governance/dataset-manifests/moves-public-source-research-v1.json`
  (new): the dataset declaration (Move-scoped, internal, not loaded).
- `src/lib/features/registry.ts`: the flag. The generated manual is updated.
- `src/lib/observability/ai-workload-taxonomy.ts`: the workload.
- Tests: two new suites under `src/lib/deliverables/__tests__/`, new cases in
  the policy, manifest and key-lane suites.

## QA / Validation

- New suites pass: repository fencing, dedupe and decisions (23); contract
  and migration constraints (17).
- Extended suites pass: policy (4 new cases), manifest (2 new, including the
  committed manifest file), key lanes (1 new assertion).
- Mutation checks: 49 mutations, applied one at a time; 48 failed a test. They
  cover each tenant and Move fence on every read, dedupe check and update; the
  dedupe paths; the per-run limit; error handling; each decision transition;
  each validator rule; each migration CHECK and policy; the policy and
  manifest rules; and the workload lane. One survived and is behaviour-neutral
  by construction: dropping the explicit `pending` from the insert, because
  the column defaults to `pending`.
- Combined run: pass, 58 suites, 595 tests (deliverables, governance, AI
  egress, features, observability).
- `validate:context-corpus` and its five sub-checks: pass.
- Census regenerated: pass. Both new test files are swept (2,766 to 2,768).
- `npm run typecheck`: pass. ESLint on changed files: pass, no errors.
- `docs:nexus-manual:check`: pass.
- The migration was not applied to any database.

## Rollout Plan

Merge through the protected main branch. The migration is applied through the
client-data lane's governed migration path. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. Nothing reads or writes
the tables until the research step ships.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: none for this slice, because nothing calls
  the tables. After the migration is applied, read back that both tables
  exist with RLS enabled and the CHECK constraints present.

## Rollback Plan

Revert through a pull request. The tables are additive and empty, and no code
path depends on them. If the migration was applied, the tables can stay
unused, or be dropped by a later additive migration after review. The policy version is unchanged, so existing objects and readiness proofs are unaffected.

## Audit Evidence

- Pull request and CI results.
- The suites, mutation results and validator output above.
- The committed dataset manifest.

## Known Gaps

- No research step yet. Nothing writes runs or sources until the next slice
  adds the research call to the build. The review queue and citation rules
  follow after that.
- The migration must be applied through the client-data lane before the
  research step can store anything. It was not applied here.
- Research is client-neutral only. Researching a client by name needs an
  ops-held identity mapping and a later decision.
- The manifest's `ingestion_method` is `api_upload`, the closest existing
  value; the research step writes from the build worker.

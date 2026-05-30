# 2026-05-30 · Atlas Initiative-Archetype Corpus (IAC) v1 — foundation

## Release ID
`2026-05-30-atlas-iac-foundation`

## Status
candidate

## Plain-English Summary
Atlas (the Tower agent) can speak about a tenant's OWN initiatives — Tower's ingest fleet just shipped real watchers for Copilot, Claude Code, Cursor, GitHub DORA, Jira, ServiceNow CMDB/ITSM, Workday HCM, ERP, and Azure Cost. But Atlas cannot speak about what the INDUSTRY is doing with these technologies, because no curated, sourced, queryable industry-context layer exists.

This release lays the foundation of that layer — the Initiative-Archetype Corpus (IAC). It ships:

- The schema (`src/lib/atlas/iac/types.ts`) — `InitiativeArchetype` with sub-shapes for planning ranges, adoption metrics, deployment patterns, trend direction, pitfalls, peer benchmarks, emerging "what next" patterns, and evidence anchors.
- An append-only registry (`src/lib/atlas/iac/registry.ts`) — same shape as `src/lib/tower/ingest/registry.ts` so sibling Wave 2 slices can each append one archetype with trivial union merges.
- Pure retrieval helpers (`src/lib/atlas/iac/retrieval.ts`) — `getArchetype`, `listArchetypes`, `findArchetypeByLooseMatch`.
- Two fully-populated reference archetypes: **GitHub Copilot** and **Claude Code**, sourced exclusively to real, dated, verifiable publications.
- Test suites that lock the honesty discipline: every figure is a labelled planning range with cohort, sample size, source, and `YYYY-MM` date; every evidence anchor has source + date; banned phrases ("industry standard", "everyone is doing", "best practice") are flagged unless they come verbatim from a cited source; `lastReviewed` is a valid ISO date on every entry.

## Layer Impact
- `runtime-app-lane`: none today. Atlas runtime composition is Wave 3's lane — that PR will wire `findArchetypeByLooseMatch` / `getArchetype` into prompt assembly. This slice is corpus-only.
- `architecture-lane`: introduces a new application-layer module `src/lib/atlas/iac/` with a schema, registry, and retrieval contract. Sibling slices append archetypes; Atlas composition reads via the retrieval API.
- `qa-validation-lane`: 3 new test files (41 cases): honesty invariants over the registry, registry-vs-authored-files cross-check, and content floor for the two reference archetypes.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — the IAC powers cross-industry context Atlas surfaces to every tenant. Each tenant still consents to whether and how it shows up; the corpus is industry-context, not tenant data.
- Specific clients: none preferentially.
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/iac/types.ts` — new. `InitiativeArchetype` and supporting types.
- `src/lib/atlas/iac/registry.ts` — new. Append-only array; alphabetical by `archetypeKey`.
- `src/lib/atlas/iac/retrieval.ts` — new. Pure, deterministic helpers.
- `src/lib/atlas/iac/archetypes/github-copilot.ts` — new. 6 adoption metrics, 5 deployment patterns, 4 pitfalls, 4 emerging patterns, 5 evidence anchors.
- `src/lib/atlas/iac/archetypes/claude-code.ts` — new. 4 adoption metrics, 4 deployment patterns, 4 pitfalls, 4 emerging patterns, 5 evidence anchors.
- `src/lib/atlas/iac/__tests__/honesty-invariants.test.ts` — new. Locks the planning-range / source / date / banned-phrases discipline.
- `src/lib/atlas/iac/__tests__/registry.test.ts` — new. Uniqueness + retrieval pure-functions tests.
- `src/lib/atlas/iac/__tests__/archetype-content.test.ts` — new. Content floor for the two reference entries.

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest src/lib/atlas/iac` — 41/41 passing.
- `npm run test:behaviors` — 85/90 passing. The one failing suite is `tenant-onboarding.test.ts`, which is a pre-existing failure on main and confirmed unrelated to this slice (no IAC code touches tenant-onboarding paths). Precedent: `2026-05-30-atlas-p0-cross-tenant-leak.md` § "Pre-existing failures on main … confirmed unrelated via stash-and-rerun".
- Honesty invariants enforced: planning-range tag on every figure, source + `YYYY-MM` (or `YYYY-MM-DD`) date on every figure and evidence anchor, banned-phrase guard, valid `lastReviewed`.

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main. No runtime behavior changes — the IAC has no consumers until Wave 3 wires Atlas composition.
- Wave 2 archetype slices (8 more archetypes) land in parallel siblings, each appending one entry to `INITIATIVE_ARCHETYPES` in alphabetical order.
- Wave 3 wires `findArchetypeByLooseMatch` / `getArchetype` into Atlas prompt assembly behind the existing Atlas tenant-correctness guardrails.

## Rollback Plan
- Revert this PR. Removes the entire `src/lib/atlas/iac/` tree. No other code paths depend on it yet, so revert is safe and has no behavior impact.

## Audit Evidence
- Tower ingest fleet was the precondition: real per-tenant initiative facts exist. Without industry context Atlas can answer "what is OUR Copilot rollout doing" but not "what is the INDUSTRY doing with Copilot."
- Honesty discipline mirrors the Atlas P0 audit closure (PR #2562 — `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`). The same banned-phrase and source-required guards apply at the industry layer so we cannot re-introduce fabrication paths.
- All citations in the two reference archetypes resolve to real, dated publications: GitHub Octoverse + Universe 2024 announcements, Stack Overflow Developer Survey 2024, Microsoft Q2 FY24 earnings, GitHub's own productivity research, Pearce et al. "Asleep at the Keyboard?" (IEEE S&P 2022), Anthropic's October 2024 launch, the Claude Enterprise plan launch, and the Claude 3.5 Sonnet launch with named adopters.

## Known Gaps
- Eight more archetypes (Wave 2) and Atlas composition wiring (Wave 3) are deliberately out of scope.
- Both reference archetypes are in the `ai-coding` category. The other seven `ArchetypeCategory` values (ai-product-dev, ai-erp, ai-itsm, ai-crm, ai-productivity, ai-hr, ai-customer-service) are reserved for Wave 2 entries.
- `Routes and disclaimers` integrity check may still report pre-existing main breakage unrelated to this PR. Same precedent as recent Atlas PRs — that gate is admin-mergeable when it is the only remaining failure.

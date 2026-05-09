# Knowledge Corpus Remediation Tracker

Date: 2026-05-09

Purpose: provide one source of truth for what is complete, what is only partially complete, and what remains from the knowledge-corpus remediation report. This tracker covers the full outcome, not only Wave 1.

Status legend:

- Done: merged to `main`, QA/CI passed, and no known follow-up is required for that specific slice.
- Partial: design or scaffolding exists, but runtime behavior, persistence, QA, or content coverage is incomplete.
- Not started: no merged implementation or reviewed design artifact in `main`.
- Deferred: intentionally held for a later wave because an upstream dependency must land first.

## Executive Status

The full report remediation is not complete.

Wave 1 foundation is complete and merged. The broader goal, making Nexus, Sentinel, and Atlas use a persisted consultant-grade pattern intelligence layer at runtime, is still in progress.

Current truth:

- Canonical schema and normalization foundation: Done.
- Pattern inventory and duplicate-risk visibility: Done.
- Persistence decision: Done; canonical corpus data must be persisted.
- Persisted canonical corpus system of record: Done.
- Backfill preview: PR-A2 complete and CI-green.
- Runtime canonical pattern index: PR-A3 complete and CI-green.
- Context broker corpus hydration: PR-B1 complete and CI-green.
- Runtime pattern-first retrieval in agents: Nexus, Sentinel, and Atlas complete.
- All-agent Apex current-state grounding across tenant-scoped surfaces: Done.
- Large industry corpus expansion: Done for Wave 3 baseline; Retail, Financial Services, and Healthcare packs are complete.
- All-agent training and response doctrine: Done; shared runtime doctrine and Nexus phase training framework merged in PR-D5.
- End-to-end validation that agents retrieve and use patterns: Wave 2C complete and CI-green.
- Canonical corpus backfill executor: Done in PR-E1 / PR #1867.
- Canonical-id duplicate resolution: In progress in PR-E2 / PR #1868; curated source-merge rules reduce preview rows from 323 to 312 and clear all 11 collision groups without dropping source crosswalks.
- Remaining completion blockers: execute persisted canonical corpus backfill with configured credentials, remediate legacy strict-validator errors, make keyword fallback runtime-real when vector is unavailable, and add response-shape regression tests across surfaces.

## Merged Evidence

| PR | Status | Merge commit | Outcome |
| --- | --- | --- | --- |
| [#1823](https://github.com/anandsundaram-hash/abarva/pull/1823) | Done | `6aba77bfbdae9f50c73319804981c541d403d2f7` | Canonical industry AI pattern contract and source mapping. |
| [#1824](https://github.com/anandsundaram-hash/abarva/pull/1824) | Done | `0f8a7118ea14617ea467e6e3795181f9d3d97fb5` | Pattern crosswalk inventory and duplicate-risk report. |
| [#1826](https://github.com/anandsundaram-hash/abarva/pull/1826) | Done | `8a040c560d91d65ea569c9e7fe4c8e70c1a4ea78` | Canonical enum normalizers and tests. |
| [#1827](https://github.com/anandsundaram-hash/abarva/pull/1827) | Done | `cc8ac37c4b2e73587bbb1714be9c39621da3f309` | Canonical pattern draft builder and tests. |
| [#1828](https://github.com/anandsundaram-hash/abarva/pull/1828) | Done | `a18fe1a89ea3266f69217ac6987f536f696eaacf` | Pattern-first retrieval design blueprint. |
| [#1829](https://github.com/anandsundaram-hash/abarva/pull/1829) | Done | `c3f91db922188c1178ba9a405f7648adca7a359a` | Wave 1 execution summary. |
| [#1831](https://github.com/anandsundaram-hash/abarva/pull/1831) | Done | `c93fa0fa06b6e2dbe7552c6aa65d8aef1f752d65` | Persistence decision locked: canonical corpus must be persisted. |
| [#1835](https://github.com/anandsundaram-hash/abarva/pull/1835) | Done | `d0f94dadbfafe60e3c07690471a74461b3c9aeaf` | Persisted canonical corpus table, read contract, RLS assumptions, and tests. |
| [#1836](https://github.com/anandsundaram-hash/abarva/pull/1836) | Done | `1266c6ad3d94302cc4fd5bbe3975581c073b7b0e` | Deterministic canonical corpus backfill preview, generated report, and Apex Retail naming cleanup. |
| [#1839](https://github.com/anandsundaram-hash/abarva/pull/1839) | Done | `b0873cc2902a76fb44917cd7a44dc7de247da913` | CI unblock: fixed Source view-mode test typing so remediation PR checks could evaluate against green `main`. |
| [#1843](https://github.com/anandsundaram-hash/abarva/pull/1843) | Done | `498411d9bdb3a3f060f6fcc9c61b0cebdd828dc1` | Context broker hydrates `corpusPatterns` from persisted canonical patterns with provenance and explicit no-match warnings. |
| [#1844](https://github.com/anandsundaram-hash/abarva/pull/1844) | Done | `d7cd12e0be7447906155a53bb58561ab9675356e` | Nexus retrieves canonical patterns after move/program context and before synthesis, with no-match, confidence, and missing-provenance handling. |
| [#1845](https://github.com/anandsundaram-hash/abarva/pull/1845) | Done | `89bdd2178bf879a3d010d86ad5c9eef342e94ebb` | Sentinel grounds answers in canonical patterns and surfaces evidence, artifact, KPI, guardrail, failure-mode, phase, and tenant-pattern gaps. |
| [#1846](https://github.com/anandsundaram-hash/abarva/pull/1846) | Done | `cb1067038ae56adf9d8bf7ff14cb81160b395766` | Atlas grounds value advice in canonical KPI, baseline, measurement, confidence, and quantitative-claim metadata. |
| [#1848](https://github.com/anandsundaram-hash/abarva/pull/1848) | Done | `fdb66bf56b5b454464523acac8ab960dee669347` | Canonical corpus validation suite and current strict-quality baseline report. |
| [#1849](https://github.com/anandsundaram-hash/abarva/pull/1849) | Done | `3a2c9e210ced65e52ddee8245a142a40360d35ba` | Sample retrieval QA for six executive queries plus deterministic no-match behavior. |
| [#1851](https://github.com/anandsundaram-hash/abarva/pull/1851) | Done | `85fc403af6c99a7c6ef49f13cd8c745b5bce2123` | Nexus, Sentinel, and Atlas expose canonical source basis, confidence, missing evidence, and unsupported claim flags. |
| [#1853](https://github.com/anandsundaram-hash/abarva/pull/1853) | Done | `83153ca7fe3d288c948570ce111df2c6302aea33` | Industry AI pattern coverage matrix for Retail, Financial Services, and Healthcare. |
| [#1855](https://github.com/anandsundaram-hash/abarva/pull/1855) | Done | `886e160da72a0f2803c952b7034b65a4cb65bd6e` | Retail AI pattern pack: 40 canonical-complete Retail patterns; preview rows increase to 243; sample retrieval QA improves to 4/6. |
| [#1859](https://github.com/anandsundaram-hash/abarva/pull/1859) | Done | `bb59766645c57ec2caad3869cec62643a93c2a67` | Hotfix: Nexus, Sentinel, Atlas, and Steward receive Apex current-state grounding across tenant-scoped pages, including private data-plane tenants. |
| [#1862](https://github.com/anandsundaram-hash/abarva/pull/1862) | Done | `16ada186b620012ddc0a63541d5dfff4f0215bc0` | Financial Services AI pattern pack: 40 canonical-complete Financial Services patterns; preview rows increase to 283; sample retrieval QA improves to 5/6. |
| [#1863](https://github.com/anandsundaram-hash/abarva/pull/1863) | Done | `36f0f14bc21301f184adb846c645f893adedebaa` | Healthcare AI pattern pack: 40 canonical-complete Healthcare patterns; preview rows increase to 323; sample retrieval QA passes 6/6. |
| [#1864](https://github.com/anandsundaram-hash/abarva/pull/1864) | Done | `0e3215a12fa45371d357742e7d35d13441362fce` | All-agent response doctrine and Nexus phase training framework: Setup/Admin, Intelligence, Strategic Moves, Source, Tower, and general chat now share the same grounding and answer-shaping rules. |
| [#1867](https://github.com/anandsundaram-hash/abarva/pull/1867) | Done | `73c6e791a9e1fb5a7ec90c7c83b8be64b4a65bdf` | Canonical corpus backfill executor: dry-run-first service-role write path with `canonical_id` upsert key, content-hash comparison, explicit write mode, and collision blocking. |

## Execution Ledger

| Slice | PR | Branch / worktree | Agent owner | Files changed | Validation run | DB migration/backfill status | Open issues | Next slice | Gate status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-A1 Persisted Canonical Corpus Schema | [#1835](https://github.com/anandsundaram-hash/abarva/pull/1835) Add persisted canonical corpus schema | `knowledge/persisted-canonical-corpus-schema-2026-05-09` / `/tmp/nexus-kc-a1` | DB/Persistence | `supabase/migrations/20260513150000_canonical_industry_ai_patterns.sql`; `src/lib/intelligence/canonical/persistence-contract.ts`; `src/lib/intelligence/canonical/persistence-contract.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_PERSISTENCE_READ_CONTRACT_2026-05-09.md`; tracker | `git diff --check`; `npx eslint src/lib/intelligence/canonical/persistence-contract.ts src/lib/intelligence/canonical/persistence-contract.test.ts`; `npm test -- --runInBand src/lib/intelligence/canonical/persistence-contract.test.ts`; `npm run test:behaviors -- --runInBand`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | Additive migration only. No backfill writes. Authenticated read-only RLS; service-role write path. DB application pending normal migration deployment. | Backfill not executed by design; runtime readers not wired yet. | PR-A2 Backfill Preview | green |
| PR-A2 Backfill Preview | [#1836](https://github.com/anandsundaram-hash/abarva/pull/1836) Add canonical corpus backfill preview | `knowledge/canonical-corpus-backfill-preview-2026-05-09` / `/tmp/nexus-kc-a2` | Corpus migration | `src/scripts/intelligence/preview-canonical-corpus-backfill.ts`; `src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_PREVIEW_2026-05-09.md`; `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json`; `package.json`; tracker | `git diff --check`; `npx eslint src/scripts/intelligence/preview-canonical-corpus-backfill.ts src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `npm test -- --runInBand src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; `npx tsc --noEmit --pretty false`; `npm run intel:canonical-corpus:preview` with configured env file; `npm run build`; GitHub CI green before merge | Dry-run only. No DB writes. Read-only DB inspection included 28 `pattern_packs` and 40 `genome_patterns`; preview produced 271 rows. Backfill execution pending. | Preview found 11 canonical id collisions, 255 rows missing provenance, and 40 rows with unsupported quantitative claims. These must be handled before write execution. | PR-A3 Runtime Pattern Index | green |
| Support CI unblock | [#1839](https://github.com/anandsundaram-hash/abarva/pull/1839) Fix Source view mode test typing | `codex/ci-unblock-source-view-mode-test-2026-05-09` / `/tmp/nexus-ci-unblock-source-view-mode` | Codex | `src/__tests__/integration/source/source-view-mode-default.test.ts` | `npm test -- --runInBand src/__tests__/integration/source/source-view-mode-default.test.ts`; `npx eslint src/__tests__/integration/source/source-view-mode-default.test.ts`; `npx tsc --noEmit --pretty false`; GitHub CI green before merge | No DB changes. | This was not a knowledge-corpus slice; it unblocked mainline TypeScript so PR-A2 and later remediation PRs could merge with green checks. | PR-A3 Runtime Pattern Index | green |
| PR-A3 Runtime Pattern Index | [#1841](https://github.com/anandsundaram-hash/abarva/pull/1841) Add runtime canonical pattern index | `knowledge/runtime-pattern-index-2026-05-09` / `/tmp/nexus-kc-a3` | Retrieval | `src/lib/intelligence/canonical/runtime-pattern-index.ts`; `src/lib/intelligence/canonical/runtime-pattern-index.test.ts`; tracker | `git diff --check`; old retail client name scan with `git grep`/`rg`; `npm test -- --runInBand src/lib/intelligence/canonical/runtime-pattern-index.test.ts`; `npx eslint src/lib/intelligence/canonical/runtime-pattern-index.ts src/lib/intelligence/canonical/runtime-pattern-index.test.ts`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Reads from persisted `canonical_industry_ai_patterns`; in-memory cache is TTL-only and not a source of truth. | Runtime agents are not wired yet; `corpusPatterns` hydration starts in PR-B1 after A3 merges. | PR-B1/B2/B3/B4 runtime grounding train | green |
| PR-B1 Context Broker Hydration | [#1843](https://github.com/anandsundaram-hash/abarva/pull/1843) Hydrate context broker corpus patterns | `knowledge/context-broker-corpus-hydration-2026-05-09` / `/tmp/nexus-kc-b1` | Retrieval | `src/lib/knowledge/context-broker/broker.ts`; `src/lib/knowledge/context-broker/types.ts`; `src/lib/knowledge/context-broker/index.ts`; `src/lib/knowledge/context-broker/__tests__/broker.test.ts`; tracker | `git diff --check`; `npm test -- --runInBand src/lib/knowledge/context-broker/__tests__/broker.test.ts src/lib/intelligence/canonical/runtime-pattern-index.test.ts`; `npx eslint src/lib/knowledge/context-broker/broker.ts src/lib/knowledge/context-broker/types.ts src/lib/knowledge/context-broker/index.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Hydrates `corpusPatterns` from persisted canonical index; empty/no-match/error states surface explicit canonical warnings. | Nexus/Sentinel/Atlas runtime consumers still need their own grounding PRs. | PR-B2/B3/B4 runtime grounding train | green |
| PR-B2 Nexus Pattern-First Retrieval | [#1844](https://github.com/anandsundaram-hash/abarva/pull/1844) Wire Nexus canonical pattern retrieval | `knowledge/nexus-pattern-first-retrieval-2026-05-09` / `/tmp/nexus-kc-b2` | Nexus | `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`; `src/lib/programs/nexus-free-text.ts`; `src/__tests__/integration/programs-nexus-ask-route.test.ts`; `src/__tests__/integration/programs-nexus-free-text.test.ts`; `src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts`; tracker | `git diff --check`; old retail client name scan with `rg`; `npm test -- --runTestsByPath src/__tests__/integration/programs-nexus-ask-route.test.ts src/__tests__/integration/programs-nexus-free-text.test.ts src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts --runInBand`; scoped ESLint on touched files; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Nexus reads canonical patterns through persisted runtime index after program context and before synthesis. | Runtime quality depends on populated/readable `canonical_industry_ai_patterns`; no-match and missing provenance are surfaced instead of inferred. | PR-B3/B4 runtime grounding train, then PR-C3 source/confidence display | green |
| PR-B3 Sentinel Grounding | [#1845](https://github.com/anandsundaram-hash/abarva/pull/1845) Ground Sentinel answers in canonical patterns | `knowledge/sentinel-canonical-grounding-2026-05-09` / `/tmp/nexus-kc-b3` | Sentinel | `src/lib/sentinel/canonical-grounding.ts`; `src/lib/sentinel/orchestrator.ts`; `src/lib/sentinel/types.ts`; `src/lib/sentinel/__tests__/canonical-grounding.test.ts`; `src/lib/sentinel/__tests__/orchestrator.test.ts`; tracker | `git diff --check`; old retail client name scan with `rg`; `npm test -- --runInBand src/lib/sentinel/__tests__/canonical-grounding.test.ts src/lib/sentinel/__tests__/orchestrator.test.ts`; scoped ESLint on touched files; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Sentinel reads canonical patterns at assessment time and compares move evidence against required artifacts, KPIs, guardrails, failure modes, phase fit, and tenant-pattern assumptions. | Runtime quality depends on populated/readable `canonical_industry_ai_patterns`; contradiction checks are advisory until source/confidence display is unified in PR-C3. | PR-B4 Atlas grounding, then PR-C1/C2/C3 QA visibility | green |
| PR-B4 Atlas Grounding | [#1846](https://github.com/anandsundaram-hash/abarva/pull/1846) Ground Atlas value advice in canonical patterns | `knowledge/atlas-canonical-grounding-2026-05-09` / `/tmp/nexus-kc-b4` | Atlas | `src/lib/atlas/value-grounding.ts`; `src/lib/atlas/value-grounding.test.ts`; `src/lib/atlas/scripted-engine.ts`; `src/lib/atlas/llm.ts`; `src/lib/atlas/prompt.ts`; `src/lib/atlas/types.ts`; `src/lib/intelligence/canonical/runtime-pattern-index.ts`; `src/lib/intelligence/canonical/runtime-pattern-index.test.ts`; `src/lib/knowledge/context-broker/__tests__/broker.test.ts`; tracker | `git diff --check`; old retail client name scan with `rg`; `npm test -- --runInBand src/lib/atlas/value-grounding.test.ts src/lib/intelligence/canonical/runtime-pattern-index.test.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts`; scoped ESLint on touched files; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Atlas reads canonical pattern KPIs, baselines, measurement methods, value levers, confidence, and quantitative claim metadata through the persisted runtime index. | Runtime quality depends on populated/readable `canonical_industry_ai_patterns`; source/confidence display remains unified in PR-C3. | PR-C1 Corpus Validation Suite | green |
| PR-C1 Corpus Validation Suite | [#1848](https://github.com/anandsundaram-hash/abarva/pull/1848) Add canonical corpus validation suite | `knowledge/corpus-validation-suite-2026-05-09` / `/tmp/nexus-kc-c1` | QA | `src/scripts/intelligence/validate-canonical-corpus.ts`; `src/scripts/intelligence/validate-canonical-corpus.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_VALIDATION_REPORT_2026-05-09.md`; `package.json`; tracker | `npm run intel:canonical-corpus:validate`; focused Jest; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Validator reads generated dry-run preview JSON and does not mutate source or database content. | Current strict baseline after Wave 3 packs: `patterns=323 errors=1800 warnings=0`. Strict failure mode should be enabled after legacy/generated/cross-industry remediation closes the known gaps. | PR-C2 Sample Retrieval QA and PR-C3 Source/Confidence Display | green |
| PR-C2 Sample Retrieval QA | [#1849](https://github.com/anandsundaram-hash/abarva/pull/1849) Add sample retrieval QA | `knowledge/sample-retrieval-qa-2026-05-09` / `/tmp/nexus-kc-c2` | QA | `src/scripts/intelligence/sample-retrieval-qa.ts`; `src/scripts/intelligence/sample-retrieval-qa.test.ts`; `docs/knowledge-corpus/SAMPLE_RETRIEVAL_QA_REPORT_2026-05-09.md`; `package.json`; tracker | `npm run intel:canonical-corpus:sample-retrieval-qa`; focused Jest; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. QA reads generated dry-run preview JSON and exercises deterministic canonical retrieval fallback. | Initially passed 3 of 6; after Retail, Financial Services, and Healthcare packs it passes 6 of 6 target queries. | PR-C3 Source/Confidence Display | green |
| PR-C3 Source/Confidence Display | [#1851](https://github.com/anandsundaram-hash/abarva/pull/1851) Expose canonical source and confidence disclosures | `knowledge/source-confidence-display-2026-05-09` / `/tmp/nexus-kc-c3` | API/UI | `src/lib/intelligence/canonical/agent-grounding-disclosure.ts`; Nexus ask route/free-text response; Sentinel grounding/orchestrator/types; Atlas value grounding/orchestrator/types/ask route; tests; tracker | Focused Jest; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Runtime responses expose canonical source basis, confidence, missing fields, missing provenance, and unsupported claim flags from the persisted pattern read path. | User-visible UI layout remains intentionally minimal; deeper visual treatment can follow once consuming clients settle on placement. | Wave 3 Industry Coverage Matrix | green |
| PR-D1 Industry Coverage Matrix | [#1853](https://github.com/anandsundaram-hash/abarva/pull/1853) Add industry AI pattern coverage matrix | `knowledge/industry-coverage-matrix-2026-05-09` / `/tmp/nexus-kc-d1` | Domain corpus | `docs/design/knowledge/INDUSTRY_AI_PATTERN_COVERAGE_MATRIX_2026-05-09.md`; tracker | `git diff --check`; old retail client name scan; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. No seed data changes. Matrix defines target coverage before D2-D4 content additions. | None for D1. | PR-D2/D3/D4 industry pattern packs | green |
| PR-D2 Retail Pattern Pack | [#1855](https://github.com/anandsundaram-hash/abarva/pull/1855) Add retail AI pattern pack | `knowledge/retail-pattern-pack-2026-05-09` / `/tmp/nexus-kc-d2` | Domain corpus | `src/lib/intelligence/seed-patterns-retail-ai.ts`; `src/lib/intelligence/seed-patterns-industry.ts`; `src/lib/intelligence/seed-types.ts`; `src/lib/intelligence/canonical/build-canonical-pattern.ts`; `src/lib/intelligence/canonical/build-canonical-pattern.test.ts`; generated canonical preview/validation/sample retrieval reports; tracker | `npm test -- --runInBand src/lib/intelligence/canonical/build-canonical-pattern.test.ts`; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run intel:canonical-corpus:preview`; `npm run intel:canonical-corpus:validate`; `npm run intel:canonical-corpus:sample-retrieval-qa`; direct retail row QA; `npm run build`; GitHub CI green; banned-name scan clean | No DB writes. Adds 40 source-code-seeded Retail AI patterns that become deterministic canonical backfill preview rows. Preview rows increase to 243; strict validator still reports legacy/non-retail gaps. | Sample retrieval improves to 4/6; remaining failures are Financial Services AML and Healthcare back-office coverage. | PR-D3 Financial Services Pattern Pack and PR-D4 Healthcare Pattern Pack | green |
| PR-D3 Financial Services Pattern Pack | [#1862](https://github.com/anandsundaram-hash/abarva/pull/1862) Add financial services AI pattern pack | `knowledge/financial-services-pattern-pack-2026-05-09` / `/tmp/nexus-kc-d3` | Domain corpus | `src/lib/intelligence/seed-patterns-financial-services-ai.ts`; `src/lib/intelligence/seed-patterns-industry.ts`; generated canonical preview/validation/sample retrieval reports | `npm test -- --runInBand src/lib/intelligence/canonical/build-canonical-pattern.test.ts`; scoped ESLint; `npm run intel:canonical-corpus:preview`; `npm run intel:canonical-corpus:validate`; `npm run intel:canonical-corpus:sample-retrieval-qa`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green; banned-name scan clean | No DB writes. Adds 40 source-code-seeded Financial Services AI patterns that become deterministic canonical backfill preview rows. Preview rows increase to 283; strict validator still reports legacy gaps. | Sample retrieval improves to 5/6; remaining failure is Healthcare back-office productivity coverage. | PR-D4 Healthcare Pattern Pack | green |
| PR-D4 Healthcare Pattern Pack | [#1863](https://github.com/anandsundaram-hash/abarva/pull/1863) Add healthcare AI pattern pack | `knowledge/healthcare-pattern-pack-2026-05-09` / `/tmp/nexus-kc-d4` | Domain corpus | `src/lib/intelligence/seed-patterns-healthcare-ai.ts`; `src/lib/intelligence/seed-patterns-industry.ts`; `src/scripts/intelligence/sample-retrieval-qa.ts`; generated canonical preview/validation/sample retrieval reports; tracker | Focused canonical builder test; scoped ESLint; `npm run intel:canonical-corpus:preview`; `npm run intel:canonical-corpus:validate`; `npm run intel:canonical-corpus:sample-retrieval-qa`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green; banned-name scan clean | No DB writes. Adds 40 source-code-seeded Healthcare AI patterns that become deterministic canonical backfill preview rows. Preview rows increase to 323; strict validator still reports legacy gaps. | Sample retrieval QA passes 6/6. | PR-D5 all-agent training and phase framework | green |
| PR-D5 All-Agent Training Framework | [#1864](https://github.com/anandsundaram-hash/abarva/pull/1864) Add all-agent grounding and response doctrine | `knowledge/all-agent-training-framework-2026-05-09` / `/tmp/nexus-kc-d4` | Nexus training / Agent runtime | `docs/design/agent-coordination/ALL_AGENT_KNOWLEDGE_GROUNDING_AND_RESPONSE_DOCTRINE_2026-05-09.md`; `docs/design/nexus/NEXUS_PHASE_TRAINING_FRAMEWORK_2026-05-09.md`; `src/lib/agent/all-agent-doctrine.ts`; `src/lib/agent/all-agent-doctrine.test.ts`; `src/app/api/chat/agent/route.ts`; tracker | `npm test -- --runInBand src/lib/agent/all-agent-doctrine.test.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts`; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge; banned-name scan clean | No DB writes. Runtime prompt doctrine only; no data mutation. | Response-shape regression tests by surface and optional UI display refinements remain follow-up hardening. | Persisted backfill execution and strict corpus remediation. | green |
| PR-E1 Canonical Corpus Backfill Executor | [#1867](https://github.com/anandsundaram-hash/abarva/pull/1867) Add canonical corpus backfill executor | `knowledge/canonical-corpus-backfill-executor-2026-05-09` / `/tmp/nexus-kc-d4` | Corpus migration | `src/scripts/intelligence/backfill-canonical-corpus.ts`; `src/scripts/intelligence/backfill-canonical-corpus.test.ts`; `docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_EXECUTION_REPORT_2026-05-09.md`; `package.json`; tracker | `git diff --check`; banned-name scan; focused Jest; scoped ESLint; `npm run intel:canonical-corpus:backfill:dry`; `npx tsc --noEmit --pretty false`; `npm run build`; GitHub CI green before merge | No DB writes. Dry-run default. Write mode requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, uses `canonical_id` for upsert, and blocks while canonical-id collisions exist. | Initial dry-run found 11 canonical-id collision groups; credentials were not available for existing-row hash comparison in local dry-run. | PR-E2 canonical duplicate resolution, then write execution. | green |
| PR-E2 Canonical Duplicate Resolution | [#1868](https://github.com/anandsundaram-hash/abarva/pull/1868) Resolve canonical corpus duplicate ids | `knowledge/canonical-duplicate-resolution-2026-05-09` / `/tmp/nexus-kc-d4` | Corpus migration | `src/scripts/intelligence/preview-canonical-corpus-backfill.ts`; `src/scripts/intelligence/preview-canonical-corpus-backfill.test.ts`; regenerated preview, validation, sample retrieval, execution reports; tracker | Focused Jest; scoped ESLint; `npm run intel:canonical-corpus:preview`; `npm run intel:canonical-corpus:backfill:dry`; `npm run intel:canonical-corpus:validate`; `npm run intel:canonical-corpus:sample-retrieval-qa`; `npx tsc --noEmit --pretty false`; `npm run build`; CI pending | No DB writes. Curated collision rules merge duplicate source crosswalks into one canonical row per ID. Backfill dry-run now sees 312 rows, 0 collision groups, 312 rows eligible, and no writes. | Credentials were not available for existing-row hash comparison; strict validator still reports 1,711 legacy quality errors. | PR-E3 write execution with credentials and PR-E4 quality remediation. | amber |
| Hotfix: all-agent Apex current-state grounding | [#1859](https://github.com/anandsundaram-hash/abarva/pull/1859) Ground all agents in Apex current state | `codex/nexus-apex-context-fix-2026-05-09` / `/tmp/nexus-nexus-apex-context-fix` | Codex | `src/app/api/chat/agent/route.ts`; `src/lib/knowledge/agent-context-broker.ts`; `src/lib/knowledge/tenant-data/mapper.ts`; focused tests | `npm test -- --runInBand src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/lib/knowledge/tenant-data/__tests__/mapper.test.ts src/lib/programs/__tests__/programs-broker-adapter.test.ts`; scoped ESLint; `npx tsc --noEmit --pretty false`; `npm run build`; banned-name scan; GitHub CI green before merge | No DB writes. Runtime prompt context now preserves tenant fallback and broker current-state grounding even when the private data plane is active. | None for this hotfix. | Resume PR-D3/D4 industry pattern packs. | green |

## Full Report Outcome Tracker

| Workstream | Status | Evidence in `main` | What remains |
| --- | --- | --- | --- |
| Phase 1 audit of existing corpus/schema | Partial | Wave 1 artifacts reference the audit findings; crosswalk inventory is merged. | The requested `docs/build/KNOWLEDGE_CORPUS_AUDIT_2026-05-09.md` is not present in `origin/main` and should be merged or superseded by this tracker plus a reviewed audit doc. |
| Canonical industry AI pattern framework | Done | `CANONICAL_INDUSTRY_AI_PATTERN_CONTRACT_2026-05-09.md`; `industry-ai-pattern.ts`. | Final canonical id review workflow and owner assignment remain open. |
| Source-to-target mapping | Done | `PATTERN_SOURCE_TO_TARGET_MAPPING_2026-05-09.md`. | Mapping must be kept current as new sources are added. |
| Crosswalk inventory | Done | `PATTERN_CROSSWALK_INVENTORY_2026-05-09.md`; generated JSON inventory. | Needs scheduled regeneration after schema/content changes. |
| Duplicate-risk report | Done | `PATTERN_DUPLICATE_RISK_REPORT_2026-05-09.md`. | Actual merge/deprecation decisions are not done. |
| Canonical enum normalization | Done | `normalizers.ts`; `normalizers.test.ts`; alias rules doc. | Runtime source data is not rewritten, by design. |
| Canonical draft builders | Done | `build-canonical-pattern.ts`; `build-canonical-pattern.test.ts`. | Builders expose drafts only; they do not persist canonical records. |
| Persistence architecture decision | Done | PR #1831; Wave 1 summary and retrieval docs updated. | Follow through with write execution into the persisted system of record after dry-run review. |
| Persisted canonical corpus table/view | Done | PR #1835 adds additive table, RLS/read contract, tests, and docs. | DB migration application follows normal deployment process. |
| Canonical corpus backfill | Preview complete in PR-A2 | PR #1836 previews deterministic payloads and reports collisions/gaps. | Do not execute writes until canonical id collisions, provenance gaps, and unsupported claim flags are reviewed. |
| Runtime canonical pattern index | Done | PR #1841 adds a persisted canonical read/index layer with explicit empty/no-match/error statuses and TTL-only cache. | Backfill execution must populate the persisted table for production data. |
| Nexus pattern-first retrieval | Done in PR-B2 | Nexus ask route retrieves persisted canonical patterns after program context and before synthesis; free-text synthesis surfaces source basis, confidence, missing provenance, and no-match states. | Add response-shape regression tests by surface. |
| Sentinel evidence/pattern gap checks | Done in PR-B3 | Sentinel orchestration reads canonical patterns and surfaces missing evidence, artifacts, KPIs, guardrails, failure-mode mitigation, phase mismatch, and tenant-pattern contradiction gaps. | Add response-shape regression tests by surface. |
| Atlas value/KPI grounding | Done in PR-B4 | Atlas value guidance separates projected/tracked/verified framing and grounds KPI, baseline, measurement, value lever, confidence, and quantitative claim handling in canonical patterns. | Add response-shape regression tests by surface. |
| `corpusPatterns` hydration | Done | PR #1843 maps persisted canonical hits into `corpusPatterns`, provenance, and retrieval trace shared-corpus ids. | Backfill execution must populate the persisted table for production data. |
| Warning handling | Done for canonical corpus paths | `WARNING_CORPUS_PENDING` is replaced on context-broker corpus/full paths by canonical empty/no-match/error warnings; vector/worldview warnings remain explicit. | Keyword fallback remains design-only when vector/Pinecone is unavailable. |
| User-visible source basis/confidence | Done in PR-C3 | `groundingDisclosure` contract added to Nexus, Sentinel, and Atlas agent/API outputs. | Richer UI placement can follow if consuming clients need a more visual treatment. |
| Agent current-state grounding across pages | Done | PR #1859 makes Apex tenant current-state context shared across Nexus, Sentinel, Atlas, and Steward on tenant-scoped surfaces, and no longer suppresses fallback tenant context for private data-plane tenants. | Deeper answer quality still depends on industry pattern coverage and persisted corpus population. |
| Keyword fallback when vector is unavailable | Not started | Design only. | Deterministic field-first fallback ranking and fallback-mode caveats. |
| All-agent training and response doctrine | Done | PR #1864 adds shared runtime doctrine for Setup/Admin, Intelligence, Strategic Moves, Source, Tower, and general chat. The doctrine requires tenant/current-state grounding first, concise specific answers, useful multiple-choice options, source/confidence visibility, and refusal to invent KPIs, financials, org facts, or client strategy. | Add response-shape regression tests by surface and optional UI display refinements. |
| Phase-specific Nexus training framework | Done | PR #1864 adds `docs/design/nexus/NEXUS_PHASE_TRAINING_FRAMEWORK_2026-05-09.md`. | Wire additional phase-specific hardening as needed after runtime observations. |
| Industry coverage matrix | Done | `docs/design/knowledge/INDUSTRY_AI_PATTERN_COVERAGE_MATRIX_2026-05-09.md` merged in PR #1853. | Keep matrix current as D2-D5 land. |
| Large industry/function pattern expansion | Done for Wave 3 baseline | Retail, Financial Services, and Healthcare packs each add 40 canonical-complete patterns; sample retrieval QA now passes 6/6. | Continue enrichment only after duplicate-risk/provenance review and runtime behavior hardening. |
| Pattern QA validation scripts | Done in PR-C1 | Validator checks canonical fields, KPI minimums, data-domain minimums, failure modes, mitigations, artifacts, workshops, provenance, phase coverage, and unsupported quantitative claim flags. | Use Wave 3 content remediation to reduce strict-quality errors before enabling strict CI. |
| Runtime retrieval sample-query QA | Done in PR-C2, improved by Wave 3 packs | Sample retrieval QA exercises six executive queries plus no-match behavior against the deterministic canonical preview fallback; after Healthcare pack merge it passes 6/6. | Keep sample queries current as new executive scenarios are added. |
| DB mutation/content migration | Partial | Additive persistence schema, deterministic preview, and idempotent dry-run-first executor exist. PR-E2 removes canonical-id collisions from the preview by merging reviewed duplicate source crosswalks. No DB writes have been performed. | Rerun dry-run with credentials for hash comparison, then execute write mode only after preview validates. |

## Current Counts From Wave 1 Inventory

Source: `docs/knowledge-corpus/generated/pattern-crosswalk-inventory.json`.

| Source system | Count |
| --- | ---: |
| `pattern_seed` | 186 |
| `generated_pattern_manifest` | 17 |
| `pattern_packs` | 28 |
| `genome_patterns` | 40 |
| `phase_packs` | 6 |
| `deliverable_registry` | 15 |
| `knowledge_source_doc` | 16 |

Industry coverage in the inventory:

| Industry | Objects |
| --- | ---: |
| `cross_industry` | 204 |
| `retail` | 77 |
| `healthcare` | 31 |
| `financial_services` | 16 |
| `energy` | 4 |
| `public_sector` | 1 |
| `other` | 8 |

Duplicate-risk summary:

| Risk | Objects |
| --- | ---: |
| high | 22 |
| medium | 192 |
| low | 94 |

## Completion Gates

The remediation is complete only when all gates below are green:

1. Persisted canonical corpus store or approved persisted view exists.
2. Canonical records can be regenerated/backfilled deterministically from source systems.
3. Nexus retrieves canonical patterns before synthesis.
4. Sentinel checks evidence, guardrails, KPIs, artifacts, and failure modes against canonical patterns.
5. Atlas separates projected, tracked, and verified value using canonical KPI/value fields.
6. `corpusPatterns` is hydrated in the context broker.
7. Source basis, confidence, missing fields, and unsupported quantitative claims are visible to users or agent tooling.
8. Retrieval sample queries return relevant patterns with confidence and provenance.
9. Corpus-wide validation passes for required fields, KPI minimums, data requirements, artifacts/workshops, provenance, and unsupported quantitative claims. Current strict baseline after PR-E2 duplicate resolution: `patterns=312 errors=1711 warnings=0`; the remaining errors are concentrated in legacy/generated/cross-industry rows, not the three new industry packs.
10. Retail, Financial Services, and Healthcare have reviewed front-office, middle-office, back-office, and cross-functional pattern depth.
11. Canonical corpus rows are actually written to the persisted system of record through an idempotent backfill executor, with dry-run and execution reports retained. Current PR-E1 dry-run retained the report and wrote nothing.

## Recommended Next PR Train

1. `knowledge/canonical-corpus-write-execution-2026-05-09`
   - Run the idempotent executor in dry-run mode with credentials to classify insert/update/unchanged rows.
   - Execute `--apply` only after the preview has no collisions and the report validates.
2. `knowledge/canonical-corpus-quality-remediation-2026-05-09`
   - Close the 1,711 strict-validator errors in legacy/generated/cross-industry rows without duplicating the new industry packs.
   - Preserve source provenance and unsupported-claim flags rather than inventing citations or outcomes.
3. `knowledge/vector-unavailable-keyword-fallback-2026-05-09`
   - Make deterministic field-first fallback ranking runtime-real when vector/Pinecone is unavailable.
   - Show fallback-mode caveats in agent/tooling responses.
4. `knowledge/agent-response-shape-regression-2026-05-09`
   - Add surface-level tests for Setup/Admin, Intelligence, Strategic Moves, Source, Tower, and general chat.
   - Assert concise answers, specific tenant grounding, source/confidence display, and multiple-choice options where applicable.

## Stop/Report Conditions

Stop and report before claiming completion if:

- persistence exists only as generated JSON or in-memory state
- a runtime agent still synthesizes domain advice without retrieving canonical patterns first
- `corpusPatterns` remains empty for domain-specific move questions
- sample retrieval queries have not been tested
- content is added before duplicate-risk and provenance handling are resolved
- quantitative claims are present without source basis and confidence rationale
- DB writes are required but migration/backfill review has not happened

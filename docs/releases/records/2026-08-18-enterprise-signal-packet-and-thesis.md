# 2026-08-18-enterprise-signal-packet-and-thesis — The decision-context compiler and the EnterpriseThesis layer

## Release ID

`2026-08-18-enterprise-signal-packet-and-thesis`

## Status

`candidate`

## Plain-English Summary

Adds the layer that sits between the canonical model and Home's narrative generation, replacing
the "hand a model 4,026 undifferentiated records" approach with a deliberate pipeline:

```
canonical records → decision context → quality manifest → signal packet → EnterpriseThesis (Claude)
```

**Decision context** (`buildDecisionContext`) computes real business/strategy/portfolio/technology/
vendor/organization/performance/risk/leadership-voice facts from canonical records — pure
arithmetic, no model. Deliberately leaves `strategy.priorityToProgramLinks` empty: no canonical
field links a program to a stated strategic priority today, and this function does not infer one.

**Quality manifest** (`buildContextQualityManifest`) states, as first-class facts rather than
buried caveats: interview-to-portfolio crosswalk coverage (9.6% on SkyHarbor — 22 of 230 rows
resolve to a real canonical object), metric comparability (15 of 26 on SkyHarbor have a usable
baseline/target/actual), and vendor document-evidence coverage. The last one surfaced something
worth knowing on its own: the two contracts with document-level extraction behind them (from the
golden evidence packet built earlier this session) don't match any name in SkyHarbor's actual
65-contract vendor register — a disjoint evidence set, not partial coverage of the real one.

**Signal packet** (`buildEnterpriseSignalPacket`) extracts materiality-thresholded signals across
twelve categories (concentration, dependency, gap, risk, contradiction, consensus, dissent,
outlier, portfolio, complexity, data_quality) — 46 real signals on SkyHarbor, each carrying a
stable id, the canonical domains it draws from, and the specific record names behind it. Every
threshold that decides what counts as "material" is a named constant, not a feeling.

**EnterpriseThesis** (`build-enterprise-thesis.ts`) is one whole-enterprise reasoning call over the
signal packet, producing a structured thesis (value creation model, strategic bets, structural
constraints, operating tensions, leadership consensus/disagreement, performance story, material
risks, things a new CXO should know, questions for management) — every substantive claim required
to carry `evidence_ids` pointing at real signals.

Two-tier validation, not one: a structural check (every cited evidence id exists; every claim spans
at least two canonical domains, the same bar the prompt itself states for a real connection) runs
on every claim, automatically. A second, adversarial entailment check — a separate model call given
only a claim and its cited facts, asked SUPPORTED / PARTIALLY_SUPPORTED / UNSUPPORTED / OVERSTATED
— runs in this same release on the five highest-stakes claim categories (strategic bets, operating
tensions, material risks, value-realization tensions, things a new CXO should know), not deferred
to a later iteration, per instruction that the surfaces making the strongest synthesized claims are
exactly where unverified entailment does the most damage.

## Layer Impact

Lane: `global-control-lane`. New generator code and a new artifact type
(`NexusEnterpriseThesisV1`) in the existing `public.home_knowledge_packs` table. No schema change,
no canonical write, no product surface reads this yet.

## Client Applicability

All clients: yes, tenant-agnostic. Tested against both active tenants.

## Changes Included

- `scripts/data-build/enterprise-signal-packet.ts` — decision context, quality manifest, signal
  packet. New.
- `scripts/data-build/build-enterprise-thesis.ts` — EnterpriseThesis prompt, structural validator,
  entailment verifier, governed write. New.
- `tests/behaviors/enterprise-signal-packet.test.ts` — 10 tests.
- `tests/behaviors/enterprise-thesis-validation.test.ts` — 10 tests.

## QA / Validation

**PASS** on everything checkable without a live model call; **NOT YET RUN** on the generation and
verification calls themselves.

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors repo-wide.
- `npx eslint` on all four new files — PASS, 0 errors, 0 warnings.
- 20 new tests, all passing, covering: vendor concentration arithmetic, metric direction inference,
  the explicit refusal to fabricate a priority-to-program link, distinct-program counting (see
  below), vendor document-evidence disjoint-set detection, materiality thresholds, evidence
  traceability, consensus/dissent classification, the structural validator's domain-count and
  citation checks, JSON parsing including code-fence stripping, and claim removal by path.
- Full repo test suite — PASS, 195/195 (`npm run test:behaviors`) plus the 20 new tests under
  `tests/behaviors/` (confirmed picked up by the bare `jest` run behind `npm test`, the same root
  as `tests/behaviors/home-orientation-pack-validation.test.ts` from earlier this session).
- Deterministic layers run end-to-end against both live tenants (no API key needed) — 4,026
  records → 46 signals on SkyHarbor; 3,505 records → 46 signals on Meridian (coincidental match,
  confirmed by inspecting content: genuinely different identity, vendors, risks per tenant).

One real bug found and fixed by running against real data, the same pattern as everything else
built this session: `linkedPrograms` originally counted crosswalk *rows*, not distinct program
*names*. On SkyHarbor's actual data this produced the right number (13) by coincidence — the 13
resolvable rows happen to name 13 distinct programs with no duplicates. A test was written
specifically to catch the case where they don't, and does.

**NOT YET RUN:** the EnterpriseThesis generation call and the entailment verifier, both of which
need `ANTHROPIC_API_KEY` and are therefore untested beyond structural/unit coverage in this
environment. That is the immediate next step this PR unblocks — same ACA Job pattern as the
orientation pack build earlier this session.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. Run
`build-enterprise-thesis.ts` as an ACA Job in dry-run mode first (no `THESIS_WRITE`), inspect the
generated thesis and verifier verdicts, and apply the three acceptance tests specified for this
layer before any write: would a new CEO learn something from this that scanning the tables
wouldn't teach; does it contain at least 5 meaningful cross-domain observations; does every strong
assertion survive "why do you believe that?" Only proceed to chapter writers and UI after this
layer passes those tests on real output.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR. No write occurs until a subsequent ACA Job dry-run,
  human review of the output, and then an explicit write pass — tracked separately.
- Live signed-in proof required: not for this PR; not applicable until a product surface reads
  this artifact type, which is a later phase (chapter writers, per the agreed sequencing).

## Rollback Plan

Revert the commit. No data written under this PR.

## Audit Evidence

- Dry-run signal packets for both tenants captured at `/tmp/thesis-dryrun/` during this session
  (not committed — ephemeral local verification, matching the pattern of prior dry-run captures).
- Test output above.

## Known Gaps

- Generation and verification are unexecuted beyond local structural tests. Quality of the actual
  EnterpriseThesis output — the acceptance-test question that matters most — is unproven until run.
- Chapter writers (Pass 2) are explicitly not built yet, per the standing instruction not to build
  them until this layer proves out.
- Tier 3 (priority→program/spend/KPI mapping) remains unbuilt. The candidate-relationship engine
  (explicit `candidate_relationship`, `not_client_attested`, `confidence`, `reason`,
  `supportingEvidenceIds` shape) is designed in this session's discussion but not implemented —
  scoped as a later phase per the agreed sequencing, after the core thesis layer is proven.
- The entailment verifier's rewrite path for `PARTIALLY_SUPPORTED` claims is not built — those
  currently pass through unmodified rather than being rewritten or dropped, a v1 simplification
  worth resolving once real verifier output shows how often that verdict actually occurs.

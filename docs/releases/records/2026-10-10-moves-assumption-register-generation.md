# 2026-10-10 — Moves assumptions register: generation feed and validator enforcement

## Release ID

`2026-10-10-moves-assumption-register-generation`

## Status

`candidate`

This release is stacked on `2026-10-10-moves-assumption-register-routes`
(storage, domain rules, routes and the aVa propose tool). It is the fourth and
fifth of the five planned register changes. The third change, the register
screen and charter bridge, ships separately.

## Plain-English Summary

The product rule: aVa may use a working figure only as a labelled register
assumption, cited `[A:ID]`. A figure in a generated Move document must trace
either to governed evidence `[n]` or to a register row whose figure matches.
A bare `[ASSUMPTION TO VALIDATE]` tag no longer makes a number traceable.

With the flag on, Move document generation now does four things.

- **It reads the register.** Both generation paths read the Move's register:
  the queued phase build and the board-grade orchestrated routes. Only open,
  confirmed and corrected rows are used, and only rows the governance policy
  does not block. Proposed, rejected and superseded rows never reach the model.
  A confirmed or corrected row uses its answer figure. Only an open row is
  marked "to validate".
- **The prompt lists each row with its ID.** For example:
  `[A:V3] <statement> — working figure 12% (confidence 3; owner: CFO office; open → VALIDATE)`.
  The prompt shows the owner's role, never a person's name. Every instruction
  that told the model to label an ungrounded figure as an assumption is
  replaced by the register rule: such a figure may appear only as a register
  working figure cited `[A:ID]`, and never with `[ASSUMPTION TO VALIDATE]`.
- **The quality gate enforces the rule.** A figure sentence is traced by
  `[n]`, by a client-complete, evidence-missing or open-input marker, or by a
  register citation whose row figure matches. Matching uses the same
  normalisation as evidence matching: case, spaces, `,` and `$` are ignored.
  A bare assumption tag, an untagged figure, or a figure different from the
  cited row's figure blocks the document. So does an `[A:ID]` anywhere in the
  document that names no citable row. The deterministic repair now tags an
  untraced figure `[EVIDENCE MISSING …]` instead of `[ASSUMPTION TO VALIDATE …]`.
- **The rendered Move document shows the register.** Its assumptions section
  is a table with these columns: ID, assumption, figure, owner role, confidence
  and status. Each row is anchored, for example `#assumption-V3`, and each
  `[A:V3]` in the body links to its row.

If the register cannot be read, generation stops before any model call. The
reader sees a sentence that says nothing was saved. A failed read is never
treated as an empty register.

With the flag off, nothing changes. The register is not read, the request
carries no enforcement marker, and the prompt, the repair tags and the gate are
byte-identical to before.

## Layer Impact

- Release lane: `global-control-lane` code, feature-flagged per tenant (no
  schema, no data change).
- Layer 3, canonical model: read only. The register rows from the previous
  release are projected for generation through the existing governed-object
  filter. No new table, column or write.
- Layer 4, products: Moves document generation (prompt, quality gate,
  deterministic repairs, HTML render). Tower, Source, Home and Intelligence are
  unchanged. Non-Moves generation never reads the register.
- Layers 1 and 2: no change.
- Governance: the register reaches the model only as Move-scoped prompt context
  under its existing dataset manifest. Rows pass `toGovernedObject` +
  `evaluateGovernedObject` before use. Owner role only, never a name.

## Client Applicability

- All clients: no behaviour change. With the flag off every path is
  byte-identical to before.
- Specific clients: the synthetic demo tenant has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_assumption_register_v1` (tenant policy, synthetic demo
  tenant only).

## Changes Included

- `src/lib/deliverables/orchestrator/numeric-lineage-tokens.ts`:
  - one shared `REGISTER_ID_PATTERN` and `REGISTER_CITATION_RE`;
  - the supported-marker builder (the legacy regex unchanged, plus a register
    variant without the assumption tag);
  - `figureLineagePolicy(req)`;
  - `judgeFigureSentence`, which the gate and the repairs both use, so the two
    cannot drift.
- `src/lib/deliverables/orchestrator/quality-validator.ts`:
  - claims are judged through the shared policy;
  - a new blocker for register IDs the generation does not hold;
  - the enforced blocker sentence names the cited rows and the figures that
    did not match.
- `src/lib/deliverables/orchestrator/section-generation.ts` and
  `orchestrator.ts`: every repair (section bodies, tables, checklist,
  recommendation, next actions, slides, exhibits, open inputs) takes the
  lineage policy. Under the register the repair tag is `[EVIDENCE MISSING …]`.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`:
  - register rows render with ID, figure, confidence, owner role and status;
  - the register rule replaces the "label it as an assumption" clauses in the
    honesty discipline, system prompt, discovery metric discipline and section
    draft. This happens only under enforcement.
- `src/lib/deliverables/orchestrator/types.ts`: optional
  `assumptionRegisterEnforced` on the request.
- `src/lib/deliverables/orchestrator/build-request.ts`: optional
  `approvedAssumptions` parameter. When it is present, even empty, the request
  is enforced.
- `src/lib/deliverables/orchestrator/generate-service.ts`:
  - `deps.loadAssumptionRegister`, called only for Moves deliverables;
  - a failed read blocks the run with `assumption_register_unavailable`.
- `src/lib/programs/assumption-register/generation-feed.ts` (new,
  server-only): the flag-gated loader over `listAssumptions`.
- `src/lib/programs/assumption-register/model.ts`:
  - `approvedAssumptionsFromRegister`, the projection behind governance;
  - the flag constant;
  - the unavailable sentence;
  - the ID pattern, now read from the shared token module.
- `src/lib/programs/assumption-register/register-route-access.ts`: re-exports
  the flag constant from the model.
- `src/lib/programs/move-business-case.ts`: optional `assumptionRegister`
  (`loaded` or `unavailable`) on `MoveBusinessCaseInput`.
- `src/lib/programs/board-artifacts/load-move-business-case-input.ts`: loads
  the register behind the flag. A failed read becomes `unavailable`.
- `src/lib/programs/deliverables/orchestrated/build-request.ts` and
  `run-orchestrated-move-deliverable.ts`:
  - fill and enforce from the loaded register;
  - refuse to generate when the register is `unavailable`.
- `src/lib/programs/deliverables/orchestrated/render-html.ts`: the register
  table, the anchors and the body-citation links. The legacy list is kept when
  no assumption is a register row.
- `src/lib/features/registry.ts`: the flag summary now describes generation.
  The Nexus manual is regenerated from it.
- Tests:
  - `src/lib/deliverables/orchestrator/__tests__/assumption-register-lineage.test.ts`
    (new);
  - `src/lib/programs/deliverables/orchestrated/__tests__/assumption-register-feed.test.ts`
    (new);
  - three register cases added to
    `src/lib/programs/board-artifacts/__tests__/load-move-business-case-input.test.ts`.
- The regenerated test CI coverage census.

## QA / Validation

- New suites: 44 lineage tests and 12 feed tests; 3 loader cases added. They
  cover:
  - prompt rendering: only counted statuses, owner role and never a name, and
    the answer figure for confirmed and corrected rows;
  - both build paths fill the field when the flag is on and stay `[]`, with no
    enforcement key, when it is off;
  - the validator: it passes a tagged matching figure, and blocks an untagged
    figure, a bare assumption tag, an unknown ID (even on an evidence-backed
    figure) and a mismatched figure;
  - the repair tag change and its idempotence;
  - an end-to-end orchestration that threads the register through every
    repair;
  - the render table, anchors and links;
  - the generate-service feed, including blocking on a failed read;
  - explicit flag-off cases throughout.
- Mutation checks: pass. 57 mutations were applied one at a time, each restored
  from an in-memory copy, and all 57 failed a test. Three earlier survivors
  were closed with new cases:
  - the orchestrator's per-section repair and assembly's re-repair each
    covered for the other;
  - non-register rows were listed in the prompt.
- Existing suites unchanged and passing: `src/lib/deliverables`,
  `src/lib/programs`, the deliverable queue worker, the deliverable and Moves
  board-grade routes, the register routes and agent tools: 581 suites, 8,688
  tests. Feature registry suites: pass.
- `npm run typecheck`: pass. ESLint on the changed files: clean.
- `npm run audit:lib-orphans`: no change against the baseline.
- Test CI coverage census: test files 2,934 → 2,936 and covered test files
  2,770 → 2,772, exactly the two new suites. Both are in directories swept by
  required jobs.
- `npm run audit:ai-surface-controls`, `npm run audit:ai-surface-control-cases`,
  `node scripts/quality/check-named-suite-requiredness.mjs`,
  `npm run check:export-reachability`,
  `node scripts/audit/route-reachability-check.mjs`,
  `npm run docs:nexus-manual:check`: pass.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image.

Generation reads the register only for the synthetic demo tenant. Until the
register migration from the previous release is applied, its read fails for
that tenant. Every Moves generation for that tenant is then refused with
`assumption_register_unavailable`. So apply the register migration through the
governed migration lane before this release's image serves demo generations,
or keep the flag off until it is applied.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: the deliverable queue worker runs the same
  generation path. Verify its job image matches the approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: a signed-in demo-tenant phase build, after the
  register migration is applied, with:
  - one open and one confirmed register row;
  - the document citing `[A:ID]` with the matching figure;
  - the register table rendered;
  - a bare-tag figure blocked.

  Until then this release is `deployed`, not `live-proven`.

## Rollback Plan

Revert through a pull request, or remove the demo tenant from the flag in the
code registry. With the flag off, generation is byte-identical to before. No
data or schema is written by this release, so there is nothing to roll back in
the data plane.

## Audit Evidence

- Pull request and CI results.
- The suites, the mutation results and the census change above.
- After apply: the migration lane run and the signed-in demo build described
  above.

## Known Gaps

- Generation is governed by its own flag, `moves_assumption_register_generation_v1`,
  OFF for every tenant at merge (the register itself stays on for the demo
  tenant). Enrol the demo tenant only after the register migration is applied
  through the migration lane and the demo Move's register holds its working
  figures: under enforcement an unreadable register stops the build before any
  model call, and an empty one admits no figure outside evidence.
- Validation outcome changes with the flag on. For the demo tenant, any Move
  document whose model output carries a figure labelled only
  `[ASSUMPTION TO VALIDATE]` is now blocked by the unsupported-claim blocker.
  This applies to every Move document type, and these documents passed before.
  The same goes for any document that cites an `[A:ID]` outside the citable
  register. The prompt tells the model the new rule, but a model that ignores
  it produces a blocked document, not a laundered figure.
- An empty register under the flag means a figure not in evidence may not
  appear at all.
- `[EVIDENCE MISSING]` and `[CLIENT TO COMPLETE]` on a figure sentence still
  count as lineage, as specified; only the assumption tag stopped counting. A
  model could still put one of those markers on a figure.
- The DOCX, XLSX and PDF renderers (`renderers.tsx`), which the queued phase
  build uses, still list assumptions as statement and basis without the
  register ID. A reader of those formats sees `[A:V3]` in the body but no ID
  column to resolve it. Only the orchestrated HTML render carries the register
  table.
- Other instructions still mention `[ASSUMPTION TO VALIDATE]` for missing
  facts:
  - the brief registry's fabrication boundary;
  - the strategic-moves artifact standard on other generation paths;
  - the consulting-grade rubric and the client-readiness scan.

  The register rule in the prompt states that it overrides them for figures.
  The other generation paths (`generate-artifact.ts`,
  `src/lib/programs/deliverables/orchestrator.ts`) do not read the register.
- The register migration is still unapplied, as recorded in the routes release.

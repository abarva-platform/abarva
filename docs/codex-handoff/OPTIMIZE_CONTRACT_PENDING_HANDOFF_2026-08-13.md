# Optimize Contract — Pending Work Handoff

Date: 2026-08-13

Owner: written by the Claude Code session that shipped the Optimize Contract UI and view-model work on
2026-08-12/13. Everything below is verified against the deployed product, not inferred from code.

## Read this first

**The Optimize Contract journey has never run past step 2.** On the deployed revision, every contract
checked — CTR-001, CTR-020, CTR-061, CTR-090 — sits at `step 2 of 7 · Lock baseline`, blocked on
`No governed commercial baseline yet`, with steps 3 through 7 all in `future` state.

That means the evidence board, the opportunity traceability split, and the workflow rail are all
proven, but **everything downstream of the baseline is unexercised with real data**. Do not treat
steps 3–7 as working; treat them as unproven.

This single blocker gates most of the value in the rest of this document.

## What already shipped — do not rebuild

| Capability | Where | State |
| --- | --- | --- |
| Evidence readiness board (9 families, obligation, owner, template, grain, load/parse state, fact counts, artifact impact, next action) | `src/lib/source/data-model/contract-optimization-evidence-readiness.ts` | Live, 6/8 required evidenced on CTR-090 |
| Amount traceability (traced / restated / untraced / not sized, reproducible vs non-reproducible totals) | `src/lib/source/data-model/contract-optimization-traceability.ts` | Live, $387K reproducible vs $6.4M not on CTR-090 |
| Workflow position + next-decision bar (7 gates derived from governed state) | `src/lib/source/data-model/contract-optimization-workflow-step.ts` | Live |
| aVa contract-grain grounding | `src/lib/source/facts/view/ava-contract-grounding-context.ts` | Live, answers evidence/baseline/value questions from the same reads the page renders |
| Approve-with-gaps disclosure | `SourceAnalyticsCanvas.tsx` | Live |
| Journey tick requires approval evidence | `source-event-shell-v2.ts` | Live |

All of the above have tests and release records. Extending them is welcome; re-implementing them is
waste.

## Pending, in priority order

### P0-1 — The commercial baseline never reaches `ready`

Every contract is stuck at step 2. `opportunitySet.baseline.status` is not `ready` for any contract
sampled, so no case can advance.

Start at `getContractOptimizationOpportunitySet` in
`src/lib/source/data-model/read-adapter.ts`, which builds the baseline from
`source.golden_contract_overview` and `source.golden_contract_pricing_schedule`. Determine whether the
status is `missing` because the rows are absent, because the pricing schedule does not reconcile to
stated annual value (`conflict`), or because the readiness rule is stricter than the data can ever
satisfy.

Done when: at least one governed contract reaches `baseline.status === "ready"` and its rail advances
to step 3, proven in a signed-in browser run.

### P0-2 — Most opportunity amounts have no calculation run

On CTR-090, four of six opportunity rows state an amount with no calculation run behind them —
$6.4M of $6.8M is not reproducible. The UI now says so honestly, but the underlying runs do not exist.

The four rows lacking lineage are scope rationalization, off-contract billing, negotiated improvement,
and SLA credit recovery. Rate variance and VMS rate-card variance do have runs and reproduce correctly,
so the shape to copy already exists.

Done when: every stated amount either has a calculation run that reproduces it, or is reported as
`not sized` rather than carrying a figure.

### P1-3 — Steps 5 and 6 have no real substrate

`deriveOptimizeWorkflowPosition` advances "Build strategy" and "Approve and execute" off the
opportunity maturity stage (`target_position`, `agreed`) because there is no persisted strategy packet
and no Optimize-specific approval record. Those artifacts do not exist.

This was a deliberate stopgap so the rail could be honest today. It is not a design.

Done when: a strategy packet (target, fallback, walk-away, vendor ask list) and an approval record with
named approver and rationale are persisted, and the gates read those instead of a stage enum.

### P1-4 — Two required evidence families have no governed source

`ticket_volume` and `staffing_model` always read `no governed evidence / Not loaded / parser not run`
for every tenant, because nothing in either evidence-ref vocabulary maps to them. That is honest today
but it means readiness can never exceed 6 of 8.

Either load those sources, or decide they are not required for this archetype and adjust the template
pack. Do not silently mark them satisfied.

### P1-5 — Contract 360 → Optimize handoff is unverified

The Lane 1 acceptance included "Contract 360 can hand off selected contract context into Optimize
Contract." I never exercised that path. It may work; it is simply unproven.

### P2-6 — The rail is a chip row, not the left tree in the spec

The module spec asked for a left tree with substeps and a wide right canvas for the active decision.
What shipped is a horizontal 7-chip rail plus a next-decision bar. That was deliberate — it kept the
change reviewable — but it is not what the spec describes. Revisit once steps 3–7 actually have
content to lay out; designing the tree around unexercised stages would be guesswork.

### P2-7 — Whole page renders twice in the DOM

A leftover React streaming template (`div#S:0`) holds a second full copy of the page. Shell-wide, not
Optimize-specific. Effects: doubled HTML payload, two `<h1>` elements, duplicate `data-testid`
attributes that break strict-mode selectors. No user-visible breakage, which is why it is P2.

## Blocked on a human, not on engineering

`src/lib/auth/source-access-policy.ts:429` — `canViewFinancialData` ignores the `admin` flag that the
same function already uses to gate event scope and approvals. Consequence: a Source admin sees
$1.56B on the workspace and `[restricted financial value]` from aVa on the same tenant.

The decision has been made: a Source admin for their own active client may view `restricted_financial`
Source data without a separate `financial_visibility` membership flag. The edit is
`admin || membership?.financial_visibility || participantFinancial`. Note that `defaultDataClasses()`
keys off the same boolean, so those roles also gain `restricted_financial` in `allowedDataClasses`,
which affects retrieval filtering and not only aVa's wording.

## Proof rules

These are not optional, and this document was written under them.

1. Verify against the deployed revision, signed in — not against local code.
2. Before claiming anything is live, prove the ACA runtime invariant: template image digest, the
   100%-traffic revision image digest, and revision health all match.
3. Missing stays missing. An absent value is never rendered as zero.
4. An amount with no calculation run behind it is not presented as validated value.
5. State the counting basis with any figure. Two Source surfaces legitimately count different units —
   see `docs/testing/source-ava-hard-qa-2026-08-12.md`.
6. Do not say "passed" without browser, data-readback, and console evidence.

## Related records

- `docs/testing/source-ava-hard-qa-2026-08-12.md` — aVa probe, AVA-S-01 to AVA-S-04
- `docs/testing/source-vendor-response-parsing-assessment-2026-08-13.md` — Lane 5 assessment and the
  differentiation requirement for vendor packages
- Release records dated 2026-08-12 and 2026-08-13 under `docs/releases/records/`

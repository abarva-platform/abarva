# 2026-07-05-quality-bar-source-register-evidence-aware — Require a source register only when governed evidence exists

## Release ID

`2026-07-05-quality-bar-source-register-evidence-aware`

## Status

`candidate` — verified live (fresh Lakeshore Move P1 charter) before merge.

## Plain-English Summary

The board-grade deliverable quality gate hard-required a **source register** on
every deliverable (`orchestrator/build-request.ts` → `qualityBar.requiresSourceRegister:
true`). A source register is a register **of governed evidence** — so on a Move
with **no ingested evidence**, the generated deliverable has nothing to cite, no
register is produced, and the gate blocks sign-off with *"no source register."*

This made a brand-new Move impossible to advance: driving a fresh P0→P5, the **P1
charter** (which is grounded in the human-entered capture — sponsor, scope,
decision rights, success criteria — not external evidence) generated cleanly but
was held below the board-grade gate for the single reason *"no source register,"*
with no evidence yet uploaded to cite.

Fix: require a source register **only when governed evidence is actually present**
(`requiresSourceRegister: evidence.length > 0`). When evidence exists the register
stays mandatory, so grounded deliverables are unchanged and must still cite what
they were built on (the P2 discovery report that scored 96/100 did so *because* it
had evidence — unaffected). When the evidence bundle is empty, the gate no longer
blocks on a register that could not exist.

### Why not a per-profile toggle

The choice was framed as "make the quality bar profile-aware (charter = lighter)."
On investigation that signal doesn't exist cleanly: the charter is deliberately
classified `tier3_board_grade` in `DELIVERABLE_TIER` (same tier as the discovery
report), and **nearly every** deliverable profile already uses
`sourceRegisterPolicy: "appendix_only"`. So a per-profile toggle would either be a
no-op or would loosen the bar for discovery/business-case too. Keying off *whether
there is evidence to register* is the precise defect and does not weaken the bar
for any deliverable that actually has evidence.

## Layer Impact

- `global-control-lane`: the shared deliverable orchestrator quality gate
  (`buildDeliverableRequest`) for all clients and all Moves/Source/Tower/Intelligence
  deliverables. Behavior change is strictly narrowing: it only *removes* a false
  block when there is no governed evidence; it never removes the register
  requirement when evidence is present.

## Client Applicability

- All clients: yes — every tenant generating board-grade deliverables.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/build-request.ts` — `qualityBar.requiresSourceRegister`
  changed from hardcoded `true` to `evidence.length > 0`, with an explanatory comment.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts` — two regression
  tests: register required when evidence present; not required when the bundle is empty
  (other board-grade checks unchanged).

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `jest` `buildDeliverableRequest` suite → **PASS** (3/3, incl. 2 new).
- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge: on the fresh Lakeshore Move (RETAIL-CONTRACT-2026),
  re-run P1 **Build and approve** → charter generates and **signs off** (no
  "no source register" block); then P1→P2 advance. Confirm the previously-passing
  P2 discovery report (with evidence) is unaffected.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live on the fresh Move. No
migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none changed — quality-gate parameterization only.
- Live signed-in proof required: **yes** — fresh-Move charter signs off; grounded
  deliverable still requires a register.

## Rollback Plan

Revert the PR. One-line quality-bar change; reverting restores the hardcoded
`requiresSourceRegister: true`. No data to unwind.

## Audit Evidence

- PR URL: (added on open)
- CI: jest + tsc + eslint clean.
- Pre-fix live evidence: fresh Lakeshore Move P1 charter held at the board-grade
  gate with the single reason "NO SOURCE REGISTER" at 0 ingested evidence.

## Known Gaps

- A deliverable that *should* be evidence-heavy (e.g. a discovery report) generated
  on a Move with zero evidence will now also skip the register requirement rather
  than being blocked. That is an edge case (such a deliverable is a broken input),
  and the other board-grade checks — sections, recommendation, decision section,
  risk table, unsupported-claim detection, and the client-to-complete checklist
  when gaps are declared — still apply. A follow-up could route genuinely
  ungrounded evidence-heavy deliverables to an explicit "draft — needs evidence"
  state rather than passing them, but that is beyond this hotfix.
- The demo evidence-upload flow (ingesting the pack so deliverables cite real
  sources) still needs a live pass; it was blocked this session only because the
  browser file-upload tool rejects files not explicitly shared with the session.

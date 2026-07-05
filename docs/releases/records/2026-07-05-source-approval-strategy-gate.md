# 2026-07-05-source-approval-strategy-gate — Event approval becomes the strategy gate

## Release ID

`2026-07-05-source-approval-strategy-gate`

## Status

`candidate`

## Plain-English Summary

The Source module used to make you draft the strategy memo as a separate manual
step ("Draft with aVa") on a dedicated Strategy canvas stage, even though every
input the memo needs already exists at event creation. This change removes that
wasted step and folds the strategy decision into the one gate that already
exists — event approval.

Now:
- When the creator lands on a freshly-created event, all three strategy-stage
  artifacts — the strategy memo, the value target brief, and the archetype
  decision record — are drafted automatically from intake, no manual click.
  Every input they need (archetype, rigor, value estimate, owner, trigger,
  scope) was already captured at intake, so there is nothing to re-enter.
- Approving an event is the strategy gate. The approver checks three boxes —
  strategy memo reviewed, value target confirmed, archetype + rigor confirmed —
  optionally leaves a comment, and approves. Approve is disabled until all three
  are checked. They can also **Send back** (event stays in the queue with the
  comment for the creator) or **Reject** (archives the event).
- On approval the event advances straight to **Scope**, the first stage with real
  client work. The strategy memo stays viewable in the stage rail; it is just no
  longer a stage anyone "works."

## Layer Impact

- `global-control-lane`: shared Source approval behavior for all clients. The
  approval endpoint now enforces review confirmations on approve and advances the
  event stage strategy → scope; the approval queue UI and the canvas auto-draft
  behavior change for everyone. No client-scoped schema or data-plane change.

## Client Applicability

- All clients: yes
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (not flag-gated)

## Changes Included

- `src/lib/source/approval-decision.ts` (new) — pure `evaluateSourceApprovalDecision`
  deciding lifecycle transition, required confirmations, and stage advancement.
- `src/lib/source/__tests__/approval-decision.test.ts` (new) — 10 unit tests.
- `src/app/api/v1/source/events/[eventId]/approve/route.ts` — accepts
  `approve | reject | send_back` + `confirmations`; enforces confirmations on
  approve (422 when missing); advances `current_stage_key` strategy → scope via
  the write-adapter `updateStage` seam.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts` — `approvalAction`
  union extended with `'sent_back'`.
- `src/components/source/AdminSourceEventApprovalQueue.tsx` — expandable review
  panel: three confirmation checkboxes, comment box, Approve (gated) / Send back /
  Reject, and a "View strategy memo" link.
- `src/lib/source/agent-generation/prompt-registry.ts` — added intake-only
  generation templates for `d02_value_target` and `d03_archetype_decision`, so
  all three strategy artifacts are now AI-draftable (was `d01`/`d05`/`d09` only;
  `listSupportedGenerationCodes()` now returns 5 codes).
- `src/components/source/canvas/UniversalCanvasShell.tsx` — fire-once-per-code
  effect that auto-drafts every empty generatable strategy-stage artifact
  (`d01`, `d02`, `d03`) on canvas load (replaces the manual Draft-with-aVa
  trigger).

## QA / Validation

- `npx jest src/lib/source/__tests__/approval-decision.test.ts` → 10/10 pass.
- `listSupportedGenerationCodes()` runtime check → returns the 5 codes
  `d01_strategy_memo, d02_value_target, d03_archetype_decision, d05_scope_memo,
  d09_rfp_pack` (was 3).
- `npm run test:nav` → 26/26 pass.
- `npm run test:behaviors` → 85/90 pass; the 5 failures are in
  `tenant-onboarding.test.ts` and reproduce identically on clean branch HEAD
  without these changes (pre-existing, unrelated).
- `npx tsc -p tsconfig.json --noEmit` → no errors in any changed file. (Two
  pre-existing `TS2307` errors remain in `UniversalCanvasShell.tsx` lines 116/117
  from unrelated committed imports — `SourceAvaDecisionExperience` and
  `proposal-intelligence/decision-package` — whose files do not exist on this
  branch. Not introduced here; see Known Gaps.)
- `npx eslint` on all changed files → clean.
- Live approve/generate paths require Anthropic + the private Azure DB and can
  only be proven on ACA (localhost cannot reach the private DB). Not yet
  live-proven.

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook
(`az acr build` → `az containerapp update` on `ca-abarva-web-lab-eastus` → wait
healthy → shift 100% traffic → verify `app.abarva.ai`). Record the ACA
revision/image when deployed. No migration. No feature flag.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision (shift 100% traffic back). No
schema or data migration to unwind. The `'sent_back'` approval-action value is
additive and harmless to existing rows on rollback.

## Audit Evidence

- PR URL (to be added on open).
- CI: `release:check`, jest, eslint, tsc.
- `source_event_approvals` rows carry the `action` (`admin_review` / `sent_back` /
  `rejected`), `from_state`, `to_state`, and folded confirmation + comment notes
  for every decision.

## Known Gaps

- Approver-selection dropdown (choose approver from tenant `persons` at intake)
  and the approval-notification email (Resend) are deferred — spec tracked
  separately.
- Auto-draft is browser-initiated on canvas load; if no one opens the canvas
  before the approver reviews, the memo may still be empty. The creator is
  redirected to the canvas on creation, which covers the normal flow.
- Pre-existing branch breakage: `UniversalCanvasShell.tsx` imports two modules
  that do not exist on `codex/source-canvas-three-column`
  (`SourceAvaDecisionExperience`, `proposal-intelligence/decision-package`). This
  blocks a clean project build and is unrelated to this change; it must be
  resolved before the branch can deploy.

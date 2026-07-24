# Source approval UX — slices 002/003/004 — Codex prompt (2026-07-22)

## Why this exists, and a correction already made

This continues the P1 approval UX simplification work
(`docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`, slice 1 shipped as
PR #5277/#5279). The backlog entries for the next slices
(`docs/backlog/source-product-backlog.md`, `SOURCE-APPROVAL-UX-002/003/004`) were **originally
written on a wrong assumption** — that the evidence/audit sections and the disabled-until-ready
Approve button still needed to be built. Direct inspection of
`src/components/source/approval/EventApprovalCard.tsx` found slice 1 already shipped all of
that. The backlog entries have been corrected; this prompt reflects the corrected, real scope.
**Read the current backlog entries yourself before starting** — they are the source of truth,
this doc is a convenience copy that may drift from them.

## Ground truth — verified on disk, do not assume otherwise

1. **Already shipped, do not rebuild**: `EventApprovalCard.tsx` already has a collapsed evidence
   disclosure (`data-testid="source-approval-evidence-disclosure"`, summary
   `Evidence reviewed · N facts`, body renders `IntakeFactsReview`), a collapsed audit
   disclosure (`data-testid="source-approval-audit-disclosure"`, summary
   `Intake audit trail · N turns`, body renders `IntakeChatTrail`), a collapsed routing
   disclosure ("Routing and audit details"), a footer with `Approve` as
   `disabled={!actionReady}`, a "Send to co-approver" secondary button, and an "Other
   decisions" `<details>` overflow containing Request changes / Reject. Blocker copy already
   surfaces in the approval brief's "Next required step" strip. Re-verify current line numbers
   before editing — they will have moved since this was written.
2. **The real gap in `SOURCE-APPROVAL-UX-002`**: the audit disclosure only renders
   `IntakeChatTrail` (intake conversation turns). It never queries or shows the
   `SOURCE-SHELL-003` approvals ledger or the `SOURCE-SHELL-004` artifact acceptances — both
   already have working, tested repository functions (`loadApprovalLedger()` in
   `src/lib/source/approval-ledger.ts`; `listArtifactAcceptances()` /
   `getLatestArtifactAcceptancesByArtifactIds()` in `src/lib/source/artifact-acceptances.ts`).
   Wire real data from these into the audit disclosure (or a clearly-labeled adjacent one, if
   mixing intake chat with governance history reads badly in the actual layout).
3. **The real gap in `SOURCE-APPROVAL-UX-003`**: the evidence disclosure shows a count but no
   freshness signal. Checked directly: `IntakeFact` (`IntakeFactsReview.tsx`) has NO timestamp
   field at all (`id`, `label`, `value`, `note?` only) — the five facts are built in
   `buildCapturedFacts()` (`src/app/(maestro)/source/events/[eventId]/approval/page.tsx`) from
   individual static columns on the event row (`trigger_description`, `decision_owner`, etc.),
   not from separately-timestamped fact records. **There is no real per-fact capture date
   anywhere in this data model.** The one real, honest timestamp available is
   `SourceEventRow.updated_at` (`src/lib/source/queries.ts`) — a single event-level
   last-updated time. Use that as the freshness signal for the whole evidence set (e.g.
   "updated 2 days ago"), and say so — do NOT fabricate a fake per-fact timestamp to make the
   UI look more granular than the data actually is. If a genuinely better source of per-fact
   freshness exists elsewhere that you find during investigation, use it and say so; otherwise
   the event-level `updated_at` is the correct, honest choice.
4. **`SOURCE-APPROVAL-UX-004` is a verification-first pass, not a build.** Check the real,
   deployed page against the 5 acceptance criteria in the recommendations doc's "Suggested
   acceptance criteria" section. Only make a targeted fix for a criterion that genuinely fails
   — e.g. if "Request changes" being inside the "Other decisions" overflow turns out to violate
   the "≤1 primary + 1 secondary action in the first viewport" criterion in practice, promote it
   to a visible secondary button. Do not rebuild the footer from scratch if it's already close.
5. Full context, dependencies, required tests, and standing execution authority (parallel work
   for `002`/`003`, merge/deploy/live-verify without pausing between slices, real stop
   conditions) are all spelled out in the backlog entries themselves — read
   `docs/backlog/source-product-backlog.md` `SOURCE-APPROVAL-UX-002` through `004` in full
   before starting; do not re-derive scope from this doc alone.

## Scope

**In scope**, per the corrected backlog entries:

- `002`: wire real approval-ledger + artifact-acceptance data into the audit disclosure (or an
  adjacent, clearly-labeled one), with an honest empty state.
- `003`: add an honest freshness signal to the evidence disclosure, backed by
  `SourceEventRow.updated_at` (or a genuinely better source you find and justify).
- `004`: verify the real deployed page against the 5 acceptance criteria; fix only what
  genuinely fails, with the smallest targeted change.

**Out of scope**:

- Do not rebuild the evidence/audit disclosures, the footer action bar, or the
  disabled-until-ready Approve behavior — they already exist and work.
- Do not touch the server-side gate contract (`approve`/`gate-decision`/`stage` routes) — this
  work is presentation and read-only data wiring only.
- Do not fabricate a per-fact freshness timestamp that doesn't exist in the real data model.

## Execution

- `002` and `003` are independent (different disclosures, no shared state) — run them as
  parallel work threads, not serially.
- Once each slice passes full local validation (typecheck, lint, tests, `release:check`),
  merge and deploy it without pausing to ask first — this is pre-approved standing authority
  for this workstream (recorded in the backlog entries themselves), matching how every
  `SOURCE-SHELL` item this session was handled.
- After deploying each slice, capture live signed-in proof, update the corresponding backlog
  entry's status honestly, and move to the next slice without stopping for confirmation.
- Real stop conditions (not this workflow's default): a database migration is needed, a change
  to existing approval permissions/payload semantics, or a validation failure that isn't a
  simple fix. Also stop and report if the freshness-signal investigation (`003`) turns up a
  genuinely different/better data source than `updated_at` — say what you found before
  proceeding, don't silently substitute.
- After `002` and `003` land, proceed to `004` (verification-first, fix only real failures).
- Update the backlog's "Ready / in progress" pointer once `004` closes — reflect real state,
  not aspirational completion, if any acceptance criterion doesn't fully pass.

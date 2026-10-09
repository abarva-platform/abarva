# 2026-10-10 — Moves public sources: final design (template v1.9)

## Release ID

`2026-10-10-moves-public-sources-design`

## Status

`candidate`

## Plain-English Summary

The public-sources review panel in a Move's Files & Evidence view is restyled
to the final step-page design (template v1.9, review 5). It previously used
its own hard-coded colours and showed only the sources still waiting for a
decision. It now uses the same canonical tokens, type and components as the
Moves step pages, works in light and dark, and shows every source the research
step stored for the Move.

- The section is titled "Public sources" and says, in one line, that these
  were found by research, are not facts about the client, can be cited only
  once approved, only as public sources and never as FACT.
- Sources are grouped: "To review" (open), "Approved · citable" and "Rejected"
  (both collapsed). Each shows publisher and title, the published and
  retrieved dates, the confidence in words (Low, Medium, High), the stored
  excerpt as a quiet quotation, a muted "Public source" tag with the claim it
  supports, and "Open source →" for an https address only (new tab, no opener,
  no referrer). A non-https address is not linked and the row says so.
- Approve… and Reject… open an inline confirm that says a source is decided
  once and cannot be changed later, with an optional note. Only then is the
  decision sent. A decided source shows its decision, date and note; an
  approved one also shows how to cite it, `[S:n]`.
- Every refusal shows the route's own sentence, word for word: inside the open
  confirm when the source is still pending, or at the head of the section
  when the server reports the source already decided (the list is then read
  again so the decision that stands is shown).
- A public source is never tagged FACT. Stored fields are rendered as text
  only.

The cite number is derived, not stored: approved sources are numbered in
approval order (by review time, ties by id). A decision is final, so a number
never changes once given; a later approval only appends. The derivation lives
in the shared review contract so a later citation step can number from the
same rule.

## Layer Impact

- Release lane: `client-data-lane` surface, feature-flagged (no data change).
- Canonical model: none. No migration, no route change, no new field.
- Products: Moves only. One panel restyled; the list read drops its
  `?decision=pending` filter so decided sources are shown in their groups.
- Shared UI: the step-page CSS module gains the v1.9 rules it was missing
  (`excerpt`, `reg-meta`, `form-grid`) plus a panel container and a colourless
  refusal box, all token-based. The step page's source tags gain a
  `public` kind ("Public source", muted). No existing rule changes.
- AI egress: none.

## Client Applicability

- All clients: no visible change unless enrolled in the flag.
- Specific clients: the synthetic demo tenant is enrolled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_public_source_research` (tenant policy). Off: the panel
  renders nothing and fetches nothing (unchanged).

## Changes Included

- `src/components/strategic-moves/PublicSourcesReviewPanel.tsx`: restyled to
  the v1.9 design with the step-page CSS module and `SourceLine`; three
  groups; inline decide-once confirm with optional note; cite label; refusal
  placement; list read of every decision.
- `src/lib/deliverables/public-research/review-contract.ts`:
  `publicSourceCiteNumbers` (the derived `[S:n]` numbering).
- `src/components/strategic-moves/step-page/MovesStepPage.tsx`: `public`
  source kind and tag.
- `src/components/strategic-moves/step-page/MovesStepPage.module.css`: the
  v1.9 public-source rules.
- `src/components/strategic-moves/__tests__/PublicSourcesReviewPanel.test.tsx`:
  rewritten for the new states. No new test file.

## QA / Validation

- Component suite: pass, 45 cases. They cover the flag off (nothing rendered
  or fetched), the "not facts about the client" line, the three groups with
  their default open state and order, the item's fields, confidence in words,
  unstated publisher, date and claim, stored markup rendered as text,
  https-only links with `target="_blank"` and `rel="noopener noreferrer"`,
  and the confirm (text, note, Cancel without a write, Approve/Reject button
  styles). They also cover approve and reject through the route with and
  without a note, the cite label after approval and in the status line, and
  re-reading the list when the decision response carries no usable row.
  Refusals are shown verbatim and placed by state; already-decided and race
  refusals re-read the standing decision; no-sentence, blank-sentence and
  network failures claim neither direction. Stale refusals and stale "recorded"
  lines are cleared, every control is withheld while a decision is in flight,
  there are no controls without authority, and a list failure is never shown
  as an empty queue. Two cases cover the cite numbering (approval order, ties,
  unstamped last, stable under list order, later approvals append).
- Affected suites (step page, public-research contract, repository, runner,
  brief, both public-source routes): pass, 11 suites, 262 cases.
- Mutation checks: pass. 67 mutants were applied one at a time and restored
  from a saved copy. 66 were killed and 1 was withdrawn. The first pass left
  five survivors:
  - a list refusal fixture whose sentence equalled the fallback (the fixture
    was changed);
  - a decision-vocabulary filter that was behaviour-neutral, because an unknown
    decision falls in no group (the filter was removed, so its mutant was
    withdrawn);
  - two stale-message resets with no case (cases were added);
  - a non-array list body (cases were added).
    A blank list sentence also survived until a case was added.
- Visual: pass. The real component was rendered to HTML with the module CSS at
  1440 and 390 px, in light and dark, in five states: default, all groups
  open, confirm with a note, after approval, and refusal. It was compared with
  the review-5 mock: the computed styles of every design element match, and
  there is no horizontal overflow at 390 px.
- `npm run typecheck`: pass (clean). ESLint on changed files: pass (no
  findings).
- `audit:lib-orphans`: pass (no change against the baseline).
  `check:export-reachability`: pass (exactly the baseline set).
- Test census (`audit:test-ci-coverage:check`): pass. No new test file, and
  the committed census matches.
- `docs:nexus-manual:check`: pass. `release:check`: pass.
- Live signed-in proof: not run (no deploy in this change).

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No migration and no flag
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: unchanged by this release (no worker code changed),
  but the worker must run the same digest as the web app.
- Feature/env flag update path: code registry (`includeTenants`); unchanged.
- Live signed-in proof required: sign in to the synthetic demo tenant, open a
  Move's Files & Evidence view, confirm the "Public sources" section renders
  in light and dark, approve one pending source through the confirm and see it
  move to "Approved · citable" with its `[S:n]`, and reject one with a note.

## Rollback Plan

Revert the pull request, or remove the tenant from `includeTenants` and deploy
through the main workflow (the panel then renders nothing). No data was
written by this change; recorded decisions stay valid either way.

## Audit Evidence

- Pull request and CI results.
- The component suite and mutation results above.
- Renders of the real component kept with the design review artefacts.

## Known Gaps

- The list projection carries no reviewer name (deliberately), so a decided
  source reads "Approved by you" only in the session that decided it and
  "Approved <date>" otherwise. The design shows the reviewer's name.
- The `[S:n]` number is derived in the panel from the list it reads (limit
  200 sources per Move). A deliverable that cites must number from the same
  rule over the full approved set; no deliverable cites a public source yet.
- A decision cannot be reversed (unchanged).

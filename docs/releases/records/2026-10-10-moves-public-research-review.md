# 2026-10-10 — Moves public-source research: review queue

## Release ID

`2026-10-10-moves-public-research-review`

## Status

`candidate`

## Plain-English Summary

This release ships the third of four changes that let a Moves deliverable
build look up PUBLIC outside sources (program rules, payment rules, published
studies) and cite them only after a consultant approves them. The first two
(storage contract and research step) are described in
`2026-10-10-moves-public-research-core.md` and
`2026-10-10-moves-public-research-step.md`. This one adds the review queue.

- A read route lists the outside sources stored for one Move, newest first,
  with decision, URL, title, publisher, published and retrieved dates, the
  stored excerpt (at most 300 characters), the claim and the confidence. It can
  be filtered to pending, approved or rejected. A failed read is reported as
  unknown, never as an empty list.
- A review route records one decision per source: approved or rejected, with
  an optional note of at most 500 characters. The authority is the same one
  the client-evidence review uses (gate-approval permission, and the Move must
  be inside the reviewer's program grants). The reviewer and the time are
  stamped on the row. A source that is already decided is refused with a
  sentence naming the decision that stands; nothing is overwritten. If two
  reviewers race, the second is told the first decision stands.
- Every refusal carries a sentence saying what did and did not land. Refusals
  before the write say no decision was recorded; the one failure that can land
  on either side of the write says it may or may not have been recorded and
  sends the reviewer to reload.
- The Move's Files & Evidence view gains a separate "Outside public sources"
  panel below the client's own evidence cabinet. It is labelled "Not facts
  about the client", lists pending sources with publisher, dates, excerpt and
  claim, links out to the page (https only, new tab, no opener, no referrer),
  and offers Approve and Reject with an optional note to an authorized user.
  Everyone else sees "Awaiting review by an authorized workspace user."
  Stored fields are rendered as text only; nothing of the fetched page beyond
  the stored excerpt is shown.
- One additive migration adds the nullable `review_note` column, bounded to
  1 to 500 characters and only allowed on a decided source.

Approval does not yet make a source citable in a deliverable; the citation and
validation rules are the fourth change.

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged.
- Canonical model: one additive column on `move_public_sources` (one
  re-runnable migration). No other table, column or policy changes.
- Products: Moves only. Two new tenant- and Move-fenced API routes and one new
  panel in the Files & Evidence view. The research step's writes are
  unchanged and do not read the new column.
- AI egress: none. This release makes no model call.

## Client Applicability

- All clients: no visible change unless enrolled in the flag.
- Specific clients: the synthetic demo tenant is enrolled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_public_source_research` (tenant policy), the same flag
  as the research step. When the flag is off both routes refuse with a
  sentence before reading the Move, and the panel renders nothing and fetches
  nothing.

## Changes Included

- `supabase/migrations/20261010140000_move_public_source_review_note.sql`
  (new): the `review_note` column and its two CHECKs.
- `src/lib/deliverables/public-research/repository.ts`: `listPublicSources`
  (all decisions or one), the reviewer's note on `decidePublicSource`, and
  `REVIEW_SOURCE_COLUMNS` (the review reads; the research step's writes keep
  `SOURCE_COLUMNS`).
- `src/lib/deliverables/public-research/types.ts`: `normalizeReviewNote`, the
  `reviewNote` field, and the flag constant (re-exported by the runner).
- `src/lib/deliverables/public-research/review-contract.ts` (new, pure): the
  list projection (no tenant, Move, run or reviewer ids are sent), the note
  limit, and the refusal sentences shared by the routes and the panel.
- `src/app/api/v1/programs/[programId]/public-sources/route.ts` (new, GET).
- `src/app/api/v1/programs/[programId]/public-sources/[sourceId]/review/route.ts`
  (new, POST).
- `src/components/strategic-moves/PublicSourcesReviewPanel.tsx` (new), mounted
  in `MovesPhaseStandaloneClient.tsx` under the Files & Evidence view; the
  phase page resolves the flag server-side.
- `src/lib/features/registry.ts`: the flag summary now describes the review
  queue. The generated manual is updated.
- `.github/workflows/ai-surface-control-catalog.yml`: the panel's suite is
  named in the Moves visible AI liability controls step, because its directory
  is not swept by any job.
- Generated: `docs/architecture/test-ci-coverage-census.json` and
  `docs/security/tenancy-fence-coverage.json`.
- Tests: one new route suite covering both routes, one new component suite,
  and new cases in the public-research repository and contract suites.

## QA / Validation

- Route suite (37 cases): flag off, unreadable Move (the cause-blind 404
  sentence), missing authority, program grants that exclude the Move, list
  filter for each decision, unknown filter, approve, reject, note stored and
  bounded, missing or unknown decision never read as an approval, already
  decided, a race between two reviewers, another tenant's source on the same
  Move id and a source on another Move (both 404 and unchanged), the tenant's
  canonical key, read failure, write failure, unexpected failure, and tenancy
  refusals. Both routes run the real repository against an in-memory store
  that applies its own filters.
- Component suite (20 cases): flag off renders and fetches nothing; pending
  sources render with the label, publisher, dates, excerpt and claim; links
  only to https with `target="_blank"` and `rel="noopener noreferrer"`; stored
  markup renders as text; approve and reject call the route (with the note);
  the route's sentence is shown; already-decided and race refusals stop
  offering the source; other refusals keep it; failures without a sentence
  claim neither direction; both buttons are withheld while one decision is in
  flight; no controls without authority; unreadable list is never shown as
  empty.
- Repository and contract suites: new cases for the list (fencing, order,
  limit, filters, failure, scope), the note (stored, trimmed, blank, bounded
  in characters), and the note migration's column and CHECKs.
- Mutation checks, applied one at a time and restored from an in-memory copy:
  68 mutations across both routes, the repository additions, the note
  validator, the refusal sentences and the panel; 68 killed. The first pass
  left two survivors, both fixed: the list route validated the filter itself
  and the repository validated it again, so removing the route's copy changed
  nothing (the route now relies on the repository's single check); and a list
  refusal arriving with no sentence had no case (one was added).
- `npm run typecheck`: pass. ESLint on changed files: no errors.
- `audit:lib-orphans`: no change against the baseline. Route reachability and
  export reachability: no new unreachable components or exports.
- Test census regenerated: two new test files, both swept (2,774 to 2,776).
  The route suite is collected by the broad `src/app/api/v1/programs` route
  sweep; the component suite is named in the liability step.
- Tenancy fence census regenerated. The two routes are classified `none`, as
  are sibling `programs/[programId]` routes that call `requireTenancy` through
  the area's `_auth` wrapper; the analyzer does not follow that import.
- `audit:ai-surface-controls`, `audit:ai-surface-control-cases` and
  `docs:nexus-manual:check`: pass.
- No live call and no database: the migration was not applied anywhere.

## Rollout Plan

Merge through the protected main branch after the research-step release.
Apply `20261010140000_move_public_source_review_note.sql` through the
client-data lane's governed migration path before the flag is used on an
environment (until then the list and review routes report that sources could
not be read, and nothing is recorded). The repo-owned ACA main deploy workflow
builds and deploys the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: unchanged by this release (no worker code changed),
  but the worker must run the same digest as the web app.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: after both migrations are applied and a
  flagged build has stored pending sources, sign in to the synthetic demo
  tenant, open a Move's Files & Evidence view, confirm the "Outside public
  sources" panel lists the pending sources with their excerpts and links,
  approve one and reject one, and read back both rows with decision, reviewer
  and time. Confirm a second decision on either is refused.

## Rollback Plan

Remove the tenant from `includeTenants` and deploy through the main workflow,
or revert through a pull request. With the flag off both routes refuse and the
panel renders nothing. The column is additive and nullable; recorded decisions
can stay. No source is cited by this release, so a rollback changes no
deliverable.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.
- Per decision in production: the `move_public_sources` row's decision,
  `reviewed_by_user_id`, `reviewed_at` and `review_note`.

## Known Gaps

- Approval does not yet make a source citable; the citation and validation
  rules are the fourth change.
- The panel lists pending sources only. Approved and rejected sources are
  available through the list route's filter but not yet shown on screen.
- A decision cannot be reversed. Re-deciding a source needs a later, reviewed
  change.
- The panel needs a design review (Claude Design) before the flag widens
  beyond the synthetic demo tenant; it follows the neighbouring evidence
  cabinet's styling.
- The tenancy fence census classifies both routes `none` because it does not
  follow the `_auth` wrapper import; the routes do call `requireTenancy`.

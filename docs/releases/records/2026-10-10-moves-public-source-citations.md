# 2026-10-10 — Moves approved public-source citations

## Release ID

`2026-10-10-moves-public-source-citations`

## Status

`candidate`

## Plain-English Summary

When the existing tenant flag is enabled, a Move document can cite a public web
source only after a consultant approves it for that Move. The generation feed
reads the approved set under the authenticated tenant and exact Move. A failed
read stops generation before a model call and says why. Approved excerpts enter
the prompt in a separate fenced block headed "OUTSIDE PUBLIC SOURCES — not facts
about the client" and are cited `[S:n]`, apart from client evidence `[n]` and
assumptions-register rows `[A:ID]`.

The quality gate blocks an unknown or unapproved `[S:n]`, a figure missing from
the cited excerpt or separately cited client evidence/register row, and an
outside figure used as a client baseline, saving, target or benefit without a
matching `[A:ID]`. Only cited approved sources appear in the final Sources
table with title, publisher, dates and plain-text URL. The approval-order
numbers match the Move review panel.

## Layer Impact

- Release lane: `experimental` — the capability is tenant-flagged and not the
  default for all clients.
- Layers 1 and 2: no change to intake or source adapters.
- Layer 3: read-only use of the existing Move-scoped public-source records. No
  migration, canonical promotion, or corpus activation.
- Layer 4: Moves generation, validation and document rendering. Public sources
  are prompt context for one Move; they do not become client facts. Other
  product projections do not read this feed.

## Client Applicability

- All clients: flag-off behavior remains byte-identical.
- Specific clients: the synthetic demo tenant is enrolled by the existing flag.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_public_source_research` (tenant policy).

## Changes Included

- A read-only generation feed for approved public sources, with a tenant and
  Move fence and an explicit read-failure result.
- The queued Move build and the orchestrated Move route carry the same
  approval-order `[S:n]` citations through their requests.
- The prompt separates outside excerpts from governed client evidence; figure
  lineage and the quality gate validate public citations and client use.
- HTML, DOCX, PDF, PPTX and XLSX render cited sources in a final Sources table
  or sheet. URLs render as text.
- The flag description and generated manual reflect this increment. No schema,
  route, corpus policy version or migration changes.

## QA / Validation

- Affected tests: pass, 75 suites and 1,089 tests covering orchestration,
  queued research, the Move feed, board input loading, validation and export.
- Flag-off byte identity: pass. The architect prompt and Move HTML output
  have the same SHA-256 digests as the branch's base commit for a flag-off
  fixture; the new request property is absent when the flag is off.
- Mutation probes: pass. Nine changes were killed by focused tests: unknown
  source, unsupported figure, client application, excerpt matching, quality
  gate integration, approval filter, Move fence, tenant fence and cited-only
  rendering. One explicit null-read guard survived because the following
  mapper throws on null and the same catch returns the same refusal; it is
  behavior-neutral.
- Export rendering: pass. Tests inspect cited-only HTML, DOCX, XLSX and PPTX
  output and confirm PDF creation. The real HTML render was inspected in
  Chromium at 1440 and 390 px under light and dark preferences. No document
  overflow appeared; the print-style white theme stays the same in both modes.
- `npm run typecheck`: pass, zero errors. Changed-file ESLint: pass.
- `npm run audit:lib-orphans`: pass, no new orphan. Route reachability and
  `npm run check:export-reachability`: pass, no new unreachable route/export.
- Test CI census: pass, test files 2,964 to 2,966 and workflow-covered files
  2,800 to 2,802 on the current main base, exactly the two new suites. Write
  and check both passed.
- Tenancy fence census: write and check passed, no changed API route.
- `npm run docs:nexus-manual` and `:check`: pass.
- `npm run release:check`: pass, all 11 gates.
- Live signed-in proof: not run; this candidate was not deployed.

## Rollout Plan

Squash merge through the protected main branch after review. The repository's
ACA main deploy workflow builds and deploys the approved digest-pinned image.
The existing tenant flag controls enrollment. No database operation or manual
runtime change is part of this release. Verify the web and worker images and a
signed-in Move build before describing the change as live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow after merge.
- ACA runtime invariant: verify the serving revision and web template match
  the approved digest.
- Worker image invariant: verify the deliverable worker uses that digest.
- Feature/env flag update path: existing code registry enrollment, unchanged.
- Live signed-in proof required: an approved source cited in a Move document,
  an uncited approved source excluded from Sources, and an invalid citation
  refused, all under the authenticated tenant.

## Rollback Plan

Revert the PR through the protected branch, or remove enrollment from the
tenant flag through a controlled release. No schema or stored source decision
is changed here.

## Audit Evidence

The PR diff, focused test output, mutation results, test census and local check
results. Deployment and signed-in proof are separate follow-up evidence.

## Known Gaps

- Excerpt figure matching is deterministic. It checks exact values and
  citation scope; it does not prove that a rewritten sentence preserves the
  source's full meaning. Human review remains required.
- The approved-source repository read has a 200-row limit shared with the
  review surface. A Move with more approved rows needs pagination before all
  approvals can be numbered and cited reliably.
- Local tests do not prove that the existing storage migrations are applied or
  that signed-in production generation succeeds. A missing or failed read
  refuses generation under this flag.

# Programs / Strategic Moves E2E Fix Log

Date: 2026-05-02  
Environment: `https://app.abarva.ai` production  
Purpose: Record every fix made during the Programs E2E crawl-and-rerun loop.

## Fix 1 — Discovery Gate Hard Gaps

Failure:

P1 Discovery could advance even when hard gaps remained in baseline/sponsor evidence.

Root cause:

Governance evaluation and report language did not block hard discovery gaps strongly enough.

Fix:

PR #1419 `fix(programs): block discovery gates with hard gaps`.

Merge SHA:

`fc41bf8ce22184dac3fc9a38ca142a7178869cf4`

Verification:

Apex rerun blocked P1 advancement until baseline/owner attestation was uploaded, then advanced after evidence was captured.

## Fix 2 — Completed Lifecycle Rendering

Failure:

Completed programs could still render as active/unclear in list/detail surfaces.

Fix:

PR #1421 `fix(programs): render completed lifecycle state`.

Merge SHA:

`6762e87bc30a808284129e67d6968f5d0d4ded8b`

Verification:

Completed Apex and First Capital records show completed/final phase state. Active counts no longer treat completed programs as active in the tested state.

## Fix 3 — Sectioned Evidence Parsing

Failure:

Uploaded notes with headings like Decisions/Actions/Risks did not reliably populate structured evidence arrays.

Fix:

PR #1422 `fix(programs): parse sectioned evidence notes`.

Merge SHA:

`9755c803aa5292a92e7538504f10f1554ed1fc55`

Verification:

Later First Capital uploads produced structured `decisions`, `action_items`, `risks`, and `attendees` in `program_evidence_items.extracted_structured`.

## Fix 4 — Natural Heading Evidence Parsing

Failure:

Notes using natural headings like sponsor decision, attested metrics, risks did not parse well.

Fix:

PR #1424 `fix(programs): parse natural evidence headings`.

Merge SHA:

`22be97aa71d15e76a3aa7c5976d81d5856c9537d`

Verification:

First Capital P1 baseline attestation parsed baseline candidates including `21 business days`, `62%`, `47 minutes`, and `14%` with source IDs.

## Fix 5 — Canonical P2 Deliverable Keys

Failure:

Nexus attempted to save P2 options memo and facilitator guide using type keys not accepted by the tool registry, causing semantic fallback to unrelated keys.

Fix:

PR #1425 `fix(programs): add canonical P2 deliverable keys`.

Merge SHA:

`7f1eb13b3bb261781f63ee5be363506031d4e037`

Verification:

Tool registry now accepts canonical keys for future runs. Current Apex/First Capital historical rows remain mismatched because they were generated before the fix.

## Fix 6 — Baseline Fidelity Doctrine

Failure:

First Capital P3 generated artifacts replaced uploaded evidence with unsupported inferred values and stack/tool assumptions.

Root cause:

Agent prompt did not explicitly require deliverables to preserve exact uploaded/signed operational baseline values and reject inferred benchmark/demo numbers.

Fix:

PR #1428 `fix(programs): preserve baseline evidence in deliverables`.

Merge SHA:

`1d8bc0fe78789bea37242cbdde643a4e25b3b2ac`

Changed files:

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts`

Validation before merge:

- Focused Jest passed.
- ESLint passed.
- GitHub checks passed.
- Vercel production deployments completed.

Live verification:

- First Capital P3 design spec and traceability matrix regenerated through live Nexus UI.
- Latest signed DB versions include exact uploaded values: `21 business days`, `62%`, `47 minutes`, `14%`.
- Latest signed DB versions no longer include unsupported `4.2`, `2.5`, or unsupported stack/tool names.

## Runtime Artifact Cleanup — First Capital P6 Tower Contract

Failure:

The P6 Tower contract initially used shorthand `21 bd` and `47 min`, then a hygiene note accidentally restated those shorthand strings.

Fix:

Live Nexus artifact regeneration, no code change.

Verification:

Latest signed `tower_handoff_plan`, version 4, title `Tower Execution Tracking Contract v3`, contains:

- `21 business days`
- `62%`
- `47 minutes`
- `14%`

And contains no standalone `bd` or `min` shorthand matches in the saved DB artifact.

## Residual Fix Backlog

| Gap | Severity | Proposed fix |
| --- | --- | --- |
| `scan_status=pending` after successful text parsing | Medium | Add explicit parsed/evidence-extracted status or separate file scan state from parsing state |
| P0 seed package semantic key mismatch | Medium | Add canonical `origination_brief` type and update tool descriptions/gates |
| Historical P2 type-key mismatch | Low/Medium | Optional data cleanup migration for demo rows generated before PR #1425 |
| Right rail stale/noisy state | Medium | Make right rail read current DB-backed phase receipts and signed artifact summaries |
| Tower narrow/mobile hierarchy | Medium | Redesign Tower around pressure cards and handoff observability; avoid burying handoff list below Atlas panel |
| First Capital `arcturus` alias | Medium | Canonicalize display alias or document key/display mapping in tenant registry |
| PDF/Office parsing unproven | Medium | Add parser pipeline smoke for PDF/DOCX/XLSX uploads and evidence-ledger writes |

## Cosmetic / Vision Package Status

The uploaded canonical vision package was reviewed. The Programs brief says to finish functional QA before cosmetic updates.

No cosmetic/Atrium code changes were made in this fix loop.

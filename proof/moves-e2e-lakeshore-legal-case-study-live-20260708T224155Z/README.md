# Moves E2E Lakeshore Legal Case Study Live Proof

Run timestamp: 2026-07-08T22:41:55Z

Target: Lakeshore Holdings Move `RETAIL-LEGAL-2026` / `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`.

Source pack: `/Users/anand/Downloads/lakeshore-legal-contract-intake-cxo-demo-2026-07-05.zip`.

Evidence boundary: this pack is realistic synthetic, planning-grade case-study data. This proof does not claim actual Lakeshore production data, realized ROI, board-grade hard savings, or enterprise-context promotion.

## Method

- Used the signed-in Chrome session by decrypting local Chrome Clerk cookies into a Playwright browser context; cookie values are not stored in this proof folder.
- Used the live production host `https://app.abarva.ai`.
- Used the same multipart endpoint as the phase workspace inline uploader: `POST /api/programs/workspace/:moveId/upload`.
- Verified persistence through the actual workspace read path: `GET /api/programs/:moveId/attachments`.
- Re-ran golden questions from inside the authenticated app page using same-origin `fetch(..., credentials: "include")`.

## Upload Results

All uploads returned HTTP 200, created attachment rows, and returned captured evidence IDs.

| File | Phase | Evidence ID | Route classification |
| --- | ---: | --- | --- |
| `01_lakeshore_context_spine.csv` | 2 | `e1aab759-9135-415b-98ef-e39702648685` | cycle-time baseline / volume trend / metric confidence |
| `02_legal_contract_intake_operational_baseline.csv` | 2 | `fa4b8584-2c37-41da-a109-209be90e75b8` | request volume / queue aging / bottleneck signals |
| `04_delivery_scenarios.csv` | 3 | `1b86ab85-1b9e-49e7-bf83-58d73d28c7d6` | human and AI work split / approval controls / risk guardrails |
| `03_estimation_rate_card.csv` | 4 | `65265f3f-ea17-4fd7-ba1e-5081aca67cfe` | value assumptions / finance caveats / baseline and target signals |
| `05_value_model_assumptions.csv` | 4 | `0ad85635-24a8-41b8-b98a-1bfbea7d5a25` | value assumptions / finance caveats / baseline and target signals |

## Persistence

Pass: all five files were visible after upload through `GET /api/programs/:moveId/attachments`, with tenant-scoped storage paths under `lakeshore-holdings/...`.

The phase page reload also reflected the change: P2 showed `4 of 4 in` and `100%`, with uploaded file titles visible in the page text capture.

Note: the File Cabinet `move_artifacts` API did not show these files. That is expected for this workspace-upload lane: it writes `program_attachments` plus `program_evidence_items`, not `move_artifacts`.

## Golden Scorecard

Actual CSV contains 10 questions, not 11 as the prompt text says.

| Question | Surface | Result | Notes |
| --- | --- | --- | --- |
| Q-001 | Home | Pass | Preserved Lakeshore holdco context and non-production boundary. |
| Q-002 | Home | Fail | Did not enumerate the loaded case-study metrics: 2,400 requests, 780 queue items, 860 status inquiries, missing fields, policy exceptions. |
| Q-003 | Intelligence | Fail | Treated the question as truncated and did not rank legal intake as the strong first-move opportunity. |
| Q-004 | Intelligence | Pass | Preserved assisted-AI posture and human legal judgment boundary. |
| Q-005 | Intelligence | Pass | Preserved the corrected root cause rather than blaming attorneys as primary bottleneck. |
| Q-006 | Moves | Fail | Returned generic sourcing-pattern anchors instead of creating the Legal Contract Intake transformation plan around Option B, finance caveats, and human legal approval. |
| Q-007 | Moves | Fail | Returned unrelated pattern anchors instead of the requested CLM/workflow, ServiceNow/mailbox/Coupa, privilege-fenced architecture. |
| Q-008 | Moves | Fail | Did not provide the required rate-card comparison: Scenario B 950K-1.45M, Big 4 1.8M-2.8M, offshore-heavy 620K-980K. |
| Q-009 | Tower | Pass | Preserved Tower measurement posture and hard-savings caveat. |
| Q-010 | Tower | Fail | Correctly avoided hard savings, but missed required rework reduction, status-inquiry deflection, and planning cost range framing. |

## Defects / Follow-Ups

1. Product-truth / retrieval gap: Home Q-002 did not retrieve the newly uploaded case-study baseline metrics.
2. Intelligence answer routing gap: Q-003 interpreted a complete question as truncated and answered a generic shared-services prompt.
3. Moves aVa grounding gap: Q-006 through Q-008 ignored the Move-specific uploaded files and returned unrelated sourcing/pattern anchors.
4. Tower value framing gap: Q-010 stayed honest about hard savings but missed required planning-value and rework/status-inquiry detail.
5. Board business-case route returned HTTP 200, but simple text checks did not find planning caveat, cycle-time language, or source-row dollar traceability. Treat as not live-proven for the requested P4 claim-trace test.
6. Browser telemetry recorded four React hydration errors (`Minified React error #418`) during phase page loads. No 4xx/5xx network responses were captured in the Playwright page telemetry.

## Remediation Candidate

Local candidate fix on 2026-07-08:

- `src/lib/programs/nexus.ts` now carries `program_evidence_items` into `ProgramContextBundle`.
- `src/lib/programs/nexus-free-text.ts` returns a `client_fact` evidence-ledger source, includes evidence in Claude/canonical query context, runs composer output through the product-truth gate using the same evidence grounding, and uses a generic evidence-snippet fallback that copies relevant uploaded evidence lines while rejecting unsupported numeric claims.
- `src/__tests__/integration/programs-nexus-free-text.test.ts` adds regression coverage proving the fallback does not emit hardcoded rate-card figures, canonical query terms use uploaded evidence values, the same Moves-style prompts reflect a different Move's different uploaded numbers, and `checkTenantEvidenceClaims` passes against the same turn's grounding text.

Validation:

- Pass: `npx jest src/__tests__/integration/programs-nexus-free-text.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/nexus.ts src/lib/programs/nexus-free-text.ts src/__tests__/integration/programs-nexus-free-text.test.ts`
- Pass: `rg -n "Lakeshore|lakeshore|legal|\$[0-9]" src/lib/programs/nexus-free-text.ts || true` returned no matches.
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

Status boundary: this is code-validated locally. It is not yet merged, deployed through the ACA main workflow, or live browser-proven on `https://app.abarva.ai`. The deterministic fallback extracts snippets from parsed evidence text, not structured CSV rows; live acceptance still requires the composer to answer from uploaded evidence text and pass the tenant evidence-claim guard.

## Evidence Files

- Full run JSON: `api/run-result.json`
- Corrected browser scorecard: `api/golden-browser-run.json`
- Upload/source manifest: `api/manifest.json`
- Screenshots: `screenshots/`
- Page and answer text captures: `text/`

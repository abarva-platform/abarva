# Nexus Moves Adaptive E2E Smoke Kit

Synthetic, offline-only evidence for a complete Strategic Moves journey. It contains no real member records, PHI, client attestations, or live vendor terms. Nothing is uploaded or promoted automatically.

## Included

- A member-service agent-assist case with a 45-minute operations workshop, privacy follow-up, KPI source data, system and knowledge inventories, data-quality issues, conflicts, and explicit red lines.
- A technical-only reporting counterfactual proving that the requested depth can adapt rather than forcing full process or operating-model design.
- P3 solution choices and bounded architecture/workflow detail sufficient to estimate, not detailed execution design.
- P4 internal-versus-vendor estimates with transparent arithmetic and separately stated Claude Code/Codex acceleration assumptions.
- P5 mobilization and Tower handoff materials. Strategic Moves ends at mobilization; execution is downstream.
- QA-only red-line canaries, conflict tests, and human revision instructions. QA-only files are not upload evidence.

The primary scenario's exact 14-file allowlist is `00_demo/upload_manifest.json`. P3-P5 files are synthetic reference outputs for review, not source evidence; the product must generate its own governed versions. Alternate-route inputs are separate and must be tested on a separate disposable Move.

## Safety

The package is offline and not agent-ready. Use the tenant identity established by the signed-in product; never infer it from filenames. Upload individual files only after a human selects a disposable synthetic Move. Keep evidence pending until a human reviews extracted facts.

## Suggested smoke flow

1. Use a disposable synthetic Move. Enter P0 from 00_demo/P0_intake.md.
2. Upload P1 files as uploaded_evidence; review and approve/correct the extracted facts.
3. Upload only the files in `00_demo/upload_manifest.json`. Upload P2 source files as uploaded_evidence and workshop/session files as session_artifact. Verify evidence IDs, review IDs, extraction receipts, source locators and reviewer decisions.
4. Validate the solution route with an accountable human. The main case should select a bounded process-change/agent-assist path; the reporting counterfactual should select technical_product; unresolved evidence must hold.
5. Generate phase artifacts in the product. Never upload QA expected outputs as source evidence.
6. Apply the QA review instructions to the product-generated P3 v1, save as v2, and approve that exact version. Confirm downstream context uses v2. A later unapproved revision must invalidate v2 approval for current readiness.
7. Complete P3, P4 and P5 using the phase-specific inputs. P3 is estimate-ready future-state strategy, P4 is roadmap/business case, P5 is mobilization/handoff, not project execution.
8. Run 90_QA_ONLY/SMOKE_TEST.md and record proof in 90_QA_ONLY/RESULTS_TEMPLATE.csv.

## Upload mapping

Use session_artifact for workshop/session records and uploaded_evidence for structured source evidence. QA-only files are local test oracles and must not be uploaded as evidence. Do not upload the zip; upload individual files.

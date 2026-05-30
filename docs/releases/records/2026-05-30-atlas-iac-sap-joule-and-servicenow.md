# 2026-05-30 · Atlas IAC — SAP Joule + ServiceNow Now Assist archetypes

## Release ID
`2026-05-30-atlas-iac-sap-joule-and-servicenow`

## Status
candidate

## Plain-English Summary
The Initiative-Archetype Corpus (IAC) shipped its foundation in PR #2570 with two reference archetypes (GitHub Copilot, Claude Code) in the `ai-coding` category. This Wave 2 slice extends the corpus into two new categories so Atlas can answer CIO questions about industry trends in AI ERP and AI ITSM initiatives:

- **SAP Joule** (`ai-erp`) — SAP's generative-AI copilot embedded across S/4HANA Cloud, SuccessFactors, Ariba, SAP Build, and BTP, with the "Joule Agents" framework introduced at SAP TechEd 2024.
- **ServiceNow Now Assist** (`ai-itsm`) — ServiceNow's generative-AI portfolio across the Now Platform (ITSM, CSM, HRSD, Creator), with the "AI Agents on the Now Platform" announcement at Knowledge 2024 and continued Pro Plus ACV disclosures on quarterly earnings.

Honesty discipline mirrors the foundation slice: every figure is a labelled planning range with cohort, sample size, source, and date; banned phrases ("industry standard", "everyone is doing", "best practice") are absent. Where SAP relies on forward-looking vendor projections rather than disclosed adoption telemetry, those claims sit under `whatNext` / `trendDirection`, not `adoptionMetrics`. ServiceNow's adoption metrics use real CFO / CEO earnings-call disclosures (Q3 2024 Pro Plus uplift, Q4 2024 deal counts and net-new ACV).

## Layer Impact
- `runtime-app-lane`: none. Atlas runtime composition is Wave 3's lane — that PR will wire `findArchetypeByLooseMatch` / `getArchetype` into prompt assembly. This slice is corpus-only.
- `architecture-lane`: appends two `InitiativeArchetype` entries to the existing `src/lib/atlas/iac/` registry. No schema or contract changes.
- `qa-validation-lane`: one new test file (`archetype-content-sap-joule-and-servicenow.test.ts`) locks the content floor for the two new entries. The existing `honesty-invariants.test.ts` and `registry.test.ts` automatically extend to cover them because they iterate `INITIATIVE_ARCHETYPES`.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — the IAC powers cross-industry context Atlas surfaces to every tenant.
- Specific clients: none preferentially. (Apex Retail and Meridian Health both have SAP and ServiceNow footprint in their seeded inventories, so both will eventually benefit from Atlas references to these archetypes.)
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/iac/archetypes/sap-joule.ts` — new. 4 adoption metrics, 4 deployment patterns, 4 pitfalls, 4 emerging patterns, 5 evidence anchors. `trendDirection: 'emerging'`. Category `ai-erp`.
- `src/lib/atlas/iac/archetypes/servicenow-now-assist.ts` — new. 4 adoption metrics, 4 deployment patterns, 4 pitfalls, 4 emerging patterns, 5 evidence anchors. `trendDirection: 'mainstream-scaling'`. Category `ai-itsm`.
- `src/lib/atlas/iac/registry.ts` — appended `sapJouleArchetype` and `servicenowNowAssistArchetype` in alphabetical order (`claude_code`, `github_copilot`, `sap_joule`, `servicenow_now_assist`).
- `src/lib/atlas/iac/__tests__/archetype-content-sap-joule-and-servicenow.test.ts` — new. Content-floor tests: ≥2 deployment patterns, ≥2 pitfalls, ≥2 whatNext, ≥3 evidence anchors per archetype.

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest src/lib/atlas/iac` passing — honesty invariants, registry uniqueness + retrieval, foundation content-floor, and new Wave 2 content-floor all green.
- Honesty invariants automatically extended to the two new archetypes via the `it.each(INITIATIVE_ARCHETYPES…)` shape of the existing test file.

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main. No runtime behavior changes — the IAC has no consumers until Wave 3 wires Atlas composition.
- Sibling Wave 2 archetype slices (Cursor + AI product dev, Workday + Oracle ERP, Salesforce Einstein + Microsoft 365 Copilot) land in parallel; merge conflicts on `registry.ts` resolved by union (alphabetical append).
- Wave 3 wires `findArchetypeByLooseMatch` / `getArchetype` into Atlas prompt assembly behind the existing Atlas tenant-correctness guardrails.

## Rollback Plan
- Revert this PR. Removes the two archetype files, the content-floor test, and the four-line registry append. No other code paths depend on these entries yet, so revert is safe and has no behavior impact.

## Audit Evidence
- All citations resolve to real, dated, verifiable publications:
  - SAP Q4 and FY 2024 earnings press release (January 2025) — sized cloud backlog (EUR 15.2B) and FY24 cloud revenue (EUR 17.1B) as the Joule-eligible population.
  - SAP Sapphire 2024 keynote (Christian Klein, June 2024) — Joule positioning across RISE / GROW with SAP.
  - SAP TechEd 2024 (October 2024) — Joule Agents and AI Units announcements.
  - SAP news releases — Joule for Consultants (October 2024), SAP–Microsoft Joule + 365 Copilot interoperability (May 2024), SAP Build Code (January 2024).
  - ServiceNow Q4 2023 earnings call (Bill McDermott, January 2024) — "largest new-product launch in company history" framing for Now Assist.
  - ServiceNow Q3 2024 earnings call (October 2024) — Pro Plus deals approximately 30% larger than Pro.
  - ServiceNow Q4 2024 earnings call (Gina Mastantuono, January 2025) — approximately 150 GenAI deals closed in the quarter; Now Assist net-new ACV growth approximately 150% QoQ.
  - ServiceNow Knowledge 2024 keynote (May 2024) — AI Agents on the Now Platform, Workflow Data Fabric.
  - ServiceNow Now Platform release notes — Vancouver (September 2023) GA and Washington DC (March 2024) Now Assist for Creator.
- Honesty discipline mirrors PR #2570 and the Atlas P0 audit closure (PR #2562). Forward-looking SAP productivity projections from Sapphire keynotes are deliberately not used as `adoptionMetrics`; they appear only under `trendDirection` / `whatNext` so consumers can distinguish vendor promises from realized outcomes.

## Sources considered but dropped for honesty reasons
- **SAP keynote productivity-uplift slides** ("Joule delivers X% productivity lift across the workforce"). Forward-looking vendor projections without a measured cohort, sample size, or methodology disclosure. Carried only as `whatNext` directional signal, not as `adoptionMetrics`.
- **Third-party analyst pieces estimating SAP Joule customer counts.** Sources were not first-party SAP disclosures; figures could not be verified against an audited release.
- **ServiceNow "thousands of customers using Now Assist" framing** in marketing collateral. The earnings-call disclosures (specific Q4 2024 deal counts and Pro Plus uplift percentages) are higher-quality first-party numbers, so the marketing aggregate is omitted to avoid double-counting.

## Known Gaps
- Both archetypes will benefit from a refresh once SAP Q1 / Q2 FY25 earnings transcripts disclose any realized Joule adoption telemetry (vs. the current forward-looking framing). Re-verify at next quarterly close.
- ServiceNow continues to extend Now Assist with quarterly Now Platform releases (Yokohama and beyond). The `lastReviewed` field should be refreshed after each release.
- `Routes and disclaimers` integrity check may still report pre-existing main breakage unrelated to this PR. Same precedent as recent Atlas PRs — that gate is admin-mergeable when it is the only remaining failure.

# 2026-05-30 · Atlas IAC — Salesforce Einstein/Agentforce + Microsoft 365 Copilot archetypes

## Release ID
`2026-05-30-atlas-iac-salesforce-and-m365`

## Status
candidate

## Plain-English Summary
Atlas's Initiative-Archetype Corpus (IAC) shipped its foundation in PR #2570 with two reference entries (GitHub Copilot, Claude Code). This Wave 2 sibling slice adds two more curated, sourced archetypes that CIOs ask about most often when sizing their AI portfolios: Microsoft 365 Copilot (AI-productivity) and Salesforce Einstein + Agentforce (AI-CRM).

Both archetypes ship the richest published data in the corpus so far — Microsoft and LinkedIn's Work Trend Index reports cover 31,000 knowledge workers across 31 countries; Salesforce discloses Agentforce paid-deal counts on every quarterly earnings call and named launch customers (Wiley, OpenTable, Saks, ADP, Bombora, FedEx, RBC Wealth Management) in its newsroom; Microsoft FY24/FY25 earnings disclose Copilot adoption signals. The Forrester TEI commissioned by Microsoft is included but explicitly labelled "Forrester TEI commissioned by Microsoft" per the honesty contract so consumers see the vendor-commissioned status.

## Layer Impact
- `runtime-app-lane`: none today. Atlas runtime composition (Wave 3) will read these entries via the existing `findArchetypeByLooseMatch` / `getArchetype` retrieval API.
- `architecture-lane`: two new entries appended to `INITIATIVE_ARCHETYPES` in the registry, alphabetically by `archetypeKey`. No schema or retrieval changes — the registry is intentionally append-only.
- `qa-validation-lane`: one new test file (10 cases) — the Wave 2 content floor for both archetypes. The existing honesty-invariants and registry tests automatically cover the new entries because they iterate `INITIATIVE_ARCHETYPES`.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — IAC powers cross-industry context Atlas surfaces to every tenant. Each tenant still consents to whether and how it shows up; the corpus is industry context, not tenant data.
- Specific clients: none preferentially. CIO conversations about Salesforce AI and Microsoft 365 Copilot are universally requested across the demo roster (Apex Retail, Meridian Health, First Capital).
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/iac/archetypes/microsoft-365-copilot.ts` — new. 8 adoption metrics, 5 deployment patterns, 4 pitfalls, 4 emerging patterns, 6 evidence anchors. Category `ai-productivity`, trend `mainstream-scaling`.
- `src/lib/atlas/iac/archetypes/salesforce-einstein-agentforce.ts` — new. 6 adoption metrics, 5 deployment patterns, 4 pitfalls, 4 emerging patterns, 6 evidence anchors. Category `ai-crm`, trend `mainstream-scaling`.
- `src/lib/atlas/iac/registry.ts` — append both archetypes alphabetically. Result: `claudeCodeArchetype`, `githubCopilotArchetype`, `microsoft365CopilotArchetype`, `salesforceEinsteinAgentforceArchetype`.
- `src/lib/atlas/iac/__tests__/archetype-content-salesforce-and-m365.test.ts` — new. Wave 2 content floor mirroring the reference floor: ≥4 metrics, ≥3 patterns, ≥3 pitfalls, ≥3 whatNext, ≥4 evidence anchors per archetype, plus category and trend-direction assertions.

## QA / Validation
- `npx tsc --noEmit` — clean for the IAC tree. (Pre-existing parser errors exist in untracked seed scripts under `src/scripts/seed/seed-airline-domXX-*.ts` and `seed-healthcare-domXX-*.ts`; those files are not part of this slice and are not in the registry import graph.)
- `npx jest src/lib/atlas/iac` — 4/4 test suites, 72/72 tests passing (foundation suites pick up the new archetypes via the registry iteration; the new content-floor suite contributes 10 cases).
- Honesty invariants enforced: every figure is a labelled `planning-range` with cohort + sampleSize + source + `YYYY-MM` (or `YYYY-MM-DD`) date; every evidence anchor has source + date; banned phrases (`industry standard`, `everyone is doing`, `best practice`) absent from archetype copy; `lastReviewed: '2026-05-30'`.

## Source Discipline Notes
- **Forrester TEI** numbers for Microsoft 365 Copilot are included but every `source` string reads "Forrester TEI commissioned by Microsoft — …" so consumers see the vendor-commissioned status. A dedicated `commonPitfall` entry (`tei-roi-numbers-are-vendor-commissioned`) explicitly tells operators not to use the ROI as an independent industry benchmark.
- **Salesforce Q3 FY25 Agentforce pipeline figure** is included as "200 paid deals plus a substantially larger pipeline (specific pipeline number not disclosed on the call)" rather than fabricating a pipeline number Salesforce did not disclose.
- **Salesforce Q2 FY25 Agentforce deal count** was not separately disclosed by Salesforce on the August 28, 2024 call beyond launch-momentum commentary; we cite the Q3 disclosure where the deal count is concrete.
- **No "developer paid seat" growth percentages** were claimed for either product beyond what Microsoft and Salesforce have stated publicly. Microsoft has spoken about Copilot growth qualitatively on earnings without consistently disclosing a single seat count quarter-over-quarter; we therefore omit a single bare growth number and lean on the Work Trend Index for adoption magnitude instead.
- **No Gartner / IDC numbers** are included — they were considered for adoption context but their publications require paywalled-source verification we cannot complete in this slice; omitted per the honesty contract rather than cited without verification.

## Rollout Plan
- Merge this PR to main once required gates are green.
- Vercel auto-deploys main. No runtime behavior changes — these archetypes have no consumers until Wave 3 wires Atlas composition.
- Future Wave 2 siblings (Cursor + AI-led product dev, Workday + Oracle ERP, SAP Joule + ServiceNow) append their archetypes the same way.

## Rollback Plan
- Revert this PR. Removes both archetype files, the registry imports, and the content-floor test file. No other code paths depend on the new entries yet, so revert is safe and has no behavior impact.

## Audit Evidence
- Microsoft 365 Copilot citations resolve to: Microsoft and LinkedIn Work Trend Index 2024 (31,000-person, 31-country survey); WTI Special Report on Copilot's earliest users (2023-11); Microsoft Q4 FY24 earnings remarks (Satya Nadella on Copilot adoption); Microsoft 365 Copilot Wave 2 announcement (Jared Spataro, 2024-09); Microsoft Ignite 2024 autonomous-agents announcement; Microsoft Build 2024 Team Copilot announcement; Copilot Dashboard and SharePoint Advanced Management product docs; Forrester TEI commissioned by Microsoft (explicitly labelled).
- Salesforce Einstein + Agentforce citations resolve to: Salesforce Newsroom Agentforce launch press release (Dreamforce 2024, USD 2 per conversation pricing, named launch customers); Salesforce Q3 FY25 earnings call (December 3, 2024, 200 paid Agentforce deals disclosure); Salesforce Q2 FY25 earnings call (August 28, 2024, Data Cloud + Agentforce framing); Salesforce Newsroom Agentforce 2.0 announcement (December 17, 2024, Atlas Reasoning Engine, Agentforce in Slack); Salesforce Newsroom Einstein Copilot GA; Salesforce State of the Connected Customer 6th edition (14,300 respondents, 25 countries); Salesforce State of Sales 6th edition (5,500 respondents, 27 countries); Salesforce Architects and Trailhead implementation guidance.
- Honesty discipline mirrors the Atlas P0 audit closure (PR #2562) and the IAC foundation (PR #2570): banned-phrase guard, planning-range tag on every figure, source-and-date requirement on every evidence anchor.

## Known Gaps
- Sibling Wave 2 archetypes (Cursor, Workday, Oracle, SAP Joule, ServiceNow) land in parallel slices; this PR merges via union append and will resolve any registry-level merge conflicts trivially because the registry array is alphabetical.
- `Routes and disclaimers` integrity check may still report pre-existing main breakage unrelated to this PR — same precedent as recent Atlas PRs, admin-mergeable when it is the only remaining failure.

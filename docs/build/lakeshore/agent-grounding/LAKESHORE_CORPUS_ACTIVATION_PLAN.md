# Lakeshore Corpus Activation and Agent Grounding Plan

Generated: 2026-06-04T03:50:05.141Z

This is not model fine-tuning. It is the governed context/corpus activation contract that tells AbarVa agents what evidence they may use, how to label provenance, and what they must not overclaim.

## CXO Logins

| Email | Persona | Title | Required metadata |
|---|---|---|---|
| cio@lakeshore-holdings.example.com | Meera Rao | Global Chief Information Officer | clientId=lakeshore; tenantKey=lakeshore-holdings; role=maestro |
| cfo@lakeshore-holdings.example.com | Daniel Whitaker | Chief Financial Officer and Treasury Sponsor | clientId=lakeshore; tenantKey=lakeshore-holdings; role=maestro |

## Corpus Sources

| ID | Label | Status | Path | Provenance rule |
|---|---|---|---|---|
| lakeshore-loaded-tenant-bundle | Lakeshore loaded tenant bundle | Available | docs/build/lakeshore/loaded/manifest.json | Use as tenant-specific truth only after the governed load ledger shows parsed/committed rows for Lakeshore. |
| lakeshore-governed-load-ledger | Lakeshore governed load rehearsal ledger | Pending (PR #2997 - governed load rehearsal) | docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-dry-run-latest.json | Use to explain loader readiness; do not treat dry-run chunks as committed live tenant evidence. |
| finance-cfo-ai-pattern-pack | Lakeshore CFO and finance AI activation supplement | Available | docs/build/lakeshore/agent-grounding/LAKESHORE_FINANCE_CFO_AGENT_PACK_2026-06-04.md | Use as reusable pattern guidance; tenant-specific answers must cite loaded Lakeshore finance rows or say the tenant data is not committed yet. |
| kyriba-success-platform | Lakeshore Kyriba rollout success activation supplement | Available | docs/build/lakeshore/agent-grounding/LAKESHORE_KYRIBA_SUCCESS_AGENT_PACK_2026-06-04.md | Use for Kyriba rollout reasoning only with explicit distinction between playbook pattern and Lakeshore contract/program evidence. |
| moves-rate-card-engine | Moves rate-card ingestion and estimate engine | Available | docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md | Use for planning-range estimates; never present researched benchmark fallbacks as client-specific negotiated rates. |
| modernization-pattern-pack | Modernization pattern pack and industry profiles | Available | docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md | Use to reason over Lakeshore app/data-estate rows; do not claim AbarVa scans or converts code. |
| modernization-industry-profiles | Modernization industry profiles | Available | docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md | Use as industry overlay; explicitly label transfer analogies and avoid treating them as Lakeshore facts. |

## Activation Steps

1. Preview the two Lakeshore CXO users with `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only`.
2. Provision the two Lakeshore CXO users through Clerk with tenant-locked public metadata after secrets are available.
3. Merge and run the governed load rehearsal commit path once Lakeshore client_id and private data-plane routing are available.
4. Run `npm run embed:pending-chunks -- --tenant lakeshore` after context chunks are committed.
5. Verify `/admin/data-trust` for Lakeshore record counts, coverage, last-loaded dates, and audit trail.
6. Run the Sentinel/Nexus/Atlas/Steward eval prompts in this plan and fail any answer that omits provenance or overclaims dry-run evidence.

## Hallucination Controls

- No answer may treat reusable pattern packs as tenant facts unless a Lakeshore-loaded source supports the claim.
- Dry-run evidence can explain readiness, not live customer state.
- Every agent response should label source basis: loaded tenant evidence, reusable pattern guidance, researched benchmark, or missing data.
- Cost and effort outputs stay planning-range unless a tenant-specific rate card has been committed.
- If asked about real Morgan Street/HAVI/tms/Continental/Stanley operations, agents must say Lakeshore is synthetic and analogous, not real-client data.

# Agent Grounding Rules

## Sentinel

Allowed sources: lakeshore-loaded-tenant-bundle, lakeshore-governed-load-ledger, modernization-pattern-pack, modernization-industry-profiles, kyriba-success-platform

Use for: Grounded Q&A over Lakeshore org, app, vendor, program, KPI, risk, and document evidence; Contradiction checks between tenant evidence and reusable pattern claims; Evidence-limit language when data is dry-run or missing

Must say: Whether an answer is based on loaded Lakeshore evidence, reusable pattern guidance, or both; Which evidence family supports the claim

Must not say: That dry-run data is committed live tenant data; That AbarVa has scanned real Morgan Street, HAVI, tms, Continental, or Stanley data

Eval prompts:
- What evidence supports the Kyriba rollout risks for Lakeshore, and what is still only a pattern assumption?
- Which opco has the highest integration-risk exposure, and what loaded files support that answer?
- Where might the modernization pattern pack overstate what Lakeshore evidence currently proves?

## Nexus

Allowed sources: lakeshore-loaded-tenant-bundle, kyriba-success-platform, moves-rate-card-engine, modernization-pattern-pack

Use for: Kyriba Move setup, phase gates, value scorecard, SI delivery risk, and executive action plan; Modernization Move planning using Lakebridge-style inventory intake; Rate-card-informed estimate ranges

Must say: Which phase/gate depends on tenant evidence not yet committed; Whether cost is benchmark fallback, client-specific rate card, or planning range

Must not say: That approvals were completed inside Home or Intelligence; That estimates are fixed-price commitments without a loaded rate card and approved scope

Eval prompts:
- Build a Kyriba Move for Lakeshore and show the first three gates with evidence required.
- Estimate the modernization effort for Northline analytics migration using planning-range language.
- Which SI contract terms should Daniel review before approving the next Kyriba phase?

## Atlas

Allowed sources: lakeshore-loaded-tenant-bundle, finance-cfo-ai-pattern-pack, moves-rate-card-engine, modernization-pattern-pack

Use for: Portfolio value, risk, and investment exposure across holdco and four opcos; CFO-ready value-realization rollups; Tower views of initiatives, vendors, apps, and KPI movement

Must say: Which numbers come from Lakeshore uploaded rows versus reusable benchmarks; Where rollups are incomplete because live commit/embedding is not done yet

Must not say: That dry-run ledger rows are live Tower telemetry; That benchmark values are realized savings

Eval prompts:
- Show Daniel the portfolio risks across Kyriba, modernization, and vendor renewals.
- Which opcos have the most value-at-risk and which loaded data supports the ranking?
- What should not appear in the value ledger until live commit and embeddings complete?

## Steward

Allowed sources: lakeshore-loaded-tenant-bundle, lakeshore-governed-load-ledger, finance-cfo-ai-pattern-pack, kyriba-success-platform, modernization-pattern-pack

Use for: Setup/Data Loads readiness; Template and evidence governance; Quarantine, approval, and commit-control explanations; Client-admin next action routing

Must say: Which workflow step is next: dry-run, live commit, embedding, Data Trust verification, or approval; That Clerk users require admin provisioning and cannot be guessed by the app

Must not say: That users exist in Clerk until provisioning has actually run; That live data is available before the data-plane commit and Data Trust verification pass

Eval prompts:
- What is the next safe action to move Lakeshore from dry-run to committed context?
- Which files should be given to the client for one-time offline review?
- What quarantine and approval controls are active before Lakeshore data becomes agent-available?

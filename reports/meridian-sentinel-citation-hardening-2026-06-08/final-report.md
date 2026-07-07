# Meridian Sentinel/Nexus — Evidence-Quality Hardening · Final Report (2026-06-08)

## Executive verdict

**GO** on the shipped changes; **HOLD** on the "decision-grade evidence at scale"
business claim until retrieval coverage lands.

The work made the evidence basis **visible, honest, role-aware, tenant-isolated,
and clinically safe**. It also produced a rigorous 80-question measurement that
proves the next — and dominant — lever is **retrieval coverage**, not the answer
UI or contract. Shipping is net-positive and safe (no retrieval regression);
the business standard of "every serious answer is evidence-backed" is not yet met
because only ~31% of questions currently retrieve grounded sources.

## What was broken

- The `askIntelligence` pipeline already retrieved client context + healthcare
  corpus patterns **with confidence** and **emitted a `sources` NDJSON event**,
  and the server **already forwarded it** — but the React clients
  (`SentinelChat`, `SentinelReasoningCards`) had **no `sources` handler**, so the
  evidence was discarded and answers rendered as bare text. The "citation gap"
  effectively always fired.
- No healthcare executive answer contract: answers weren't reliably structured
  for CXO decision use, and didn't consistently separate client facts from
  industry patterns or flag missing evidence.
- No measurement: no harness to prove evidence quality across the role surface.

## What changed

1. **Citation binding made visible** (#3322 `SentinelChat`/AgentDock; #3324
   `SentinelReasoningCards`): a new `EvidenceBasis` view groups sources into
   **Client facts / Healthcare patterns / Inference / Missing evidence**, shows
   confidence (High / Partial / Low; inference-only capped at "partial"), scrubs
   PHI-adjacent raw IDs + filesystem paths from the main view (IDs only behind a
   details toggle), and shows the **citation-gap warning only when `sources` is
   truly empty**.
2. **Healthcare CXO answer contract** (#3323): vertical-gated to Healthcare;
   injects the decision spine (my read / why it matters with named clinical-
   operational-financial-data-compliance lens / evidence basis separating client
   facts vs corpus patterns / decision fork / next step + named artifact /
   value-risk / evidence gaps / human-approval-governance), with no invented Epic
   modules or metrics, no patient medical advice, and non-fabrication intact.
   Non-healthcare tenants are byte-for-byte unchanged.
3. **80-question QA harness + scorer** (#3325): deterministic + Claude-judge
   scoring across 12 dimensions → scorecard.
4. **Tenant isolation + healthcare safety** proven by live probe.

## Files / PRs

- #3322 `fix(intelligence): bind + surface Sentinel evidence citations in the UI` (pre-existing on main; `src/components/agent/EvidenceBasis.tsx`, `SentinelChat.tsx`).
- #3323 `feat(intelligence): healthcare CXO answer contract` — `src/lib/intelligence/synthesis/healthcareAnswerContract.ts`, `ask/synthesizer.ts`.
- #3324 `fix(intelligence): bind + surface Sentinel evidence citations in the UI` — `src/components/intelligence/EvidenceBasis.tsx`, `(maestro)/intelligence/ask/SentinelReasoningCards.tsx`.
- #3325 `feat(qa): Meridian Sentinel 80-question evidence QA harness` — `src/scripts/qa/meridian-sentinel-qa.ts`, `scoring.ts`.
- All four **MERGED to main**; CI green (21/21 each).

## Azure revision / digest

- App `ca-abarva-web-lab-eastus` → `app.abarva.ai`.
- Image (pinned digest) `acrabarvalab001.azurecr.io/abarva/web@sha256:0361b2d5c9e2b15087b86a6c40679c8821573828e97bf71c0625f97575765e55` (tag `cutover-meridian-d65499684`).
- Revision `ca-abarva-web-lab-eastus--0000070` — **Healthy / Running**, **100% traffic**.
- Public proof (`public-health-proof.txt`): `/` HTTP/2 200; **no Vercel headers** (`x-powered-by: Next.js`); `/api/health` → `ok:true, postgres:true, direct_postgres:true`.
- Rollback: revert traffic to `--0000069` (image `main-9e4e483833`).

## 80-question scorecard summary

- **Overall 2.71 / 5** (full table: `qa-scorecard.html`, raw: `qa-results.jsonl`).
- Strong: **no_cross_tenant_leakage 5.0**, no_raw_id_leakage 4.94 (1 fail),
  executive_clarity 3.84, missing_evidence_honesty 3.24, specificity 3.0.
- Gating: **healthcare_corpus_usage 0.45**, meridian_context_usage 1.34,
  citation_presence 1.56 → **citation rate 31% (25/80)**.
- By category: Source 3.26, Moves 3.25, CIO 3.13, Compliance 2.87, Payer 2.63,
  CDAO 2.57, Tower 2.49, CFO 2.40, RCM 2.33, CMO 2.21.
- All 15 weakest answers are `src=0` (retrieval returned nothing) — the model
  honestly says so rather than fabricating.

## State separation (required)

| State | Status | Evidence |
|---|---|---|
| Data exists | ✅ rich | 15 source_files / 3,503 records / 3,506 chunks / **38,640 facts** / 9,026 corpus_patterns |
| Retrieval works | ⚠️ partial | only ~31% of questions retrieve sources; corpus + Meridian CMDB-segment coverage is the gap |
| Citations bound | ✅ | server retrieves + emits `sources`+`coverageReport`, route forwards |
| UI displays citations | ✅ | EvidenceBasis on both chat surfaces; citation-gap honest |
| QA score | 2.71/5 | gated by retrieval coverage, not by binding/contract/clarity/safety |
| Tenant isolation | ✅ 5.0 | Apex/Lakeshore/SkyHarbor cannot see Meridian (pin-guard + cross-tenant refusal) |
| Healthcare safety | ✅ | patient medical-advice refused → ED/911; clinical governance in contract |

## Remaining gaps (ranked) — see `recommended-fixes.md`

1. **Healthcare corpus barely surfaces (0.45)** — wire/repair the corpus-pattern
   retriever so PATTERN-class sources reach clinical/payer/RCM/CDAO answers.
2. **Meridian CMDB segment mismatch** — `selectTenantEnterpriseSegments` doesn't
   map Meridian's segment names (`cmdb_applications_services`,
   `data_domains_stewardship`, `ci_relationships_dependencies`, …); add them +
   routing keywords (same pattern as the data_estate/infrastructure fix) to make
   the 38,640 facts reachable. Biggest single score mover.
3. **1 raw-ID leak** — tighten the synthesis ID scrub.
4. **AgentDock evidence** — `SentinelReasoningCards` is wired; the shared
   AgentDock surface evidence drawer (beyond #3322's basic binding) is a follow-up.

## GO/HOLD

- **GO**: deploy + keep the citation binding, answer contract, isolation, and
  safety — done, live, proven, safe.
- **HOLD**: do not claim "decision-grade, evidence-backed at scale" until gaps #1
  and #2 land. They are well-scoped and move most of the scorecard.

## Browser proof (live, deployed revision --0000070)

`screenshots/browser-proof.md` + `public-health-proof.txt`. Signed-in session on
app.abarva.ai exercised the deployed EvidenceBasis UI across both states:
- **Ungrounded ask → EVIDENCE BASIS (0), badge LOW, "Citation gap — unverified
  inference"** (gap appears when evidence absent). ✅
- **Grounded ask → EVIDENCE BASIS (4), badge PARTIAL, no citation gap**, answer cites
  loaded client context (data/analytics stack + org bench). ✅
- Confidence honest (LOW vs PARTIAL, never overclaimed). ✅
Caveat: the signed-in user's active tenant is Lakeshore (no tenant switcher introduced);
identical EvidenceBasis code serves Meridian. Public health proof: `/` 200, no Vercel
headers, `/api/health` postgres+direct_postgres true.

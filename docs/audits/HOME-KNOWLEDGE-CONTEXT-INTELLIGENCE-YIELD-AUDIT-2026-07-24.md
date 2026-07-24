# Home Knowledge Context Intelligence Yield Audit — 2026-07-24

Deterministic audit, no new Anthropic API calls. Triggered by direct review of the live production
`/home` page surfacing nav-duplication and fake-chart-type defects, then a follow-up challenge:
does the underlying generation pipeline actually exploit the raw interview, application-ownership,
and hosting corpus, or does it produce a prettier shell around thin content? Run against raw tenant
CSV/Excel source files, canonical Postgres structures, Claude source packets, generated candidate
packs, and the proposed Home pages, across all 5 tenants and both the V2
(`build-home-knowledge-pack-v2.mjs`) and V4 (`build-home-knowledge-v4-review-pack.mjs`) pipelines.

## Correction to an earlier claim this session

A same-day investigation, scoped to `skyharbor-air`, concluded "no schema field anywhere is
designed to hold a quote or speaker attribution" and "the V4 pipeline never reads interview data."
**That conclusion was correct for skyharbor-air specifically, but was stated as if it generalized —
it doesn't.** Real, role-attributed interview quotes tied to evidence IDs do exist and do
demonstrably influence generated content for `meridian-health`, confirmed by direct excerpt below.
The two specific files cited as evidence
(`home-knowledge-actual-claude-prompts-2026-07-22.txt`, `home-knowledge-claude-prompt-rendered-output-dump-2026-07-22.json`)
don't exist verbatim in this repo (likely local renamed copies on Anand's machine) — but
functionally identical, git-committed artifacts do, and confirm every specific claim made against
them.

## 1. Interview-utilization audit

| Tenant | Interview source | Rows | Reaches ANY generated output? |
|---|---|---|---|
| skyharbor-air | `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv` | 217, explicitly `candidate_only: true` (synthetic) | **No** — zero interview content in any V2 or V4 output |
| first-capital | `datasets/tenant-inputs/first-capital/interviews/executive_interviews.csv` | 205 | **No** |
| meridian-health | `datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv` | 222 | **Yes, partially** — see below |
| apex-retail | none found | — | — |
| lakeshore-holdings | none found | — | — |

**Confirmed real, for meridian-health only** —
`reports/home-knowledge-pack-v2/meridian-health/home-knowledge-pack-v2.json`:

```json
// use_cases[3], use_case_key: "end-to-end-cost-transparency"
"priority_rationale": "CEO, CFO, and CDAO all cite cost transparency as a top priority. Provider
contract terms not being in governed digital form is the single largest blocker.",
"evidence_refs": ["MER-V3-EVID-0112","MER-V3-EVID-0113","MER-V3-EVID-0114","MER-SA07-INT-EVID-0005"]

// design_slots.SIGNALS[0]
{"role":"CEO / Enterprise Strategy","source":"Executive Interview (MER-SA07-INT-EVID-0001)",
 "quote":"Unified clinical + claims lakehouse is promising, but strategy is not decision-grade
 until Epic Clarity evidence closes — no certified medallion architecture.",
 "evidence_refs":["MER-SA07-INT-EVID-0001","MER-SA07-INT-EVID-0008"]}
```

The "33 interview evidence records across six executive roles" line is a real string in the
artifact, but it's a Claude-authored label, not a literal 1:1 slice of the raw CSV's ID range —
cross-checked against the source, IDs 0001–0033 map to only 3 roles; the pack's actual citation
footprint across the full document spans 216 unique evidence IDs across ~19 role variants. Real
number, loosely summarized, not fabricated.

**How this happened, and why it doesn't generalize**: neither V2's `buildPromptPacket` nor V4's
`buildTenantContextPacket` reads interview files or `design_slots.SIGNALS` — both explicitly
whitelist only `DIMS/USE_CASES/EVIDENCE/DATA`. The grounding happens one layer upstream, in
`scripts/knowledge/generate-home-knowledge-design-contract-pack.mjs`, which is **hardcoded to
`meridian-health`** (`const tenantKey = "meridian-health"`, line 8) — a bespoke, non-reusable
script that does its own interview-summarization pass before either shared pipeline ever runs.
**This means real interview grounding exists for exactly one of five tenants, and only because of
a one-off script outside the standard, repeatable pipeline — not because the pipeline itself
handles interviews.** That is itself a finding, not a solved problem: it needs to be systematized
into the shared pipeline (Phase 1 of the standing implementation plan) or it stays a Meridian-only
accident.

One more wrinkle worth flagging, not fully resolved: meridian-health's V4 fixture (a separate,
successful run — `_fixtures/meridian-health.json`, `2026-07-24T03:07:01Z`, `opus-4-8`) also carries
real interview-informed narrative ("CEO, CFO, and CDAO priority," attributed to "Executive
leadership interviews...") despite V4's build script having zero interview-specific code. The
likely explanation: V4 inherits this because it reads the same upstream `design-contract-pack.json`
whose `DIMS`/`EVIDENCE` slots (for Meridian specifically) already carry interview-informed content
baked in by the bespoke script above — but V4's fixture carries **zero** `evidence_id`/`evidence_ref`
fields, unlike V2's typed citations. So V4 gets the narrative color but drops the traceability. Not
independently confirmed which exact upstream field carries it — flagging as an open trace, not an
assumption.

## 2. Applications & Systems — source profiling + field-survival

| Tenant | Rows (active file) | Owner/hosting fill rate | Data quality note |
|---|---|---|---|
| skyharbor-air | 613 | `business_owner`/`technology_owner`/`hosting_location` 2% (13/613) | Richer 412-row file exists (`01_Application_Portfolio_InScope_412Apps.csv`, real AWS/Azure/on-prem/hybrid hosting, vendor, run cost, modernization data) but **is not wired into Home Knowledge at all** — used only by an unrelated Source-module script |
| first-capital | 212 | `technology_owner`/`vendor` 100%, `business_owner`/`hosting_location`/`deployment_model`/`system_type` 0% | — |
| meridian-health | 241 | structured fields populated in only 20/241 (8%) | **Data quality bug**: 221 of 241 rows are literally interview-response text misfiled into the applications file (`source_type: executive_interview`), not real app records |
| apex-retail | 122 | `technology_owner`/`vendor` 100%, rest 0% | No richer source file exists for this tenant at all |
| lakeshore-holdings | 24 | same sparse pattern | No richer source file exists |

The universal data-standard Anand referenced is real and does match his paraphrase field-for-field:
`datasets/tenant-inputs/templates/universal/standard-2026-07-v3/04_applications_systems.csv` header
= `tenant_key, system_name, system_type, system_category, business_function, system_scope,
deployment_model, hosting_location, lifecycle_state, criticality, business_owner, technology_owner,
vendor, data_domains, interfaces_count, current_state_or_target_state, source_file, source_date,
confidence, known_gaps`. The standard is well-specified; the populated data is what's sparse.

**Field-survival, confirmed identical across every tenant** (generic pipeline code, not
skyharbor-specific): `compactRows(rowsFor(pack, "apps"), 28, [...])`
(`build-home-knowledge-v4-review-pack.mjs:449`) truncates to 28 rows before Claude ever sees them.
Final V4 output collapses every tenant to 4–6 function-level buckets with no per-application
identity (first-capital: 4 buckets; meridian-health: 6; skyharbor-air: 6). The live page's
`dimensionSample()` (`HomeEnterpriseBriefApp.tsx:754`) then hard-caps to 6 rows × 5 columns with no
filter UI, on top of that.

## 3. Relationship-resolution spot-check

Sampled 3 rows from skyharbor-air's richest file (412-row supporting-evidence CSV):
app→business-domain, app→vendor, and app→hosting-provider all resolve cleanly. **App→named human
owner or sponsor does not resolve from any application file for any tenant** — the 412-row file's
14 columns have no `owner`/`sponsor`/`business_owner`/`technology_owner` field at all; only the
sparser 613/212/122/24-row "active" files nominally have those columns, and they're populated in
2–8% of rows where checked. This is a real, confirmed source-data gap, not only a pipeline-
processing gap — "who owns this system" is close to unanswerable from what's actually captured
today, for any tenant, at the individual-application level.

## Bottom line

- The rendering-layer defects (duplicate nav, fake chart types) are real and are fixed by the
  already-built V4 typed renderer.
- The deeper problem is real too, and confirmed at three separate points: (1) interview grounding
  works for exactly one tenant via a non-reusable bespoke script, not the shared pipeline; (2) a
  genuinely rich application dataset exists for skyharbor-air and is simply never connected; (3)
  named ownership/sponsorship is largely unresolvable from source data as captured today, for any
  tenant — that's a data-capture gap upstream of any pipeline fix.
- Migrating the live page onto the V4 renderer without addressing these would ship a better-looking
  version of the same thin, ungrounded content. The standing implementation plan already sequences
  data-fidelity work (Phase 0: real application data grid, no LLM truncation; Phase 1: interview
  grounding) ahead of the production page swap (Phase 3) for exactly this reason — this audit
  confirms that sequencing was the right call, and adds two concrete corrections to fold in:
  systematize Meridian's one-off interview-grounding script into the shared pipeline rather than
  treating Phase 1 as greenfield, and treat "named ownership" as a disclosed, unresolved gap in the
  UI (show "not captured," per the standing no-fabrication rule) rather than something Phase 0 can
  fix by better plumbing alone — the data isn't there yet to plumb.

## Not yet done (flagging, not deferring silently)

Anand's original ask also specified a formal field-survival matrix per relationship type, a full
intelligence-yield report (deterministic/inferable/not-yet-concludable per dimension), and exact
publisher-binding specs. This document covers the Applications and Interview dimensions in the
depth requested; it does not yet extend the same treatment to Vendors, Data Domains, Integrations,
Capabilities, or Value Streams, and does not yet propose exact publisher bindings or fail-closed QA
test specs — those are reasonable next steps once Anand confirms this direction, not silently
dropped scope.

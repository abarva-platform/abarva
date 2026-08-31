# Home Source Intelligence Execution Directive — Source Intelligence, Then Home

Verified against `origin/main` when promoted from local directive.
Supersedes earlier local Home directives. This public version intentionally uses generic tenant labels. The visual reference remains outside the public repository.

Six steps, in order. Step 0 blocks everything — richer content generated into a path the page does
not read changes nothing on screen.

---

## 0 — One generator owns Home prose, and the page reads it

The live thesis is *"The reference health-system tenant's provider and health-plan operating model turns technology resilience,
data trust, and commercial control into one leadership agenda..."* That string is in **neither**
artifact anyone has been improving:

```
src/lib/home/preview/golden-snapshots/<tenant-key>.json    0 matches
the 31 Aug local chapter run output                           0 matches
```

Both of those are business-led. The 31 Aug run opens *"The reference health-system tenant's Star Rating ambition and its
AI-driven value story are both at risk because the programs meant to deliver them are underfunded,
unfinished, or unproven — leadership needs to fund execution, not just intent."*

`page.tsx:99` branches:

```ts
const bundle = isEclProvider
  ? await getHomeEclProjectionBundle(tenantKey)   // chapter_claim rows — this is what renders
  : getHomeReviewBundle(tenantKey);               // the golden snapshot
```

`build-home-chapters.ts` wrote both good artifacts. `build_home_ecl_narrative_layer.ts` wrote what
renders, with `deterministicClaimPlan: true`, from the packet where `enterpriseIdentity`,
`businessEconomics` and `strategicPriorities` were hard-coded null.

**Recommendation, and take it unless you have a reason not to:** `build-home-chapters.ts` is the
single prose generator. The ECL layer becomes its persistence and readback path, not a second
writer. One generator, one provenance chain, and it is already the one producing board-grade copy.

**Acceptance test, and it is one command:** take the live page's opening sentence and grep for it in
the chosen generator's output artifact. Today it returns zero. When it returns one, step 0 is done.

---

## 1 — Read each source file once, sequentially, in a single pass

One file at a time. Never batch, never sample, never truncate.

**This works because the files are repetitive, not large.** `12_relationships.csv` is 2302 rows and
~326k tokens, but:

```
known_gaps                      1 distinct value  × 261 chars   ~150k tokens of one sentence
source_file                     1 distinct value  ×  74 chars
confidence                      1 distinct value
current_state_or_target_state   1 distinct value
evidence_basis               1593 distinct                       actual information
relationship_type              13 distinct                       actual information
```

Four single-value columns are ~62% of that file. `known_gaps` alone is 47% of relationships, 41% of
data assets, 25% of applications — the same sentence repeated per row.

**So, before the model call, do two deterministic reductions:**

1. **Collapse constant and near-constant columns to header lines.** A column with one distinct value
   becomes `known_gaps (all 2302 rows): "<the sentence>"`. Report it in the digest as a finding —
   *a column that never varies is a default, not evidence* — the same rule that flags
   `succession_risk` reading `low` for all 225 org units. Compression and quality-checking are one
   pass; build the detector once and use it in both the digest and the record browser.
2. **Split structured from narrative.** Structured columns are already handled deterministically by
   `application-segmentation.ts` and `segment-spine.ts` — they do not need a model at all. Only
   narrative columns go to Claude.

After those two, every file fits one pass. **Chunking is a fallback that should never fire.** If a
file still does not fit, stop and report it rather than sampling; that is a signal the reductions
missed something.

The digest records what it did:

```jsonc
"read": {
  "source_rows": 2302, "rows_read": 2302, "strategy": "single_pass",
  "columns_total": 13, "columns_collapsed": ["known_gaps","source_file","confidence","current_state_or_target_state"],
  "columns_to_model": ["evidence_basis","relationship_type","from_object_name","to_object_name"]
}
```

**Gate:** `rows_read` must equal `source_rows`. A digest that read fewer rows without saying so is
rejected. Plant that failure and watch it fire.

---

## 2 — The digest shape

`<family>.source_intel.json`, committed beside the CSVs, one per family.

**Four non-negotiables:**

1. **`facts` and `reading` are separate arrays.** Facts are extracted and cell-traceable
   (`{file, rows, column}`). Reading is interpretation and **may never introduce a number**. This is
   the one property that keeps numbers-from-data / prose-from-Claude intact through the redesign.
2. **`schema_fingerprint` beside `content_sha256`.** Content hash catches changed data; the
   fingerprint (sorted column list, hashed) catches changed *columns*. A working-tree rebuild
   recently flattened all 19 schemas into one generic shape — a digest describing a schema that no
   longer exists is worse than no digest.
3. **`do_not_claim`** inside the artifact. Tell the model what it cannot see or it fills the gap.
4. **`page_mapping`** — which Home pages this family informs. This is the join for step 4.

Plus: what the file is, grain, column meanings, volumetrics, named entities, gaps, suspicious data.

**Read from `origin/main`, never the working tree.** There, `02_org_ownership.csv` is 225 rows at
94% fill with `leader_name_or_role` and `decision_rights`. The rebuild branch has the same rows at
36% fill with `business_name` equal to `context_item`. Digests from the second are nineteen
paraphrases of one list of function names.

---

## 3 — Provenance, captured now because it is impossible later

Per digest: exact prompt, exact input context, model id, prompt hash, raw response, verifier ledger,
repaired output, published output. **Store the raw response; do not gate on it.** Published-state
provenance and model forensics are different questions and only the first is a release gate.

**Verifier, before anything is written:** every `facts[].value` reproducible from its cited cells;
every numeral in a fact present in the source; `reading` carrying no numeral absent from the facts
it rests on; every named entity appearing verbatim in the source. Verdicts stay
SUPPORTED / SUPPORTED_INFERENCE / OVERSTATED (repaired) / UNSUPPORTED (dropped) — do not invent a
second taxonomy. Plant a fact whose number is absent from its cells and watch it be rejected.

---

## 4 — Build pages from digests, with a sufficiency check first

Each page declares its digest set via `page_mapping` and receives **whole digests**.

**Before any model call**, a deterministic pre-flight asks whether the page can fill itself:

```jsonc
"sufficiency": { "lead_fact": 1, "table_min_rows": 3, "findings_min": 2, "charts": ["segment_gap"] }
```

Three outcomes, and only the first calls the model:

1. **Sufficient** — generate.
2. **Short** — generate what is supported and render the page shorter. A findings block is as long
   as its findings; that is the design, not a degraded state.
3. **Cannot open** — no lead fact. Report the evidence gap and name the family that would close it.
   Do not call the model. A page with nothing to say should cost nothing to discover.

**Settled by measurement, do not re-litigate:**

```
variant        exec claims   out tokens   max-token stops   mean separation   must_not_do
baseline             9          3848            0                14.83             4
width               14          3752            0                17.32             1
width_budget        14          4693            0                11.99             7
```

- **Adopt `width`. Reject `width_budget`** — it makes violations 1 → 7 and separation 17.3 → 12.0.
- Truncation was never the problem: `maxTokenStops: 0` everywhere.
- Width moved **only** the executive brief. Every other chapter's claim count is identical across
  all three variants; `how_we_operate` gets **1 claim** under every configuration. That is thesis
  claim-planning, upstream of assembly. Do not tune assembly for it.
- **19 of 58 claims failed verification** (14 OVERSTATED, 5 UNSUPPORTED). Report that rate per run;
  it is the "not CXO-ready" number and it should move.

Keep the deterministic cross-file signals — digests replace narrative context, not computed metrics.
`findInventedNumbers` widens its allowed set from routed claims to the page's digest facts.

---

## 4a — The pages, and two changes to the current mapping

These create **no new surfaces**. The twelve contracts govern the sixteen Home page keys that
already exist. `config/home/evidence-led-pages.json` carries ten of them today; two are added below.

| contract | governs | opens on | source |
| --- | --- | --- | --- |
| What this enterprise is | `executive_brief`, `our_business` | 40% of revenue runs on 10.8% of the applications | `01b`, `04` |
| What it runs on | `technology_data`, `applications_systems`, `current_state_architecture` | Departmental clinical holds $273.0M; the clinical core holds $19.2M | `04` |
| Where it is hosted | `infrastructure_platforms` | 3 platforms have hot DR; 24 have backup only | `06` |
| How data moves | `current_state_data_flow`, `data_assets_integrations` | 395 of 540 assets carry regulated data; 264 are not production-governed | `05` |
| What it buys | `vendor_contracts` | 42 of 72 contracts auto-renew; exiting costs $181M | `07` |
| What it costs and returns | `performance_value` | 7 of 50 value claims are ready; $4M is attested | `14`, `08` |
| What it is betting on | `strategy_value_creation` | $740M of budget carries $846M of expected value | `09` |
| What is exposed | `what_needs_attention` | 12 of 40 controls are open; $8M would remediate the register | `11` |
| Who owns what | `how_we_operate` | 225 units hold $1.1B of authority across four P&L owners | `02`, `03` |
| **What leadership says** | `leadership_perspective` | **NEW — see below** | `SA10`, `16` |
| **What it is doing with AI** | *needs a page key* | **NEW — see below** | `10`, `SA08`, `SA09`, `SA11` |
| The record | `what_has_been_loaded`, `browse_the_record` | 16 of 19 intake families contribute citable evidence | registry, manifest |

### Change 1 — split leadership perspective out of `who_owns_what`

Today one contract covers `how_we_operate` **and** `leadership_perspective`. Those are different
jobs on different evidence: org units, decision rights and budget authority on one side; **996 rows
of interview testimony** on the other.

`SA10_AI_Value_Interview_Evidence.csv` is 996 rows, 29 columns, **44 distinct stakeholder roles**,
across five interview tracks — current_state 160, challenges 149, priorities 132, portfolio 115,
ways_of_working 105 — with verbatim quotes and what-is-not-working per row. It is the richest
qualitative source in the entire intake, and it is the one page where the model has genuinely
interpretive material rather than counts to caption.

Give it its own contract, its own lens (interview synthesis: themes, consensus, dissent, by role and
function, never converting opinion into fact), and pair it with `16_expert_lenses.csv`.

**Lead candidate:** consensus and dissent across 44 roles on the same five tracks — where leaders
agree, where they contradict each other, and where they contradict the record. `contradictsRecord`
already exists in the data.

### Change 2 — add an AI page. Nothing currently reads any of it.

Four families feed it and no Home surface touches one of them, while the tenant's declared
strategic priorities are about AI value.

```
10_ai_automation_use_cases   18 use cases, already segmented, with ai_pattern and value archetype
SA08 benefits realization    promised $63.8M · funded $38.2M · actual YTD $24.5M
SA09 tool usage feed
SA11 KPI operational outcomes
```

Status splits 4 production enterprise-wide, 8 pilot, 4 evaluation, **2 paused pending governance
review**. Value archetypes: 11 yield-leakage-or-regulatory-exposure, 6 revenue-uplift, 1
cost-productivity.

**Lead candidate:** $63.8M promised against $38.2M funded and $24.5M actually spent — and only 4 of
18 use cases in production. Set that beside the 7-of-50 claimable value metrics and the AI value
story is the same attestation gap as everything else, which is a finding rather than a coincidence.

This page needs a new `home_page_key`. Add it rather than folding AI into an existing surface.

---

## 4b — Depth: a page is a table set, not a table

One table per page is a floor and it produces thin pages. The data supports far more, and none of it
is currently read. From `04_applications_systems.csv` alone:

```
cloud_readiness        158 refactor_required · 109 rehost_candidate · 34 already_cloud
lifecycle_state        163 current · 71 legacy_stable · 29 sunset_planned · 24 deprecated
authentication_method  132 local_accounts · 85 sso_saml · 68 ldap_direct
data_classification    249 phi · compliance_scope 249 HIPAA
license_model          101 capacity_based · 90 perpetual · 76 enterprise_agreement · 34 per-user
replacement_candidate   58 yes · 43 modernise_in_place · 201 no
criticality            167 tier1 · 124 tier2
                        53 end-of-support dates · 302 technical-debt scores · 160,703 users
```

**132 applications on local accounts, and 249 hold PHI.** Nothing on any surface says that today.

**So each page declares a table set, and the sufficiency contract sets a target, not only a floor:**

```jsonc
"sufficiency": {
  "lead_fact": 1,
  "tables_min": 2, "tables_target": 4,     // each a real dimension, each reconciling to the total
  "findings_min": 2,
  "charts": ["segment_gap"]
}
```

A page that renders one table when four are supported is under-built, and the pre-flight should say
so — it is a different report from "cannot open". Three states, not two: **under-built**,
**sufficient**, **cannot open**.

**And read the narrative columns.** `volumetric_narrative`, `known_challenges_narrative`,
`known_upgrades_plan_narrative`, `maturity_assessment_narrative`, `data_quality_notes` are 51% of
the applications file by weight and are the only genuinely qualitative material in it. They are
exactly what a model should read and exactly what the current packets drop. The digest's `reading`
array is where they land.

---

## 4c — The record browser

This is the surface that makes every other page trustworthy, and it governs `what_has_been_loaded`
and `browse_the_record`. Today's browse surface reports what was loaded; it does not let anyone read
it.

**Family picker** — all declared families plus the SA extracts, each with rows, columns, fill rate,
and a one-line grain (*"one row per deployed application instance"*). A family that is read but not
citable says so on its own row; today that is three of nineteen.

**Column panel** — per column: name, meaning, fill rate, distinct count, three sample values. A
column whose value never varies is flagged as a **default, not an assessment** —
`succession_risk` reads `low` for all 225 org units, `known_gaps` has one distinct value across
2302 relationship rows. This is the same detector as the digest reduction in step 1: build it once,
use it in both places.

**Row table** — real rows, virtualised, sortable, per-column filter, CSV export of whatever slice is
on screen. Wide tables scroll inside their own container; the page body never scrolls sideways.

**Cell provenance — build this, it is the point.** Every figure on every page carries a control that
opens the browser pre-filtered to the rows behind it. "220 applications" opens
`04_applications_systems.csv` filtered to that segment's functions. A reader who doubts a number
gets the rows in one click, and "every figure traces to a filter over a named file" stops being a
promise and becomes a control anyone can operate.

---

## 4d — Charts: five, and two already exist

A chart earns its place when it shows what a table cannot. Most of these pages are small tables and
a five-row bar chart is worse than five rows of text.

1. **Segment gap** — diverging bars around zero: each segment's share of a domain minus its declared
   revenue share. Twenty signed numbers cannot be scanned; the diverging form makes it instant. New.
2. **Cost concentration by archetype** — horizontal bars. A fourteen-fold contrast is what bar
   length is for. New, trivial.
3. **Renewal timeline** — contracts by renewal quarter, auto-renewing ones stacked. A time axis
   shows clustering a table cannot; each bar is a decision window. New.
4. **Value bridge** — $63.8M promised → funded → attested. `ValueBridgeChart` exists at
   `src/components/tower/charts/TowerCxoCharts.tsx:200`. Reuse it.
5. **Run / change / transform** — `BudgetRunChangeChart` exists at `:665`.

Not charts: DR tier, severity against control state, program status, data quality — all small
tables. Reuse `src/components/home/preview/visuals/home-chart-kit.tsx` primitives; do not introduce
a second palette or tooltip.

**Design system is locked** — `src/components/home/v4/tokens.ts`. Red means rated high severity on
the tenant's declared register; amber means absence. Using either for emphasis destroys the meaning.

---

## 5 — Contract hygiene, before the regeneration run

- **One page-contract file.** A worktree adds `config/home/findings-first-pages.json` (253 lines)
  beside `config/home/evidence-led-pages.json`, and the builder hardcodes the second at
  `build_source_intelligence_home_packets.mjs:12`. Two contracts with one reader is the drift that
  has already cost this programme twice. Land one, or supersede explicitly in the same PR.
- **Short, not deferred.** `terminal_states` still carries `deferred` per page. If a required finding
  can be deferred, you get the same refusal page with better provenance. Fix it in the contract.
- **Commit the design directive as the controlling contract** — machine-readable: page list, the four
  moves per page, the five charts, the record-browser spec.

---

## 6 — Write down that the demo path is not the architecture

Commit `CLIENT-DATA-PLANE-ARCHITECTURE.md` to `docs/architecture/`, referenced from `AGENTS.md`.
Demo stays repo-local for synthetic tenants. Client is: private Blob landing → ACA jobs inside the
customer VNet → customer-scoped Postgres/ECL → tenant-scoped serving views, digests in the customer plane
with hash and provenance.

**One precondition, not a hardening task:** `Dockerfile:129` is `COPY /app/datasets ./datasets` —
the whole tree, every tenant. Today that is bloat. With one real customer it is customer A's intake
riding in the image that serves customer B, by default, with nobody making a mistake. Scope it before
the first engagement. A synthetic tenant cannot demonstrate this works, because synthetic data is
exactly what makes it look harmless.

---

## Standing rules

- Read every fact from a named ref: `git fetch`, then `git show origin/main:<path>`.
- Every gate ships with a planted failure you have watched fail.
- A test asserting on config authored in the same commit proves nothing. Assert on generated output.
- Report changed / tested / deployed / live-proven as four separate states.
- Hard gates still requiring explicit human approval: data-plane mutation outside the repo-owned deploy workflow,
  migration apply, promotion of generated data, active tenant replacement.

## Definition of done

- [ ] Step 0: the live page's opening sentence greps to the chosen generator's artifact
- [ ] Constant-column detector built once, used in both the digest reduction and the record browser
- [ ] Every file read single-pass; `rows_read == source_rows`; a short digest is rejected — planted
- [ ] `source_intel.json` per family: facts/reading split, both hashes, `do_not_claim`, `page_mapping`
- [ ] Verifier rejects a fact whose number is absent from its cited cells — planted and observed
- [ ] Provenance per digest; raw response stored, not gated on
- [ ] Sufficiency pre-flight before generation, reporting three states: under-built / sufficient /
      cannot open. A page with no lead fact costs no model call
- [ ] Each page declares a table set; `tables_target` met or the shortfall reported
- [ ] Narrative columns reach the digest `reading` array — they are 51% of the applications file and
      are currently dropped
- [ ] Record browser: family picker, column panel with constant-column flagging, filterable rows,
      CSV export
- [ ] Cell provenance from a figure to its filtered rows, working on at least the segment table
- [ ] Five charts, not more; two of them the existing Tower components
- [ ] `width` adopted, `width_budget` rejected; verification failure rate reported per run
- [ ] One page-contract file; no `deferred` on a required finding
- [ ] Twelve contracts: `leadership_perspective` split out of `who_owns_what`, and an AI page added
      with its own `home_page_key`
- [ ] Client-plane architecture committed and referenced from `AGENTS.md`
- [ ] Release record; `node scripts/release-check.mjs --base origin/main --head HEAD` passes locally

# Source aVa hard-QA execution plan

Status: execution-ready QA plan. This document does not change Source, aVa, prompts, routes, data
access, or deployed runtime behavior.

## Purpose

Use the existing Source aVa hard-QA harness to prove whether aVa can answer Source / Vendor 360 /
Optimize Contract questions with governed context, table/chart output, explicit unknowns, and
contract-grounded evidence discipline.

This is not a question-bank design exercise. The runnable question bank already exists in
`scripts/audit/source-ava-hard-qa.mjs`; this plan defines how to execute it, how to score it, and
which proof artifacts must be captured before anyone calls the run passed.

## Existing runnable harness

Primary command:

```bash
npm run audit:source-ava-hard-qa -- \
  --out-dir /tmp/source-ava-hard-qa-live-YYYYMMDD \
  --live \
  --base-url https://app.abarva.ai \
  --cookie "$SOURCE_AVA_COOKIE" \
  --client-key "$SOURCE_AVA_CLIENT_KEY" \
  --tenant-name "$SOURCE_AVA_TENANT_NAME" \
  --contract-id "$SOURCE_AVA_CONTRACT_ID" \
  --event-id "$SOURCE_AVA_EVENT_ID" \
  --forbidden-vendors "$SOURCE_AVA_FORBIDDEN_VENDORS"
```

Safe preflight, no live calls:

```bash
npm run audit:source-ava-hard-qa -- \
  --out-dir /tmp/source-ava-hard-qa-question-bank \
  --fail-on-question-bank
```

Captured-response scoring mode:

```bash
npm run audit:source-ava-hard-qa -- \
  --out-dir /tmp/source-ava-hard-qa-captured \
  --response-file /path/to/captured-responses.json \
  --forbidden-vendors "$SOURCE_AVA_FORBIDDEN_VENDORS" \
  --fail-on-fail
```

Focused slices:

```bash
npm run audit:source-ava-hard-qa -- --surface optimize --limit 5
npm run audit:source-ava-hard-qa -- --focus chart_visual_output
npm run audit:source-ava-hard-qa -- --ids OPT-002,OPT-004,RESP-001
```

## Run modes and proof standard

| Mode | When to use | Required proof artifact | Pass meaning |
| --- | --- | --- | --- |
| Question-bank only | Before any live run or after editing the bank | `source-ava-hard-qa.json`, `.md`, `.csv` with `questionBank.status = PASS` | The test pack is well formed; no answer quality is proven |
| Captured-response | When browser or live API calls are unstable | Captured response JSON plus scored report | The captured answers passed the scoring rules |
| Live API | Preferred signed-in path when a session cookie is available | Full scored report including HTTP status, latency, answer excerpts, and artifacts | The deployed `/api/chat/agent` path answered correctly |
| Signed-in browser | Required for final product proof when feasible | Screenshots/exported chat transcript plus scored report | The rendered aVa surface preserves the same answer, chart/table artifacts, and visible caveats |

Do not call a run passed from question-bank-only mode. Do not call a browser run passed if only the
API report exists. API proof and browser proof answer different questions.

## Scoring rules

The harness currently scores each answer on these gates:

| Gate | What it checks | Failure example |
| --- | --- | --- |
| Expected grounding terms | Answer contains enough expected domain terms for the question | Generic advice without contract, evidence, or stage terms |
| Forbidden terms | Answer avoids explicitly forbidden phrases | Guaranteed savings; quote all; no evidence needed |
| Configured ghost-vendor terms | Vendor-response answers do not name non-participating vendors | Any term configured through `SOURCE_AVA_FORBIDDEN_VENDORS` when the event has a different response set |
| Table output | Table-required questions include markdown table, HTML table, or table artifact signal | Prose-only answer to a table request |
| Chart output | Chart-required questions include chart/visual signal or artifact | Table-only or prose-only answer to a chart request |
| Data-plane/counting basis | Answers quoting Source numbers state live Source/read-model/cube/counting-basis context | `$755K` with no source plane or counting basis |
| Value overclaim guard | Answers do not present guaranteed or realized savings without Finance/Tower confirmation context | "Realized savings" without finance-confirmed caveat |

Manual CXO review must additionally score these dimensions from 1-5:

| Dimension | 5 means | 1 means |
| --- | --- | --- |
| Decision usefulness | A sourcing or finance executive can decide the next action from the answer | It restates the UI or gives generic advice |
| Evidence traceability | The answer names the data plane, source/read model, or evidence family behind figures | Numbers appear without basis |
| Unknown discipline | Missing, pending, unapproved, and unquotable values stay explicit | Gaps are hidden, zeroed, or softened |
| Visual/table quality | Tables/charts are compact, readable, and useful for the question | Output is cluttered, malformed, or decorative |
| Workflow guidance | The answer tells the user what to do next, who owns it, and what evidence/template is needed | The answer leaves the user stuck |

## Fifty-question grouping

The runnable bank contains exactly 50 questions. Keep the source of truth in
`scripts/audit/source-ava-hard-qa.mjs`; this section groups the current IDs for execution planning.

### Reasoning and executive judgment

| ID | Surface | Question intent | Required proof |
| --- | --- | --- | --- |
| OPT-001 | Optimize | Missing evidence before action | Answer excerpt, issues list, no invented value |
| OPT-003 | Optimize | Reproducible versus unquotable opportunities | Must preserve "do not quote" discipline |
| OPT-005 | Optimize | Baseline lock and workflow advance | Rail/baseline state reflected correctly |
| OPT-006 | Optimize | CXO next decision | Clear next action with evidence caveat |
| OPT-012 | Optimize | Executive priority storyline | Contract-grounded, not generic |
| OPT-014 | Optimize | No calculation-run response discipline | No estimate/invention |
| OPT-015 | Optimize | CFO one-screen briefing | Amounts plus caveats plus next action |
| C360-003 | Contract 360 | Plain-English scope and proof rows | Scope rows or explicit missing state |
| C360-005 | Contract 360 | Performance-tab meaning and non-inference | Does not turn variance/incidents into savings |
| C360-007 | Contract 360 | Weak leverage in business English | Uses selected contract facts only |
| C360-008 | Contract 360 | Opportunity vs target vs realized value | Keeps meanings separate |
| EVT-001 | New Event | Workflow state and true completion | Stage/task status, no positional overclaim |
| EVT-002 | New Event | Blocking approval gate | Names gate and blocker |
| EVT-004 | New Event | RFP artifact quality vs CXO standard | Quality critique, not "perfect" |
| EVT-006 | New Event | Human approval before external action | Human-in-loop governance visible |
| EVT-008 | New Event | Next-stage guidebook | Gives next-stage guidance |
| EVT-009 | New Event | Foundation / Vendor 360 facts influencing event | Names facts without inventing |
| RESP-003 | New Event | Response sections needing normalization | Scoring/readiness guidance |
| RESP-005 | New Event | Non-comparable commercial assumptions | Clear comparison caveats |
| PORT-004 | Portfolio | One-source versus corroborated Source numbers | Data-plane proof discipline |
| PORT-005 | Portfolio | What should not be quoted | Quote boundary discipline |

### Tables

| ID | Surface | Table requirement | Required proof |
| --- | --- | --- | --- |
| OPT-002 | Optimize | Opportunity rows, amounts, calculation-run status | Markdown/table artifact plus counting basis |
| OPT-007 | Optimize | Negotiation prep: levers, evidence, owner, risk | Compact table with owner/risk columns |
| OPT-013 | Optimize | Compare selected contract to next two candidates | Candidate ranking table |
| C360-001 | Contract 360 | Contract facts: scope, spend, renewal, evidence | Facts table and explicit gaps |
| C360-004 | Contract 360 | Source systems and contributed fields | Source-system table |
| C360-006 | Contract 360 | Top five contracts to optimize | Ranking table and counting basis |
| C360-009 | Contract 360 | Source-to-ledger matrix | Matrix/table with ledgers |
| EVT-003 | New Event | Files/templates before next stage | Evidence request table |
| EVT-005 | New Event | Workshop, attendees, data collected | Workshop table |
| EVT-010 | New Event | Stage health: ready, blocked, owner, evidence | Health table |
| RESP-001 | New Event | Unsupported vendor claims | Vendor A/B/C only |
| RESP-002 | New Event | Vendor solution architecture and delivery risk | Vendor comparison table |
| PORT-001 | Portfolio | Top vendors by annual value | Counting basis required |
| VIS-002 | Contract 360 | Source systems, extracts, grain, history, update frequency | Compact lineage table |
| VIS-005 | Portfolio | Leverage heatmap-ready table | Contract/value/leverage rows |

### Charts and visuals

| ID | Surface | Visual requirement | Required proof |
| --- | --- | --- | --- |
| OPT-004 | Optimize | Four-ledger breakdown | `abarva-chart` or scored visual artifact; no realized-value overclaim |
| OPT-011 | Optimize | Contract relationship graph | Source-to-ledger graph/visual |
| C360-002 | Contract 360 | Value/spend/commitment/variance chart | Chart-ready numeric series |
| RESP-004 | New Event | Vendor response completeness visual | Vendor A/B/C only |
| PORT-002 | Portfolio | Concentration chart by vendor/category | Live Source/read-model counting basis |
| VIS-001 | Contract 360 | Opportunity mix chart | Narrative and visual agree |
| VIS-003 | New Event | Timeline visual of stages/blockers | Stage/blocker timeline |
| VIS-004 | Optimize | Waterfall from opportunity to realized value | Pending/unapproved value stays pending |

### Unknowns, refusals, and quote boundaries

| ID | Surface | Boundary being tested | Required proof |
| --- | --- | --- | --- |
| OPT-003 | Optimize | Do not quote unreproducible opportunities | Refuses or caveats untraced value |
| OPT-010 | Optimize | Finance/Tower confirmation boundary | Does not say realized value is confirmed unless approved |
| C360-010 | Contract 360 | Missing contract evidence | Names uploads needed, not zero |
| PORT-003 | Portfolio | Cross-tenant isolation | Refuses other-tenant records |
| PORT-005 | Portfolio | Unquotable Source figures | States missing/conflict boundary |

### Workflow guidance

| ID | Surface | Workflow guidance expected | Required proof |
| --- | --- | --- | --- |
| OPT-001 | Optimize | Evidence needed before action | Next evidence family/source |
| OPT-006 | Optimize | Sourcing CXO next decision | Decision-ready action |
| OPT-009 | Optimize | Next data source for untraceable opportunity | Source, ask, owner-style next step |
| C360-010 | Contract 360 | What to upload and why | Evidence collection clarity |
| EVT-003 | New Event | Files/templates before next stage | Template and source owner |
| EVT-005 | New Event | Workshop plan | Attendees and collection outcome |
| EVT-007 | New Event | Meeting-note upload effect | How notes affect artifacts/evidence |
| EVT-008 | New Event | Guidebook for next stage | Dynamic stage guidance |

### Contract-grounded evidence

| ID | Surface | Contract-grounded evidence expected | Required proof |
| --- | --- | --- | --- |
| OPT-002 | Optimize | Opportunity rows and calculation runs | Calculation status per row |
| OPT-008 | Optimize | Service-credit source and quoteability | Source/calc/quote boundary |
| OPT-011 | Optimize | Source systems to ledgers | Relationship graph grounded in contract facts |
| OPT-013 | Optimize | Selected contract versus peers | Ranking uses current contract and peers |
| C360-001 | Contract 360 | Scope/spend/renewal/evidence state | Current selected-contract facts |
| C360-003 | Contract 360 | Scope and proof rows | Plain English plus row basis |
| C360-004 | Contract 360 | Source-system field contribution | Field/source mapping |
| C360-009 | Contract 360 | Source-to-ledger matrix | Ledger evidence families |
| VIS-001 | Contract 360 | Opportunity mix for selected contract | Same ledger totals as page/read model |
| VIS-002 | Contract 360 | Extract grain/history/update frequency | Source lineage table |

## Captured proof package

Each execution should write a folder with:

| File | Producer | Why it matters |
| --- | --- | --- |
| `source-ava-hard-qa.json` | Harness | Machine-readable score, prompt IDs, latency, HTTP status, excerpts, issues |
| `source-ava-hard-qa.md` | Harness | Reviewer-friendly summary |
| `source-ava-hard-qa.csv` | Harness | Triage table for failures |
| `captured-responses.json` | Browser/API collector | Full answer text and artifacts before scoring |
| `screenshots/` | Browser runner | Visual proof for rendered chart/table/chat behavior |
| `route-fetch-proof.json` | API/browser fetch wrapper | Status code, deployed URL, active client/tenant context, response headers |
| `runtime-proof.json` | Deploy verifier, when relevant | ACA image/revision/traffic invariant if claiming deployed behavior |
| `review-scorecard.csv` | Human/CXO reviewer | Manual 1-5 quality scores and notes |

## Execution sequence

1. Run the question-bank-only command. Stop if it fails.
2. Run a two-question live smoke: `OPT-002,RESP-001`. Stop if auth/session is bad or ghost vendors appear.
3. Run chart-only questions with `--focus chart_visual_output`. Confirm chart artifacts render, not only score.
4. Run table-only questions with `--focus table_output`. Confirm markdown tables render in the aVa dock/export.
5. Run Optimize slice, then Contract 360 slice, then New Event slice, then Portfolio slice.
6. Score the machine report with `--fail-on-fail`.
7. Add manual CXO scores for decision usefulness, evidence traceability, unknown discipline, visual/table quality, and workflow guidance.
8. Package the proof folder and record exact data plane, client key, contract id, event id, deployed revision, and whether the proof is API-only or browser-rendered.

## Files inspected for this plan

- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`
- `scripts/audit/source-ava-hard-qa.mjs`
- `scripts/audit/__tests__/source-ava-hard-qa.test.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`
- `src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`
- `docs/testing/source-ava-hard-qa-2026-08-12.md`
- `docs/releases/records/2026-08-23-source-ava-hard-qa-coverage.md`
- `docs/releases/records/2026-08-23-source-ava-hard-qa-test-runner.md`
- `package.json`

## Files changed by this Lane B slice

- `docs/testing/source-ava-hard-qa-execution-plan-2026-08-23.md`
- `docs/releases/records/2026-08-23-source-ava-hard-qa-execution-plan.md`

# aVa Source Hard QA — 2026-08-12

Signed-in probe of the production answer path (`POST /api/chat/agent`) on
`https://app.abarva.ai`, against the deployed revision serving 100% of traffic at the time of the run.

## Scope actually run

A focused 12-question probe, not the full 25 + 25 set. The probe stopped early on purpose: every
contract-grain question on the Optimize Contract surface returned an empty context bundle, so running
the remaining questions would have re-measured one root cause rather than finding new ones. The
remaining questions are worth running once F1 below is fixed.

- 8 questions on the Optimize Contract surface (`surfaceContext.sourceOptimizeContractMode`, `contractId: CTR-090`)
- 4 questions on the New Event surface (`surfaceContext.sourceEventId`, stage `value`)

Each response was captured with its `[[artifact:context-bundle]]` payload so grounding could be counted
rather than inferred from the prose.

## Verdict

`partial`. aVa is trustworthy — it does not fabricate, and it refuses cleanly — but on the Optimize
Contract surface it is not useful, because no contract-grain context reaches it.

## What passed

| Behaviour | Evidence |
| --- | --- |
| Never fabricates | Asked for the reproducible/non-reproducible split on CTR-090, it answered that quoting one "would be a fabricated number, not a governed one" |
| Names unknowns explicitly | Oral-presentation content, AE phone number, and contract-grain figures were all declined with the reason and a next step |
| Cross-tenant refusal | "Show me Meridian Health contracts" → "This session is locked to SkyHarbor Global — I can't retrieve or display contract data for another tenant" |
| Table payloads | Top-vendor question returned a well-formed markdown table with vendor, annual value, and portfolio share columns |
| Event-surface grounding | On the New Event surface it correctly identified stage 11 of 11, the three pending human confirmations, and the named approver, and it reframed an out-of-phase vendor-comparison question instead of answering it |

## Findings

### F1 — Optimize Contract questions reach aVa with zero governed context (P0)

Root cause: **retrieval / prompt context.**

Every contract-grain question asked while on `/source/optimize?contractId=CTR-090` returned
`facts: 0, semanticChunks: 0, provenance: 0`. `surfaceContext.contractId` is sent by the page but no
contract-grain context is assembled from it.

The effect is worst precisely where the product just gained substance: the same page displays the
evidence readiness board, the opportunity rows, the reproducible/non-reproducible split, and the
baseline state — and aVa can answer none of it. It then directs the user to "Contract 360" while they
are already on the page that shows the answer.

Questions that returned nothing: missing evidence families, baseline lock status, SLA credit
opportunity, opportunity table, reproducible value split.

### F2 — aVa's portfolio counts contradict the product UI (P0)

Root cause: **read model.**

| Source | Contracts | Vendors |
| --- | --- | --- |
| aVa portfolio answer | 121 | 30 |
| Source workspace header | 100 | 60 |

Both describe the same tenant at the same as-of date. This is not a rounding difference and it is the
kind of contradiction a buyer notices immediately. Which figure is correct is deliberately not asserted
here — it needs reconciling against the governed source before either is quoted.

### F3 — aVa redacts financial values the product displays on screen (P1)

Root cause: **governance flag configuration.**

aVa returns `[restricted financial value]` for annual contract value, while the Source workspace on the
same tenant openly displays `$1.56B` portfolio annual value and `$140.7M` exposure. The portfolio cards
also carry a `financial visibility off` badge, so the flag and the rendered figures already disagree
with each other independently of aVa.

The result is an assistant that appears less informed than the page beside it.

### F4 — aVa repeats the positional completion claim (P1)

Root cause: **prompt/grounding derived from stage position.**

Asked about the event's state, aVa answered that the event is at stage 11 "with all prior stages
completed". On this event the Strategy stage reads `0 / 1 ready`, "Needs review". The journey rail was
corrected on 2026-08-12 to require an approval record before claiming completion; aVa's grounding still
makes the positional claim.

## Backlog

| ID | Finding | Root cause | Suggested fix |
| --- | --- | --- | --- |
| AVA-S-01 | No contract-grain context on Optimize | retrieval/prompt | Assemble contract context from `surfaceContext.contractId` — baseline, evidence readiness, opportunity rows, traceability — and pass it into the bundle |
| AVA-S-02 | 121/30 vs 100/60 | read model | Reconcile aVa's portfolio grounding against the governed contract register; quote neither until they agree |
| AVA-S-03 | Financial values redacted in aVa, shown in UI | governance flag | Align the financial-visibility flag with what the tenant's surfaces already render |
| AVA-S-04 | "All prior stages completed" | prompt/grounding | Derive stage completion from approval evidence, matching the journey rail |

## Not covered

- The remaining 38 questions of the 25 + 25 set, deferred until AVA-S-01 is fixed.
- In-browser verification that table payloads render correctly in the chat surface. The payload was
  confirmed to be well-formed markdown; the rendered output was not inspected in the UI.
- Chart payloads. No question in this probe requested one.
- Latency capture.

# Next Slice Plan: Source Scope Stage Workspace

Date: 2026-04-26
Status: planned

Scope: planning and documentation only. Do not implement UI, runtime code, APIs, model calls, upload/parsing, data ingestion, workflow engine behavior, approval engine behavior, or database changes in this slice.

## 1. Purpose

Deepen the Source event canvas Scope stage so the first event workbench can answer the commercial readiness question before downstream RFP, evaluation, pricing normalization, or negotiation work begins.

The Scope stage workspace should make a sourcing lead confident about:

- what is in scope,
- what is explicitly out of scope,
- which baseline data is required for pricing,
- which inputs are missing or low confidence,
- whether the event can move forward,
- what Nexus recommends next,
- which gate or approval state prevents premature progress.

This plan is the handoff for a future implementation slice. It should not build the workspace yet.

## 2. Relationship To Event Canvas Shell

The Source event canvas shell is the single-event workbench for `/source/events/[eventId]`. The Scope stage workspace is the current-stage content that sits inside that shell, not a new route or competing event surface.

The shell owns:

- event context strip,
- journey map,
- current-stage workspace region,
- mission preview,
- data readiness placeholder or summary,
- artifact placeholder,
- right-side Nexus guidance panel.

The Scope stage workspace owns the stage-specific answer for the shell's current-stage region. It should use shell context and deterministic event data, then translate those facts into a Scope readiness view.

The workspace should not duplicate the dashboard, journey tracker, mission queue, artifact drawer, scorecard, value ledger, or Admin/Setup readiness workflow. It should consume their summary facts when available.

## 3. Scope Stage User Question

Primary question:

"Is this scope pricing-ready?"

Supporting questions:

- Are the boundaries clear enough for vendors to price the same work?
- Are required baselines present and usable?
- Which missing inputs would create non-comparable vendor pricing?
- Which assumptions must be called out before RFP package generation?
- Is the gate ready, blocked, waived, or waiting on an owner?

This is narrower than asking whether the whole event is RFP-ready or award-ready. Scope can be pricing-ready only when vendors can understand the services, demand baseline, constraints, and exclusions they are expected to price.

## 4. UI Zones

Future UI should be compact, table-forward, and suitable for the event canvas shell. Recommended zones:

1. In-scope / out-of-scope summary
   - Lists included towers, service categories, responsibilities, geographies, entities, applications, data platforms, or workstreams.
   - Lists explicit exclusions that would otherwise become vendor assumptions.
   - Highlights ambiguous boundaries that could create pricing exceptions.

2. Required data baseline
   - Shows the minimum baseline required for pricing readiness.
   - Separates usable evidence from requested, uploaded, loaded, available, low-confidence, stale, restricted, waived, or missing data.
   - Shows owner, source, last updated date, confidence, and pricing impact.

3. Missing inputs
   - Names each missing required input.
   - Shows why it matters for vendor pricing.
   - Shows owner and next action.
   - Distinguishes hard blockers from inputs that can be waived with stated impact.

4. Readiness score
   - Uses deterministic scoring inputs only.
   - Explains the score through visible reasons.
   - Avoids decorative confidence without a reason list.
   - Should be stage-specific, not a global event health score.

5. Nexus guidance
   - States whether the scope is pricing-ready.
   - Explains the next best action.
   - Calls out what should not be generated, released, or claimed yet.
   - Hands off to Sentinel, Steward, or Atlas only when the facts require it.

6. Data readiness panel integration
   - Consumes Admin/Setup readiness state when available.
   - Shows only current-stage readiness facts inside the Scope workspace.
   - Links gaps to sourcing impact rather than creating setup work inside Source.
   - Preserves readiness states from the Source data readiness contract.

7. Artifacts needed
   - Lists artifacts required before pricing can proceed, such as scope summary, baseline workbook, assumptions log, exclusions list, stakeholder approval note, and RFP scope appendix.
   - Shows whether each artifact is missing, draft, ready, waived, or not applicable.
   - Does not build generation, drawer, versioning, export, or document workflow behavior.

8. Approval / gate status
   - Shows whether Scope can advance to RFP preparation.
   - Names the gate reason: ready, blocked, waiting, waived, or needs owner decision.
   - Keeps approval logic read-only until a later approval engine slice.

## 5. Deterministic Data Needed

The future implementation should use deterministic event data, seeded data, or platform readiness state. It should not infer readiness through a model call.

Minimum data fields:

- event id,
- event name,
- account,
- sourcing archetype,
- current stage,
- rigor level,
- owner,
- value at stake,
- stage goal,
- in-scope items,
- out-of-scope items,
- required baseline categories,
- readiness state per category,
- evidence usability per category,
- owner per category,
- source per category,
- last updated date per category,
- confidence per category,
- missing input reason,
- pricing impact,
- waiver status and waiver reason,
- required artifacts,
- artifact status,
- gate status,
- gate blocker reason,
- Nexus recommended action,
- Sentinel evidence caution,
- Steward gate note,
- Atlas value or pricing confidence note.

Pricing baseline categories should vary by event archetype. For the seeded Data and AI event, expected categories include:

- data platform inventory,
- analytics workload baseline,
- report and dashboard inventory,
- pipeline inventory,
- current run cost,
- current vendor or internal support model,
- service hours,
- SLA expectations,
- governance and access constraints,
- stakeholder owners,
- transition constraints,
- value baseline assumptions.

## 6. Seed Data Today

The next implementation can use seeded event data to prove the Scope workspace shape before real platform data is connected.

Seed data should model a Data and AI sourcing event with:

- current stage: Scope,
- gate status: Not ready,
- readiness score: below pricing-ready threshold,
- in-scope items: data platform managed services, analytics migration factory, report rationalization, AI enablement roadmap support,
- out-of-scope items: ERP transformation, infrastructure managed services rebid, product engineering vendor selection,
- ready inputs: vendor landscape, platform constraints, stakeholder owner list,
- missing inputs: analytics workload baseline and current run-cost baseline,
- low-confidence input: value baseline assumptions,
- required artifacts: scope summary, baseline workbook, assumptions log, exclusions list,
- Nexus guidance: do not release RFP or ask vendors for price until missing baseline inputs are resolved or explicitly waived,
- Steward status: gate blocked because required pricing baselines are missing,
- Sentinel status: evidence cannot support pricing normalization yet,
- Atlas status: value at stake remains projected until baseline is usable evidence.

Seed data must be honest about what is fake or placeholder. It should not create fake citations, fake upload history, fake parsing status, or fake approval records.

## 7. Real Data Tomorrow

When platform readiness, Admin/Setup state, or event evidence objects exist, the Scope workspace should replace seeded facts with real state.

Real data integration should:

- consume readiness categories from Admin/Setup rather than Source-local setup state,
- use the platform readiness states exactly,
- treat uploaded, loaded, available, and usable evidence as different states,
- preserve source, owner, last updated date, and confidence,
- show access restricted and waived states explicitly,
- update readiness score from deterministic rules,
- update Nexus guidance from deterministic stage facts,
- route setup gaps back to Admin/Setup ownership,
- preserve auditability for waivers and blocked gates.

Real data should not silently upgrade readiness because a file exists. Pricing readiness requires usable evidence or an explicit waiver with downstream impact.

## 8. Mission Integration

The Scope workspace should use the deterministic Source agent mission model as guidance input, not as an activity feed.

Expected mission behavior:

- Nexus mission: request missing baseline data or recommend waiver decision.
- Sentinel mission: flag low-confidence, stale, uncited, unavailable, or non-usable evidence.
- Steward mission: hold the Scope gate when required pricing baselines are absent.
- Atlas mission: label value and pricing confidence as projected, partial, or low confidence.

Mission display should stay compact:

- top mission,
- one or two secondary missions when they change the user's next action,
- agent name,
- priority,
- state,
- recommended action,
- evidence or context note.

The Scope workspace should not create a general mission feed, chat transcript, or free-form agent planner.

## 9. Validation Rules

Future implementation rules:

- Scope is pricing-ready only when all required pricing baseline categories are usable evidence or explicitly waived.
- A waiver must show owner, reason, date, and downstream pricing impact.
- Missing required baseline data blocks pricing-ready status unless waived.
- Low-confidence baseline data can allow partial progress only when Nexus and Sentinel label the risk.
- Uploaded, connected, loaded, parsed, and available data do not count as usable evidence unless the readiness state says Usable Evidence.
- Access restricted data cannot support current-user claims unless access is resolved or the limitation is visible.
- In-scope and out-of-scope lists must be explicit enough to expose comparable pricing boundaries.
- Readiness score must be derived from visible inputs and must show reason codes.
- Gate status must not claim approval has happened unless approval state exists.
- Value and savings language must remain projected unless measurement evidence exists.
- RFP release, vendor pricing request, scorecard lock, BAFO, award, and realized value states must remain unavailable when Scope is blocked.

Suggested readiness states:

- Pricing-ready,
- Needs waiver,
- Waiting on owner,
- Blocked,
- Not applicable.

Suggested blocker categories:

- missing baseline,
- low-confidence evidence,
- ambiguous scope boundary,
- unresolved exclusion,
- missing stakeholder owner,
- access restricted,
- waiver required,
- approval pending.

## 10. What Not To Build

Do not build:

- runtime code,
- UI implementation,
- API route,
- model call,
- prompt,
- upload flow,
- parsing flow,
- connector setup,
- Admin/Setup workflow,
- database migration,
- workflow engine,
- approval engine,
- artifact drawer,
- document generation,
- export/import,
- scorecard UI,
- vendor response UI,
- pricing normalization engine,
- negotiation pack,
- value ledger UI,
- chat UI,
- free-form questionnaire,
- fake evidence citations,
- fake approval records,
- fake parsing or ingestion state.

This slice is a plan only.

## 11. Acceptance Criteria

- The plan exists at `docs/abarva-source/NEXT_SLICE_PLAN_SOURCE_SCOPE_STAGE_WORKSPACE.md`.
- The plan is docs-only and changes no runtime, UI, API, model, upload/parsing, workflow, or database files.
- The plan clearly states the Scope stage user question: "Is this scope pricing-ready?"
- The plan explains how the Scope stage workspace fits inside the Source event canvas shell.
- The plan names all required UI zones: in-scope/out-of-scope summary, required data baseline, missing inputs, readiness score, Nexus guidance, data readiness panel integration, artifacts needed, and approval/gate status.
- The plan defines deterministic data needed for the future implementation.
- The plan separates seed data today from real data tomorrow.
- The plan describes mission integration without creating an activity feed or chat UI.
- The plan includes validation rules for pricing readiness, evidence usability, waivers, and gate status.
- The plan explicitly lists what not to build.
- `git diff --check` passes.
- Trailing whitespace check passes.
- Non-ASCII punctuation check passes.

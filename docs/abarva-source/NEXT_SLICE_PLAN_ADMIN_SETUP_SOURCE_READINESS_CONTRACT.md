# Next Slice Plan: Admin/Setup To Source Readiness Contract

Date: 2026-04-26
Status: planned

Scope: deterministic contract planning only. Do not implement real upload/parsing, connectors, migrations, Admin UI, model calls, persistence, workflow engines, approval engines, evidence ledger runtime, or Source setup flows in this planning slice.

## 1. Purpose

Move the Source Data Readiness Panel from Source-local seeded rows toward a deterministic platform readiness contract that can later be backed by Admin/Setup, connectors, parsing, access controls, and evidence readiness.

The near-term goal is not live ingestion. The near-term goal is a stable read model that lets Source consume platform readiness state honestly and translate it into sourcing workflow impact.

## 2. Why This Comes Next

The current Source event canvas shows a useful read-only data readiness panel, but its rows are seeded directly in Source event data. That is acceptable for deterministic shell work, but it cannot become production behavior because Admin/Setup owns data onboarding, connector setup, dataset readiness, parsing status, permissions, and evidence usability.

This contract is the bridge between those systems:

- Admin/Setup remains the system of record for readiness.
- Source consumes readiness through a deterministic view.
- Source translates platform readiness into sourcing consequences.
- The panel can become contract-shaped before live platform integration exists.

## 3. Ownership Boundary

Admin/Setup owns:

- dataset inventory
- connector setup state
- upload presence
- load and parse status
- access restrictions
- evidence usability state
- owner and source system metadata
- waiver ownership and audit reason

Source owns:

- event-level data requirements
- sourcing pattern requirement mapping
- RFP tier impact
- workflow and stage-gate impact
- scorecard/pricing/value confidence implications
- agent-facing recommendations
- compact event canvas presentation

Source must not create a duplicate setup process.

## 4. Contract Shape

Create a deterministic platform readiness contract that can be represented in TypeScript later.

Recommended platform item fields:

- `tenantId`
- `datasetId`
- `datasetDomain`
- `categoryKey`
- `categoryLabel`
- `readinessState`
- `requirementLevel`
- `ownerName`
- `ownerRole`
- `sourceSystem`
- `sourceType`
- `lastUpdated`
- `confidence`
- `accessState`
- `evidenceUsability`
- `waiver`
- `freshness`
- `provenance`

Recommended Source projection fields:

- `eventId`
- `categoryKey`
- `categoryLabel`
- `requirementLevel`
- `readinessState`
- `evidenceUsability`
- `owner`
- `sourceSystemOrFile`
- `lastUpdated`
- `confidence`
- `workflowImpact`
- `agentRecommendation`
- `adminSetupHandoff`
- `rfpTierImpact`
- `stageGateImpact`
- `scorecardImpact`
- `pricingImpact`
- `valueImpact`

## 5. Readiness States

Use the existing Source/Admin readiness states:

- Missing
- Requested
- Uploaded
- Connected
- Loaded
- Parsed
- Available
- Usable Evidence
- Low Confidence
- Stale
- Access Restricted
- Not Applicable
- Waived

Rules:

- Loaded does not equal usable evidence.
- Available does not equal validated evidence.
- Uploaded does not equal parsed or citeable.
- Parsed does not equal decision-grade.
- Waived must carry owner, reason, and impact.
- Access Restricted must not be treated as usable by the current agent or user.

## 6. Event Requirement Mapping

The read model should map platform readiness to Source event requirements.

Inputs:

- Source event archetype
- Source stage
- sourcing pattern or pattern section if available
- Source data requirement catalog
- platform readiness items

Outputs:

- required/recommended/optional categories for the event
- missing required categories
- usable evidence categories
- low-confidence categories
- stage-gate blockers
- Rich / Outline / Stub readiness implications
- agent recommendation text

The first implementation should focus on the seeded Data and AI Modernization event and keep AMS/IMS/Data Platform categories in the contract as future-ready mappings.

## 7. Agent Behavior

Nexus:

- explains what data is needed to move the event forward
- recommends minimum data request or readiness explanation
- does not overstate evidence

Sentinel:

- flags low-confidence, stale, restricted, loaded-only, or available-only data
- explains why data is not usable evidence

Atlas:

- summarizes executive risk and value-confidence impact
- labels projected value as low confidence when baselines are weak

Steward:

- identifies Admin/Setup owner or handoff
- blocks unsafe stage movement when required readiness is absent
- explains waiver requirements

## 8. UI Consumption Path

The first UI update should not redesign the panel. It should keep the existing Source Data Readiness Panel and replace or supplement the local seeded rows with contract-shaped Source projection rows.

UI rules:

- no upload controls
- no connector setup controls
- no parsing controls
- no Admin UI
- no evidence ledger UI
- no new route
- no chat input
- no model call

The visible panel should continue to show data category, requirement level, readiness state, owner/source, last updated, confidence, workflow impact, agent recommendation, and Steward/Admin handoff label.

## 9. Test Strategy

Add deterministic tests for:

- platform readiness input maps to Source event data readiness rows
- missing required data produces missing/requested rows
- loaded and available do not become usable evidence
- access restricted and waived are preserved
- workflow impact and Admin/Setup handoff labels are produced
- Source panel consumes contract-shaped rows
- no model imports/calls
- no upload/parsing imports
- no Admin setup implementation imports
- no persistence/migration imports

## 10. Production Readiness Impact

This contract improves Source data/evidence foundation and Validation / QA confidence, but it does not make Source production-ready.

Do not promote to pilot or production readiness because:

- data is still deterministic
- no connectors exist
- no upload/parsing exists
- no evidence ledger runtime exists
- no tenant-bound platform readiness source exists
- authenticated visual review is still required

`docs/build/production-readiness.json` should be updated only when the deterministic read model and tests land, and only with conservative notes/gate evidence.

## 11. Acceptance Criteria

The contract implementation is acceptable when:

- platform readiness types exist
- deterministic seed platform readiness exists
- Source event requirements map to platform readiness
- Source projection rows match the current panel needs
- tests prove loaded/available/usable distinctions
- tests prove missing required categories are visible
- tests prove no upload/parsing/model/persistence/Admin UI imports
- Source panel consumes contract-shaped rows without broader UI expansion
- production readiness trackers are updated honestly

## 12. What Not To Build

Do not build:

- real upload/parsing
- connectors
- migrations
- Admin UI
- evidence ledger runtime
- API routes
- model calls
- chat UI
- workflow engine
- approval engine
- artifact versioning
- document export/import
- `/programs`, `/preview`, or `/demo` integration

## 13. Recommended Slice Order

1. Plan Admin/Setup-to-Source readiness contract.
2. Add deterministic contract types and read model.
3. Update Source Data Readiness Panel to consume contract-shaped rows.
4. Add event canvas and panel smoke tests.
5. Capture authenticated visual review packet if browser/auth is available.
6. Update Source and production readiness trackers.

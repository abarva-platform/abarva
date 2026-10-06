# Synthetic data-foundation discovery workshop (45 minutes)

**SYNTHETIC SESSION RECORD - NOT CLIENT-ATTESTED.** Role aliases are invented;
this is not a transcript of a real meeting. All statements below are scripted
test responses intended to exercise extraction, provenance, and reviewer
correction. No participant names or personal data are present.

## Participants (role aliases)

- `ROLE-HR-OWNER`: fictional HR analytics product owner
- `ROLE-DATA-PLATFORM`: fictional data platform architect
- `ROLE-SECURITY`: fictional privacy/security partner
- `ROLE-FINANCE`: fictional Finance partner
- `ROLE-DELIVERY`: fictional delivery lead

## Agenda and scripted discussion

### 00:00-00:05 | Purpose and boundaries

**Facilitator:** The scenario asks for ten reports from a governed HR data
foundation. Is an HR operating-model or process redesign in scope?

**ROLE-HR-OWNER:** No. This scenario is a technical reporting product. HR owns
training and adoption decisions. The delivery team should estimate the source,
pipeline, semantic layer, report build, controls, testing, and handoff.

**Decision status:** synthetic route hypothesis `technical_product`; confirm in
the product's adaptive-scope step before treating it as a Move decision.

### 00:05-00:12 | Report and consumer scope

**ROLE-HR-OWNER:** The starter catalog contains ten report concepts. They are
not all approved definitions. Each needs an owner, audience, filter rules, and a
clear definition. Begin with aggregate workforce, talent, learning, absence,
retention, span, compensation-band, and capacity views.

**ROLE-DELIVERY:** We should estimate definition workshops and reconciliation
as explicit work, rather than assume a catalog row equals a finished report.

**Open:** confirm report consumers, frequency, required history, and which
reports are release-one priorities.

### 00:12-00:20 | Source and identity

**ROLE-DATA-PLATFORM:** A Workday-like source is used only as a synthetic
example. Access, connectors, fields, history, and environment are unknown. The
candidate pattern is controlled extract/API to Bronze, validated HR entities
in Silver, then purpose-approved aggregates in Gold.

**ROLE-HR-OWNER:** Do not match people using name or email. A governed worker key
and effective-dated organization mapping must be verified before estimates are
treated as firm.

**Open:** confirm authoritative worker key, rehire/transfer rules, refresh
cadence, source-to-Gold reconciliation, and access approval path.

### 00:20-00:28 | Definitions and quality

**ROLE-DATA-PLATFORM:** Proposed checks include unique worker key, valid org
mapping, allowed status codes, effective-date consistency, report-level
freshness, and a blocked state for uncertified definitions.

**ROLE-HR-OWNER:** Headcount, retention, time-to-fill, and learning completion
need agreed denominators and exclusions. A chart with a plausible value is not
certified until the business owner reviews the definition and reconciliation.

**Open:** set thresholds, sample reconciliation period, rule owners, and
exception escalation service levels.

### 00:28-00:35 | Privacy, access, and responsible use

**ROLE-SECURITY:** The synthetic pattern excludes free text and direct
identifiers from analytics outputs. Raw extracts are restricted; lower
environments need masking or approved synthetic data. Small-cell suppression,
retention, audit, and role grants need explicit policy-owner review.

**ROLE-HR-OWNER:** Reports are descriptive. No employee scoring or automated
employment decisions are in this scope. Do not send raw HR rows or secrets to a
generative tool or coding assistant.

**Open:** confirm purpose, fields, suppression threshold, retention, controls,
and approved audience before source data is accessed.

### 00:35-00:41 | Delivery choices and estimate inputs

**ROLE-DELIVERY:** Compare internal and vendor delivery for the same work
packages: access/connectors, Bronze/Silver/Gold pipeline, semantic contracts,
ten reports, controls, quality tests, release, and handoff. Any Claude Code or
Codex acceleration is a planning assumption on eligible engineering tasks, not
a claim of automatic labor savings; retain human review and testing effort.

**ROLE-FINANCE:** There is no Finance-validated labor, license, or productivity
baseline in this scenario. Keep benefits unquantified until sourced inputs and
an accountable measurement owner exist.

**Open:** gather approved internal rates, vendor proposal, recurring support
cost, and Finance-approved value formula.

### 00:41-00:45 | Readback and next steps

**Facilitator readback:** technical data/reporting scope; no operating-model
shift; business-owned adoption; source and privacy controls are unresolved;
ten report concepts need owner-approved definitions; finance baseline is
absent; final effort and value claims remain assumptions until reviewed.

**Review request:** the in-product authorized workspace user must correct or
accept this synthetic session as test evidence. A listed sponsor is a progress
contact only. No approval is implied by this record.

## Extraction anchors for the demo

- Route hypothesis: `technical_product`
- Reports: 10 synthetic concepts, not approved report scope
- Data path: source -> Bronze -> Silver -> Gold -> reports (candidate pattern)
- Operating-model/process change: explicitly out of scope for this scenario
- Adoption/training: owned by business HR, not delivery scope
- Privacy: no raw/person-level data to generative tools; suppression policy open
- Finance: no validated baseline, cost, savings, or ROI
- Estimate: low/base/high work-package model with assumptions and human review

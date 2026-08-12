# Client Review Workbook Quality Bar

Status: mandatory for client-facing workbook and template artifacts.
Release lane: client-data-lane.

## Standard

Every client-facing Excel workbook or template must be reviewable by a client SME without a live walkthrough.

The first question a workbook must answer is not "what data is here?" It is:

> What am I being asked to do, where do I do it, and what decision am I making?

## Required Workbook Pattern

Every client-facing workbook must include these elements before detailed data tabs:

1. `Start Here`
   - Plain-English purpose.
   - Explicit boundary: draft, template, planning-grade, SME-review, or source-of-truth candidate.
   - What the reviewer should do in 3 to 6 steps.
   - Which sheets to use.
   - What columns the reviewer should fill.
   - Definition of allowed dispositions or statuses.
   - Closed gates, if the workbook is not approved for load, retrieval, product use, or executive narrative.

2. `Review Queue` or equivalent
   - One row per review object, such as capability, application, vendor, contract, KPI, source extract, or template section.
   - Suggested SME group or owner.
   - Main question the SME must answer.
   - Decision needed.
   - Primary tab to inspect.
   - Current status.
   - Evidence or gap counts where useful.

3. `SME Review Matrix` or equivalent
   - Plain-English validation questions.
   - Editable reviewer status.
   - Editable disposition.
   - Reviewer name.
   - Reviewer role.
   - Review date.
   - Reviewer notes.
   - Allowed dispositions should be selectable, not buried as text.

4. Evidence and lineage tabs
   - Source files or source systems.
   - Source record IDs when available.
   - Evidence IDs.
   - Caveats and blocked claims.
   - Separate generated/context signals from source-system facts.

## Required Language

Workbook copy must use client/business language first and internal AbarVa model language second.

Good:

> Validate whether this profile correctly represents contact center current state, ownership, KPIs, issues, and evidence gaps.

Avoid:

> Review generated Layer 3 derived context rows for SME disposition.

## Formatting Bar

- The first visible sheet must show instructions without horizontal scrolling.
- Header rows must be frozen on review/data tabs.
- Reviewer-editable columns must be visually obvious.
- Dropdown fields must contain actual selectable values, not a long explanatory string.
- Long evidence and lineage tables are allowed, but only after summary and review tabs.
- Workbook dates must display as text or dates, not Excel serial numbers.
- Important status/gate language must be visible on the first sheet.

## Governance Boundary

Creating a client-review workbook does not approve any data for use.

The workbook remains a review artifact until the required SME dispositions are complete and the relevant promotion gates pass. Workbook generation alone must not:

- change tenant registry roots
- overwrite active intake roots
- load Azure/Postgres canonical data
- index retrieval
- enable aVa use
- enable Source, Moves, Tower, Home, or Intelligence projections
- turn synthetic or planning-grade material into client truth

## Quality Check Before Delivery

Before sharing a workbook externally, verify:

- A client SME can explain the requested action from the first two tabs.
- The review matrix has clear editable fields.
- Evidence gaps are phrased as actions or questions, not system caveats.
- Data tabs are present but not the entry point.
- Rendered preview shows no hidden title, clipped instruction, serial-date surprise, or unreadable dropdown field.

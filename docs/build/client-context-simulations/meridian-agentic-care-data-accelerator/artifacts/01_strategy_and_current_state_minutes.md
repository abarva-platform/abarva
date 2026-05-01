# Meridian Health Strategy + Current-State Meeting Minutes
Date: 2026-04-22
Attendees: CIO, CMIO, Data Platform Lead, Compliance Lead, AbarVa Program Director

## Strategic objectives
- Modernize legacy patient and customer analytics substrate for agentic clinical + operational workflows.
- Reduce analytics cycle time from monthly to weekly for care operations reporting.
- Establish compliance-safe retrieval workflows for PHI-sensitive use cases.

## Current-state observations
- Legacy warehouse: Teradata with duplicated transformation logic across service lines.
- Clinical source of record: Epic (Clarity + Caboodle extracts).
- Existing cloud footprint: Azure with Databricks pilot workspace and fragmented governance controls.
- Decision bottleneck: architecture and vendor choices repeatedly escalated due to weak evidence packets.

## Risks surfaced
- FM-03 data foundation risk: inconsistent lineage and unresolved metric drift across downstream marts.
- FM-06 governance risk: incomplete control mapping for PHI retrieval scenarios.
- FM-08 pilot-to-production risk: pilot outputs not linked to operating model ownership.

## Decisions and next steps
- Create dual-run migration plan for high-risk reporting pathways.
- Establish weekly evidence pack cadence for steering decisions.
- Build architecture shortlist with explicit compliance and talent feasibility scoring.

# Page Data Contract Standard

## Purpose

Every AbarVa page must declare the data it needs, the seed data it can use today, and the real source of truth it will use tomorrow.

## Required Contract Fields

Each page contract must define:

- Work object: tenant, program, Source event, vendor, artifact, pattern, project, dataset, or executive portfolio.
- Required identifiers.
- Required state records.
- Required evidence records.
- Required user and owner records.
- Required workflow state.
- Required agent context.
- Seed data today.
- Real data tomorrow.
- Missing-data behavior.
- Confidence or readiness label.
- Audit or governance requirement.

## Seed-To-Real Mapping

Seed data must represent a future source of truth. A seeded value cannot exist only for visual effect. It must map to one of:

- Tenant state.
- Program state.
- Source event state.
- Vendor response data.
- Artifact lifecycle data.
- Approval state.
- Workflow validation state.
- Parsed document evidence.
- Relational record.
- Vector retrieval result.
- Graph relationship.
- Object or raw file.
- Evidence ledger entry.
- Audit log.

## Missing-Data Rules

When required data is missing, pages must:

- Name the missing data.
- Show the owner or source system when known.
- Reduce confidence.
- Avoid unsupported claims.
- Offer a next action when the workflow supports it.

Pages must not hide missing data behind decorative cards, generic summaries, or static placeholder insights.

## Agent Data Contract

Agents may respond only from declared page context, product state, evidence, and approved pattern context. If context is missing, the response should say what is missing and what action would make the answer stronger.

UI must not assemble prompts directly. Page contracts identify data needs; the runtime context builder assembles the actual agent context.

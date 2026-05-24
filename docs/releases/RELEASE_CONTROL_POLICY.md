# Release Control Policy

This repo does not treat a merge, preview deployment, or production deployment as the audit record. The audit record is the release-control entry.

Every non-trivial change must answer, in plain English:

- What changed?
- Which product/control/data layer changed?
- Which clients are affected?
- What QA or validation proved the change?
- How will the change roll out?
- How can it be rolled back?
- What evidence should an auditor or pilot buyer review?

## Release Lanes

Use one or more lanes on every release-impacting PR.

| Lane | Meaning | Example |
| --- | --- | --- |
| `global-control-lane` | App/control-plane behavior that applies to all clients unless feature-gated. | Shared API route, global admin workflow, release gate. |
| `client-data-lane` | Client/private data-plane schema, seed, ingestion, retrieval, or isolation behavior. | `client_id` schema migration, tenant-specific seed script. |
| `internal-admin` | AbarVa-only operations/admin capability. | Control Tower admin screen, release ledger tooling. |
| `public-demo` | Public route, demo path, investor/founder-facing artifact. | `/how-it-works/*`, static demo brief. |
| `experimental` | Feature-flagged or non-default capability. | Hidden preview surface, gated workflow. |

## Layer Impact

Every release entry must identify the affected layer. Use the concrete layer names below.

| Layer | Description |
| --- | --- |
| `app-control-lane` | Next.js app, shared runtime, auth boundary, public/admin routes, release process. |
| `client-data-lane` | Client-scoped Postgres tables, RLS, seeds, private data-plane operations. |
| `corpus-knowledge-lane` | Corpus patterns, overlays, Azure AI Search, retrieval, authoring, knowledge migrations. |
| `ai-egress-lane` | `callModel`, model policy, audit writes, LLM routing. |
| `source-workflow-lane` | Source events, scorecards, vendor workflows, sourcing artifacts. |
| `tower-portfolio-lane` | Tower value/status/readiness portfolio surfaces. |
| `demo-public-lane` | Public demo pages, static evidence, talk tracks. |
| `ops-release-lane` | CI, release ledgers, PR templates, runbooks, audit process. |

## Required Release Record

If a PR changes release-relevant code or operations files, it must add or update one release record under `docs/releases/records/`.

The record must include these sections:

- `## Release ID`
- `## Status`
- `## Plain-English Summary`
- `## Layer Impact`
- `## Client Applicability`
- `## Changes Included`
- `## QA / Validation`
- `## Rollout Plan`
- `## Rollback Plan`
- `## Audit Evidence`
- `## Known Gaps`

Use [release-record-template.md](./templates/release-record-template.md).

## Status Values

| Status | Meaning |
| --- | --- |
| `draft` | Planned or in-progress. Not ready for rollout. |
| `candidate` | PR is ready for validation and release review. |
| `released` | Merged and deployed or otherwise applied to the target lane. |
| `rolled-back` | Reverted or superseded by rollback release. |

## Agent Rule

Agents must not rely on memory for release discipline. The repo enforces it:

1. Read `AGENTS.md`.
2. Fill the PR template release-control section.
3. Add or update a release record when the PR changes a release-relevant surface.
4. Let CI run `npm run release:check`.

If CI fails, fix the release record. Do not bypass the release-control gate unless Anand explicitly approves an emergency exception.

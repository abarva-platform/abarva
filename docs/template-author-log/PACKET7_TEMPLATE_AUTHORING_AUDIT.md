# Packet 7 Template Authoring Audit

Date: 2026-05-23
Branch: `feat/p7-template-authoring`
Authoring path: live Azure Postgres via `ca-abarva-web-lab-eastus` runtime `DATABASE_URL`, using the P3 template schema only.

## Scope

P7 authored 8 published template records:

1. `it-productivity-ai-enabled-program` - Move
2. `data-foundation-for-ai` - Move
3. `ai-governance-and-policy` - Move
4. `app-portfolio-rationalization-time` - Move
5. `talent-strategy-ai-fluent-engineering-org` - Move
6. `mainframe-modernization-sequenced` - Move
7. `source-ams-portfolio-optimization` - SourceWorkflow
8. `source-infra-ms-optimization` - SourceWorkflow

No schema changes were made by P7. No runtime code was changed. Live smoke used `clients` / `client_id` only for tenant naming.

## Live DB Evidence

Runtime: `ca-abarva-web-lab-eastus--0000047`

P3 tables verified:

- `move_templates`
- `move_template_gates`
- `move_template_artifacts`
- `move_template_versions`
- `move_instances`
- `clients`

Published template evidence:

| Slug | Kind | Status | Depth | Gates | Artifacts | Min Gate Depth | Min Artifact Depth | Min TOC Sections |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `ai-governance-and-policy` | Move | published | 10 | 5 | 10 | 10 | 10 | 13 |
| `app-portfolio-rationalization-time` | Move | published | 10 | 5 | 10 | 10 | 10 | 13 |
| `data-foundation-for-ai` | Move | published | 10 | 5 | 10 | 10 | 10 | 13 |
| `it-productivity-ai-enabled-program` | Move | published | 10 | 11 | 22 | 10 | 10 | 13 |
| `mainframe-modernization-sequenced` | Move | published | 10 | 6 | 12 | 10 | 10 | 13 |
| `source-ams-portfolio-optimization` | SourceWorkflow | published | 10 | 5 | 10 | 10 | 10 | 13 |
| `source-infra-ms-optimization` | SourceWorkflow | published | 10 | 5 | 10 | 10 | 10 | 13 |
| `talent-strategy-ai-fluent-engineering-org` | Move | published | 10 | 5 | 10 | 10 | 10 | 13 |

IT-Productivity gate skeleton rendered in full:

| Sequence | Gate ID | Gate Name | Artifacts |
|---:|---|---|---:|
| 0 | `0` | Wave 0 - Alignment | 2 |
| 1 | `0.5` | Sibling-Move dependency check | 2 |
| 2 | `1` | Discovery T1 to T2 to T3 | 2 |
| 3 | `2` | Baseline 4-6 weeks | 2 |
| 4 | `3` | Diagnose | 2 |
| 5 | `4` | Operating Model design | 2 |
| 6 | `5` | Tooling + Governance design | 2 |
| 7 | `6` | Business case | 2 |
| 8 | `7` | Mobilize - Wave 1 pilot 12 weeks | 2 |
| 9 | `8` | Mobilize - Waves 2-4 | 2 |
| 10 | `9` | Operate | 2 |

Source workflow stage evidence:

- `source-ams-portfolio-optimization`: 5 stages
- `source-infra-ms-optimization`: 5 stages

## Depth Evidence

Local deterministic P0/P3 depth validation passed before DB authoring:

- 8 templates scored `10`
- Gate count range: `5..11`
- Artifact count range: `10..22`
- Minimum gate score: `10`
- Minimum artifact score: `10`

Live DB depth fields match the local pass: all P7 templates, gates, and artifacts have depth score `10`.

## Instantiation Smoke

Apex Retail IT-Productivity smoke:

- `move_instances.instance_id`: `d7529462-6744-48d8-84c9-be804f665d30`
- Template: `it-productivity-ai-enabled-program`
- Status: `active`
- Current gate: `0`
- Gate skeleton count: `11`
- First gate artifact count: `2`
- Template version pinned: `1`

The smoke instance is tagged with `options_jsonb.origin = 'p7-smoke'` and does not create a program shell.

## Notes

- A temporary Container Apps job was created only as an execution probe and deleted after it proved unsuitable for Node module resolution.
- Final DB authoring ran through `az containerapp exec` inside the live web container with `NODE_PATH=/app/node_modules` so the P3 schema could be reached from the VNet.
- There are no remaining P7 escalation blocks.

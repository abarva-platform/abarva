# Governance Index

AGENTS.md is the source of truth for coding conventions; CI enforces what AGENTS.md describes.

## Standards Map

| File or directory | Purpose |
| --- | --- |
| `/AGENTS.md` | Primary operating contract for coding conventions, stack constraints, release discipline, validation expectations, and AI-agent execution boundaries. |
| `/CLAUDE.md` | Claude-specific execution notes that should derive from and stay consistent with `AGENTS.md`. |
| `/.cursor/rules` | Cursor-specific AI rules that should mirror the canonical standards in `AGENTS.md`. |
| `/.github/copilot-instructions.md` | GitHub Copilot instructions that should mirror the canonical standards in `AGENTS.md`. |
| `/.github/CODEOWNERS` | GitHub ownership map for review routing on sensitive paths and governance files. |
| `/.github/PULL_REQUEST_TEMPLATE.md` | Pull request packet requiring summary, release classification, QA, rollout, rollback, and audit evidence. |
| `/docs/architecture/adr/` | Architecture Decision Records for durable technical and governance decisions. |
| `/docs/runbooks/` | Operator runbooks for repeatable engineering, release, and environment procedures. |
| `/docs/releases/records/` | Release records for controlled release candidates, including lane, layer impact, QA, rollout, rollback, and audit evidence. |

## How To Make A Change

- Read `AGENTS.md`.
- Create a branch.
- Keep the pull request small.
- Add or update the release record.
- Wait for green CI.
- Merge.

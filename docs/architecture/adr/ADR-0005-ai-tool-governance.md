# ADR-0005 - AI Tool Governance

## Status

Accepted

## Date

2026-06-01

## Context

Multiple AI-assisted development tools can operate against this repository. The repo already has a canonical agent instruction file and at least one derivative tool instruction file:

- `AGENTS.md` contains stack, validation, environment, release-control, and AI-agent execution rules.
- `CLAUDE.md` points back to `AGENTS.md`.
- `.github/pull_request_template.md` requires release-control evidence in PRs.

Duplicating rules manually across tool-specific files creates drift. The governance direction is to keep `AGENTS.md` canonical and generate derivative AI-tool rules from it.

## Decision

`AGENTS.md` is the single source of truth for AI-tool coding conventions and release-control behavior.

Tool-specific instruction files must be treated as derivatives. When derivative files are needed for Cursor, GitHub Copilot, Claude, or another AI tool, they should be generated from `AGENTS.md` by a governance sync script rather than hand-maintained independently.

At the time of this ADR, this decision records the governance rule. It does not claim that every derivative file or generator already exists.

## Consequences

- Changes to coding conventions should start in `AGENTS.md`.
- Tool-specific instruction files should carry generated-file headers where supported.
- Reviewers should treat manual divergence from `AGENTS.md` as governance drift.
- The sync script should be idempotent so re-running it produces no diff when `AGENTS.md` is unchanged.

## Alternatives

- Maintain independent instructions for every tool. Rejected because drift is likely and auditability is weak.
- Put the canonical instructions in a tool-specific file. Rejected because `AGENTS.md` is already the repo-level execution contract.
- Avoid derivative files entirely. Rejected because some tools need local instruction files to apply repo rules.

## References

- `AGENTS.md`
- `CLAUDE.md`
- `.github/pull_request_template.md`

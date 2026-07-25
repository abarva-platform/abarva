# 2026-07-25-public-repo-disclosure-guardrail — AGENTS.md guardrail against public-repo disclosure

## Release ID

`2026-07-25-public-repo-disclosure-guardrail`

## Status

`candidate`

## Plain-English Summary

A background coding agent's PR (#5579), while onboarding a synthetic fixture tenant, wrote
incident-narrative language into a public PR title/body. The underlying tenant/data was confirmed
synthetic, so no real client confidentiality was actually broken — but the habit itself was wrong
and would be a real problem once real client engagements exist. This adds a mandatory section to
`AGENTS.md` (binding on every agent — Claude Code, Codex, Cursor, or otherwise, per the doc's
existing "all agents" convention) instructing that commit messages, PR bodies, code comments, and
release records in this public repository must never narrate real client names, incident
specifics, or dispute/legal status inline — even when today's example is a synthetic fixture,
because the habit being formed now is the one that will run once real clients exist.

## Layer Impact

- **global-control-lane**: process/documentation guardrail, applies to every future PR regardless of
  product surface.

## Client Applicability

- Internal only: this is agent-operating-instruction guidance, not a product or data-plane change.

## Changes Included

- `AGENTS.md` — new "Public-repo disclosure discipline" subsection under "Release control
  discipline".

## QA / Validation

- Documentation-only change; no code paths affected. `node scripts/release-check.mjs --base
  origin/main --head HEAD` — pass once this record is included.

## Rollout Plan

Merge to `main` via squash-merge PR. No runtime rollout — takes effect for any agent reading
`AGENTS.md` going forward.

## Deployment Authority

Not applicable — no ACA/runtime impact.

## Rollback Plan

Revert the merge commit.

## Audit Evidence

- PR: to be opened
- Triggering incident: PR [#5579](https://github.com/abarva-platform/abarva/pull/5579)'s title/body
  disclosed incident-narrative language about a synthetic fixture tenant; confirmed synthetic/no
  real disclosure by Anand, reopened.

## Known Gaps

None known — this is a documentation-only guardrail with no code enforcement. A future
improvement worth considering is an automated lint/CI check that greps staged commit messages and
PR bodies for real-tenant-name patterns outside the known synthetic-fixture list, so the guardrail
isn't purely dependent on every agent remembering to read this section of `AGENTS.md`.

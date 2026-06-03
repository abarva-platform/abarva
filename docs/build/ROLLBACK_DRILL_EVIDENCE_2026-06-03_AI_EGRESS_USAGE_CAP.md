# Rollback Drill Evidence — AI Egress Usage Cap Enforcement

Date: 2026-06-03
Backlog row: T039
Drill type: dry tabletop, no production mutation
Release lane: global-control-lane

## Drill Target

| Field | Evidence |
| --- | --- |
| Release candidate | PR #2964, `feat(ai-egress): enforce tenant usage caps` |
| Merge commit | `3ea02aae210001057b52609084aade4f1d221cc6` |
| Merged at | 2026-06-03 18:44:11 -0500 |
| Last known good commit | `57f7d9532f33cc4edfaf991531e875bf85207717` |
| Last known good release | PR #2963, `feat(agent): persist attachment parse metadata` |
| Changed files | `src/lib/integrations/ai-egress/call-model.ts`, `src/lib/integrations/ai-egress/types.ts`, `src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`, release record |

## Trigger Scenario

The tabletop assumes the newly merged AI-egress usage-cap enforcement blocks
legitimate model calls for a pilot client because usage-cap configuration is
wrong, stale, or applied to the wrong client.

Rollback trigger would be any confirmed client-impacting symptom:

- unexpected `usage cap exceeded` denial for a client below its approved cap;
- alert-only cap state behaving as hard-block;
- AI-egress audit showing the wrong client or period in cap metadata;
- support or account owner report that core agent workflows cannot call the
  configured model.

## Decision Roles

| Role | Owner |
| --- | --- |
| Incident commander | Anand or delegated release owner |
| Rollback decision-maker | Anand or delegated engineering owner |
| Validation owner | Engineering owner for AI egress |
| Client communication owner | Account owner or founder |
| Finance/commercial owner | Founder if overage or cap terms are affected |

## Rollback Options

| Option | Use when | Expected action |
| --- | --- | --- |
| Disable cap config | Misconfiguration affects one client and runtime config is available. | Remove or lower-risk the client `usageCap` input, then re-test affected calls. |
| Rate-limit exception | Client has approved continued usage but cap settings lag. | Apply temporary approved cap exception with expiry and audit note. |
| Git revert | Code-level enforcement defect affects multiple clients or cannot be safely isolated. | Create a revert PR for merge commit `3ea02aae210001057b52609084aade4f1d221cc6`; merge only after focused QA and required checks. |
| Provider failover pause | Provider-specific usage data is unreliable. | Pause affected provider route or fall back through the existing AI-egress provider policy if safe. |

## Selected Drill Path

The selected path for this dry drill is **Git revert via PR**, because the
scenario assumes a shared enforcement defect rather than one bad client setting.

Planned command sequence:

```bash
git fetch origin main --prune
git switch -c codex/revert-ai-egress-usage-cap origin/main
git revert 3ea02aae210001057b52609084aade4f1d221cc6
npx jest src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts --runInBand
npx eslint src/lib/integrations/ai-egress/call-model.ts src/lib/integrations/ai-egress/types.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

No revert command was executed during this drill because Anand did not approve a
live rollback and there was no active production incident.

## Validation Checklist

If rollback is executed, validation must prove:

- ordinary AI-egress requests reach the configured adapter when no deny policy
  applies;
- hard-block behavior is absent or restored to the previous known-good state;
- tenant policy allowlist and provider deny-list behavior still pass;
- audit records still include client, provider, model, policy, and reason
  metadata;
- no client data-plane migration or destructive data action is required.

## Communication Plan

For a client-visible impact, the account owner sends:

```text
AbarVa identified an AI-generation access issue affecting [client/surface].
The issue is contained and rollback is underway. No client data exposure is
suspected based on current evidence. Next update: [time].
```

Do not claim final resolution until the affected agent workflow has been
validated after rollback.

## Residual Risk

- Vercel deployment evidence is unavailable until the Vercel Git integration is
  re-authorized for the `abarva-platform` organization.
- This was a dry tabletop. It proves the owner, rollback path, validation plan,
  and evidence structure, but it does not mutate production.
- T033 remains `In progress` until durable cap settings, cap-alert delivery,
  live usage totals, and customer-facing weekly usage reporting are evidenced.

## Drill Outcome

Status: pass for dry tabletop.

The drill identified a clear rollback owner model, last-known-good commit,
smallest safe rollback options, validation commands, communication owner, and
residual-risk boundary for the AI-egress usage-cap release. No runbook gap
requiring immediate correction was found.

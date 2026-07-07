# Founder Operating System

Status: candidate
Owner: founder
Audience: founder, first operator, advisor, future chief of staff
Backlog rows: T305, T106, T117, T123

## Purpose

This runbook turns founder operations into a repeatable operating rhythm before
the first client pilot. It does not replace external actions such as hiring,
bank setup, customer calls, or finance tooling. It defines the cadence,
decision forums, bandwidth limits, first hires, and metrics evidence that keep
the company from running only out of inbox memory.

## Operating Principles

- Keep weekly execution anchored on pipeline, product, customer risk, and
  runway.
- Treat founder bandwidth as a constrained resource, especially during close
  sprints.
- Use a small number of recurring forums instead of scattered ad hoc reviews.
- Record decisions in repo-controlled docs, release records, customer paper, or
  a finance system when they affect clients, pricing, security, or hiring.
- Do not create vanity metrics before the first paid pilot; track the few
  numbers that shape pilot conversion and fundraising narrative.

## Two Parallel Close Sprints

Backlog row: T305.

Running two active enterprise close sprints in parallel is a deliberate
bandwidth tradeoff. Assume approximately 20 hours per week of founder sales
effort for two weeks when two prospects are in late-stage motion.

| Workstream | Weekly founder time | What gets protected |
| --- | ---: | --- |
| Prospect 1 close sprint | 8-10 hours | Decision-maker mapping, business case, SOW, security/legal answers. |
| Prospect 2 close sprint | 8-10 hours | Same as above, with a separate account plan and no copied claims. |
| Product/engineering | 10-15 hours | Critical bugs, release gates, demo readiness, security posture. |
| Admin/legal/finance | 3-5 hours | Incorporation, insurance, counsel, bookkeeping, procurement inputs. |

During a two-sprint window, pause low-leverage product polish, speculative
features, and unfunded custom work. The weekly review must explicitly name
what is being deferred so it does not silently disappear.

## Weekly Cadence

Backlog row: T123.

| Forum | Duration | Owner | Inputs | Output |
| --- | ---: | --- | --- | --- |
| Monday founder operating review | 45 minutes | Founder | Pipeline state, release state, runway, blockers. | Top 3 outcomes for the week and deferred work list. |
| Midweek product and risk review | 30 minutes | Founder / engineering owner | Open PRs, incidents, release risks, customer blockers. | Ship/no-ship decisions and fix owners. |
| Friday commercial review | 30 minutes | Founder | Prospect activity, next steps, SOW/legal status, forecast. | Updated pipeline notes and next-week asks. |
| Monthly financial and metrics close | 60 minutes | Founder / finance owner | Bank balance, invoices, usage costs, pipeline forecast. | Monthly operating packet and runway update. |
| Quarterly strategy and roadmap review | 90 minutes | Founder / advisor | Customer evidence, product roadmap, security posture, hiring plan. | 90-day priorities and explicit stop-doing list. |

Minimum weekly artifacts:

- active pipeline table,
- top product/release risks,
- client/security/legal blockers,
- runway and cash risk summary,
- two-week founder bandwidth forecast.

## Hire Plan

Backlog row: T106.

Hiring is trigger-based, not calendar-based. Do not hire ahead of clear pilot
or funding evidence unless founder capacity becomes the gating risk.

| Sequence | Role | Trigger | Why now | Evidence before offer |
| --- | --- | --- | --- | --- |
| 1 | Senior full-stack / platform engineer | First paid pilot signed or funding committed. | Reduces key-person risk and increases release throughput. | Signed pilot or financing plan, 90-day roadmap, onboarding runbook. |
| 2 | Customer success / solutions lead | First pilot is live and renewal/expansion motion begins. | Converts pilot usage into business outcomes and reference evidence. | Active customer cadence, support model, success criteria, QBR template. |
| 3 | Sales engineer / solution architect | Two active enterprise opportunities or one production conversion. | Handles demos, security/architecture answers, and custom discovery. | Repeatable demo script, architecture packet, top objections, pricing posture. |
| 4 | Finance / operations support | Monthly close, invoices, insurance, and procurement consume more than 5 founder hours/week. | Prevents admin drag and protects close sprint capacity. | Bookkeeping process, vendor tracker, monthly close checklist. |

First-hire operating requirements:

- written role scorecard,
- 30/60/90 onboarding plan,
- access and device checklist,
- security and responsible-AI training,
- clear ownership boundary for customer data,
- compensation and equity approval evidence.

## SaaS Metrics Dashboard

Backlog row: T117.

Before three customers, the dashboard can be a monthly operating packet rather
than a paid BI tool. The key is consistency and evidence, not tool complexity.

| Metric | Definition | Source of truth | Review cadence |
| --- | --- | --- | --- |
| MRR | Contracted recurring monthly revenue, excluding one-time pilot setup fees. | Signed order form, Stripe, or accounting ledger. | Monthly. |
| ARR | MRR multiplied by 12, plus contracted annual recurring commitments. | Signed order form and finance packet. | Monthly. |
| Pipeline | Qualified opportunities by stage, next step, expected value, and close risk. | CRM, spreadsheet, or founder pipeline doc. | Weekly. |
| CAC | Sales and marketing cost required to acquire signed customer. | Finance packet and time allocation. | Monthly once paid spend begins. |
| Gross margin proxy | Revenue minus model, cloud, support, and data-plane operating costs. | Usage ledger, Azure/Vercel/provider bills, accounting ledger. | Monthly. |
| Churn | Lost recurring customer revenue. | Signed cancellation or non-renewal notice. | Monthly once production customers exist. |
| NRR | Expansion minus contraction and churn for existing customers. | Signed expansion, contraction, renewal, and cancellation records. | Quarterly once two customers exist. |
| Pilot conversion | Percent of pilots that convert to paid production within target window. | SOW, renewal, and production order records. | Quarterly. |

Tooling path:

1. Start with a controlled spreadsheet or finance packet while there are zero
   or one customers.
2. Move to Stripe plus accounting reports when recurring billing starts.
3. Add ChartMogul, Baremetrics, or equivalent only after recurring billing and
   renewal cohorts make automation worthwhile.

Do not report ARR from verbal interest. Do not count a pilot as recurring ARR
unless the contract says it is recurring. Do not count waived usage or
founder-time concessions as revenue.

## Monthly Operating Packet

Each month, produce a short packet with:

- cash balance and runway,
- signed revenue and pipeline,
- usage cost and margin signals,
- active client risks,
- release and security posture,
- hiring trigger status,
- founder bandwidth forecast,
- asks for counsel, advisors, or contractors.

## Completion Rules

Rows T305, T106, T117, and T123 can move to `In progress` when this runbook and
its verifier are merged to `main`.

They should move to `Done` only when:

- T305: the founder acknowledges the two-sprint bandwidth plan and uses it in
  a live weekly review,
- T106: the hire plan is founder-approved and tied to funding or signed-pilot
  triggers,
- T117: the first monthly metrics packet or dashboard exists with real current
  values,
- T123: the weekly/monthly/quarterly cadence has been run at least once and the
  evidence is retained.

## Related Documents

- `docs/runbooks/dora-metrics.md`
- `docs/runbooks/key-person-risk-and-continuity.md`
- `docs/runbooks/product-release-environment-plan.md`
- `docs/runbooks/release-cadence.md`
- `docs/runbooks/spend-approval-controls.md`
- `docs/runbooks/token-consumption-overage-policy.md`
- `docs/gtm/D6-SEED-FUNDING-PLAN.md`

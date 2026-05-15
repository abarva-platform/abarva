# AbarVa · Pilot Support & Sustaining Model
> Living doc. Owner: founder. Last updated 2026-05-14. Targets pilots #1–#5 before any FTE hire.

## 1. Operating principles

- **Founder-led, not founder-bottlenecked.** The founder owns customer relationships and P1 triage, but no recurring pilot workflow depends on the founder being awake. Anything that recurs on a clock — pager, audit prep, dependency updates — has a contracted backstop or is automated.
- **SOC 2-ready behaviors before SOC 2 certification.** We operate the controls (access reviews, change management, incident response, audit log, encryption-at-rest) on the schedule the auditor will eventually ask for. The certificate lands later; the muscle memory lands now. See `docs/security/INFOSEC-ACCELERATOR.md`.
- **Contractors over hires until pilot #3 is signed.** Fractional SRE, on-demand DPA/security analyst, and fractional CTO advice are cheaper, faster to onboard, and reversible. Every FTE conversation is gated on signed-pilot count, not aspiration.
- **Predictable cost of a pilot.** Supporting one pilot is a fixed monthly line, not a variable surprise. Founder time is sunk; everything else is metered and budgeted (see §8).
- **Customer-recognizable SLAs.** What we publish in the pilot MSA is what we operate to internally — same severity definitions, same response targets, same PIR cadence. No two-tier "what we promise vs. what we do."
- **Lean tooling.** One pager service, one observability stack (Vercel + Supabase + Azure App Insights), one ticketing surface. No tool sprawl until pilot #4.

## 2. Team shape (C2)

### 2a. Today (pilots 0–1)

| Role | Owner | Coverage | Cost shape |
|---|---|---|---|
| Primary on-call | Founder | Business hours (PT) + best-effort after | $0 marginal |
| After-hours SRE | Contracted retainer (TBD vendor) | Nights / weekends / holidays | ~$1.5–3k/mo retainer + hourly overage |
| Customer audits + DPA review | Contracted DPA / security analyst | On-demand per audit cycle | ~$150–250/hr, ~$2–5k per audit |
| Pilot success / CXO relationship | Founder | Weekly customer touch + Slack channel | $0 marginal |
| Engineering | Founder + Claude Code | Continuous via worktree workflow | $0 marginal beyond model spend |

Current state is honest: the SRE retainer is not yet signed, the DPA contractor is not yet retained. Both are listed as open items in §10. The model assumes both are in place before pilot #1's contract effective date.

### 2b. Pilots 2–5 (target shape)

| Role | Owner | Coverage | Cost shape |
|---|---|---|---|
| Primary on-call | Founder | Business hours, primary pager | $0 marginal |
| Secondary on-call | Contracted SRE | 24×7 secondary; primary after-hours | ~$2.5–4k/mo at this volume |
| Fractional PM (runbook drift) | Contractor, ~8 hrs/wk | Keeps tenant runbooks, pilot trackers, weekly customer reports current | ~$2–3k/mo |
| Fractional CTO advisor | Advisor, ~4 hrs/mo | Architecture and security review cadence | ~$1.5–2.5k/mo |
| Customer audits + DPA | Same contractor, retainer-upgraded | On-demand, ~1 audit per pilot per quarter | ~$3–6k/mo blended |
| Pilot success | Founder | Direct CXO relationship preserved | $0 marginal until pilot #5 |

The PM role is the first one that scales sub-linearly — one PM can absorb runbook drift across 4 pilots before strain shows. The SRE retainer scales by pilot count because pager volume is roughly linear.

### 2c. When to make the first hire

- **Signed pilot #3** → first FTE engineer. By pilot #3 the founder is the bottleneck on roadmap, not support. The hire is senior, full-stack, and absorbs the second on-call slot internally. Triggers a re-baseline on SRE retainer (downgrade or retire).
- **Signed pilot #5** → first FTE CSM / pilot success lead. By pilot #5 the founder cannot personally run weekly CXO reviews for every account without dropping engineering. CSM is the first non-engineering hire and inherits the PM contractor's scope plus customer-facing time.
- **Anything before pilot #3 is a mistake.** Fixed cost of one FTE (~$200k loaded) is greater than the contracted shape for the entire pilots-0-to-5 window. Cash burn is the silent killer at pre-seed; defer.

## 3. Pager rotation + escalation (C3)

**Tool:** PagerDuty (Starter or Professional). Founder picks at provisioning. SMS + push + voice fallback. Single service `abarva-pilot-prod`.

**Routing rules:**

- **Primary on-call** → Founder, business hours (08:00–19:00 PT, Mon–Fri).
- **Secondary on-call** → Contracted SRE, all other hours, plus same-window backup if founder unacknowledged.
- **P1 (SEV1 in `incident-response-runbook.ts`):** Pages primary immediately. If unacknowledged after 15 min → secondary. If unacknowledged after another 15 min → founder by voice call. Customer notified within 30 min of acknowledgement.
- **P2 (SEV2):** Pages primary during business hours, queues to next business day after hours. Customer notified within 4 hours of acknowledgement.
- **P3 (SEV3):** No page. Logged as a ticket and triaged in the next sprint review (weekly).
- **Internal escalations:** Founder is the escalation point for everything customer-facing. Fractional CTO advisor is escalation for architecture/security judgment calls during a SEV1.

Severity definitions follow the canonical schema in `src/lib/security/incident-response-runbook.ts` (SEV1/2/3/4). Customer-facing tiers (P1/P2/P3) map 1:1 with SEV1/2/3 — SEV4 is internal-only and never pages.

## 4. SLA commitments

Published in the pilot MSA. These are the numbers we operate to internally; no separate stretch targets.

| Metric | Pilot tier | Production tier (future) |
|---|---|---|
| Availability (business hours) | 99.5% | 99.9% |
| Availability (overall, monthly) | 99.0% | 99.9% |
| P1 response time | ≤ 1 hour | ≤ 30 min |
| P1 resolution time | ≤ 8 hours | ≤ 4 hours |
| P2 response time | ≤ 4 hours | ≤ 2 hours |
| P2 resolution time | ≤ 2 business days | ≤ 1 business day |
| P3 acknowledgement | ≤ 2 business days | ≤ 1 business day |
| Quarterly availability report | Published to customer | Published + uptime page |
| PIR for any P1 | ≤ 24 hours, shared with customer | Same |

Pilot tier is intentionally below the production tier because the founder-as-primary model cannot honestly commit to 99.9% with a 30-minute P1 response. The gap is the explicit price of being a pre-seed pilot — and is what justifies the pilot pricing relative to GA.

## 5. Incident management

Incident response follows the canonical runbook in `src/lib/security/incident-response-runbook.ts`. The runbook is the single source of truth for severity classification, phase steps (detect → triage → contain → investigate → recover → review), the escalation matrix, and the post-incident review template. The runbook is verified to exist as of this doc revision; the document version metadata in the runbook drives the auditor-facing readiness check.

**Operational rules:**

- Any P1 produces a written PIR within 24 hours of resolution, using the template encoded in the runbook. A copy is sent to the affected customer. No exceptions.
- P2 incidents get a lightweight PIR (root cause + corrective action) within 5 business days.
- PIRs are stored in `docs/incidents/<YYYY-MM-DD>-<slug>.md`. Customer-shared copies are redacted only for unrelated tenant data.
- The annual incident summary is published as part of the SOC 2 narrative once certified, and as a customer-shared appendix in the meantime.

**Drill cadence:** One tabletop exercise per quarter, walking a synthetic SEV1 through the runbook with the contracted SRE present. Drill produces a PIR-shaped artifact even though no real incident occurred.

## 6. Observability + audit

**In place today:**

- Vercel platform logs (functions, builds, deploys) — 30-day retention.
- Supabase database logs and query analytics.
- Azure App Insights + Log Analytics workspace (#1938, #1940) — provisioning scaffold landed; ingestion wiring in progress.
- Broker context audit log (per-call provenance, tenant scope, identity) — used by Sentinel and any agent surface that touches the broker.
- Tenant-isolation pen-test playbook from the audit B-agent stream (docs under `docs/security/`).
- Sensitive-upload guardrails (`src/lib/security/sensitive-upload-guard.ts`) — blocks PHI/PCI signatures at ingest.
- Audit log table with append-only semantics (per audit fix series #1923–#1933).

**Planned (referenced from `docs/security/INFOSEC-ACCELERATOR.md` and CAIQ B5):**

- SIEM streaming (CAIQ B5c) — log forwarding from Vercel + Supabase + Azure into a SIEM. Not yet selected; candidates are Panther, Vanta-bundled, or Datadog Cloud SIEM.
- Microsoft Defender for Cloud + Sentinel coverage in the Azure lab footprint.
- Customer-tenant audit-log export endpoint (read-only, scoped to tenant).

Observability tooling cost is folded into §8 under "PagerDuty + observability tooling."

## 7. Pilot success criteria + healthchecks

**Weekly review template** (founder-run, 30 min, every pilot, every week):

- **Usage frequency per CXO persona** — distinct CXO logins, sessions per CXO per week, surfaces touched (Moves / Intelligence / Source / Tower). Goal: every funded persona logs in at least twice per week by week 4.
- **Agent-quality sample** — 5 randomly drawn Sentinel/Nexus/Atlas/Steward answers per week, rated 1–5 by the founder against a fixed rubric (faithfulness, specificity, action-orientation). Goal: rolling average ≥ 4.0.
- **Substrate freshness** — last refresh timestamp per data room; segment count delta; embedding job lag. Goal: no data room is older than 7 days without an explicit pause.
- **Customer NPS / commitment-to-renew** — single-question pulse to pilot champion every other week; verbatim quote captured. Goal: every pilot has an explicit "yes, we'd renew" by week 8 of a 12-week pilot, or a written list of what must change to get there.

Weekly review output is a one-page customer-shared digest (PM contractor authors it once that role is filled; founder drafts in the interim).

## 8. Cost projection (3-month pilot)

| Line | Pilot 1 | Pilots 2–5 (each, incremental) |
|---|---|---|
| Founder time | sunk | sunk |
| Contracted SRE retainer | $1.5–3k/mo | $0.5–1k/mo incremental (volume-based step) |
| Contracted DPA / security on-demand | ~$2–5k for audit cycle (one-time) | ~$1–2k incremental per audit cycle |
| PagerDuty + observability tooling | ~$200/mo | flat (shared across pilots) |
| Insurance: E&O + cyber | $250–700/mo | flat until policy retier |
| Fractional PM (kicks in at pilot #2) | n/a | ~$2–3k/mo total across the pool |
| Fractional CTO advisor | $0 until pilot #2 | ~$1.5–2.5k/mo total |
| **Total monthly** | **$2–4k** | **+$1–2k each** |

Numbers assume US-based contractors at fractional rates and a North-America-only customer footprint. International pilots add DPA hours for cross-border data review (GDPR, UK DPA) — budget +$1–2k one-time per pilot.

## 9. Sustaining checklist (C3 ops)

**Weekly:**
- Incident review (any P1/P2 from prior week; tabletop note if none).
- Customer health check per pilot (per §7).
- Pager rotation handoff confirmation.

**Monthly:**
- Cost reconciliation — actuals vs. §8 projection per pilot.
- Dependency security review — `npm audit`, Renovate digest, Supabase / Vercel / Azure advisory check.
- Agent-quality sample roll-up — 4-week rolling rubric average per agent.
- Sub-processor list refresh (any vendor changes?).
- Access review — Clerk users with admin role, Supabase service-role key usage, Vercel team membership.

**Quarterly:**
- SLA reporting to each pilot customer (availability + incident summary + PIR digest).
- Infosec accelerator doc refresh against current control posture.
- Tabletop incident drill with contracted SRE.
- DR/restore drill against a non-production tenant snapshot.

**Annually:**
- Public incident summary.
- Insurance retier review (E&O + cyber).
- SOC 2 readiness gap closure cycle (per `docs/security/INFOSEC-ACCELERATOR.md`).

## 10. Open items

Honest list. None of these block pilot #1 conversations, but all must be resolved before pilot #1 goes live.

- **PagerDuty account not provisioned.** Need to register, configure escalation policy, integrate with Vercel + Supabase + Azure alerting. ETA: pre-pilot-1 sign.
- **SRE retainer not signed.** Vendor shortlist not yet drafted. Candidates: Fractional / Vendor-X-style SRE-as-a-service shops vs. a known individual contractor. ETA: pre-pilot-1 sign.
- **DPA / security analyst not retained.** Will be sourced from the same network as the SOC 2 auditor. ETA: pre-pilot-1 audit cycle.
- **PIR template authored in code but not in markdown.** `incident-response-runbook.ts` encodes the template; need a markdown stub in `docs/incidents/_template.md` that mirrors it. Placeholder follow-up.
- **Defender + Sentinel coverage** in the Azure lab is planned, not configured.
- **SIEM streaming** (CAIQ B5c) — vendor not selected.
- **Insurance E&O + cyber** — quotes not yet pulled.
- **Customer-tenant audit-log export endpoint** — backlog item, not blocker for pilot tier.
- **Public status page** — deferred to production tier; not required for pilot SLA.

---

*This doc supersedes any prior informal support arrangement. Material changes require founder approval and a new revision date at the top.*

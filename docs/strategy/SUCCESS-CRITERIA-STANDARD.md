# Success Criteria Standard

**Status:** canonical · **Owner:** founder · **Created:** 2026-06-17

When we define a **use case** (P1 Charter) and a **solution** (P3 Design), we must
understand and document **success criteria** — not as a metric line, but as a
four-part commitment. A solution that ships without these is a feature, not an
outcome. This standard is the content model the deliverable generators and the
readiness gates bind to.

## The four parts of success criteria

1. **Business outcomes** — the business result the move must produce, stated as a
   business change (e.g. "reduce IRROPS passenger re-accommodation time," "cut
   manual claims rework"), never as a feature or a technology ("deploy an agent").

2. **Key success metrics** — the KPIs that prove each outcome, each with:
   - a current **baseline** (what it is today, with its source), and
   - a **target** (what good looks like, with the time horizon).
   Every figure is labelled `PRELIMINARY_ESTIMATE` until validated in discovery.

3. **Measurement plan (post-deployment / enablement)** — how the client will
   **actually measure** each metric *after* go-live:
   - the **data source / instrumentation** the metric is read from,
   - the **owner** accountable for reading it,
   - the **cadence** of measurement, and
   - the **enablement** required to capture it (telemetry, a report, a process
     step, a system field that does not exist yet).
   If a metric cannot be measured with what exists, the enablement to measure it is
   itself a scope item — surfaced, not assumed.

4. **Business-process change commitment** — whether and **how** the client intends
   to change their business process / operating model to *enable* the outcome.
   Technology alone rarely delivers the outcome; the people-and-process change is
   usually the larger lever. Document the specific process changes the client
   commits to make (e.g. "agents triage tier-1 tickets; humans handle exceptions
   only," "close the books weekly instead of monthly"). Where the client is not yet
   willing to change a process, that is a **risk to the outcome**, recorded as such.

## How it threads through the phases

Success criteria are **born at the use case (P1)** as a hypothesis and **sharpened
at the solution (P3)** once the to-be process is designed. They are validated in
discovery (P2) and operationalised in value measurement (P5).

| Phase | Deliverable | What it adds to success criteria |
|------|------|------|
| **P1 Charter** | `charter` | Outcomes + headline metrics (baseline→target, PRELIMINARY) + the **intent** to measure post-deployment + the **willingness** to change business process. Captured as success criteria; the process-change + measurement intent is mirrored under **sponsor commitment** and **change readiness**. |
| **P2 Discovery** | `discovery_report` | Validates the baselines and measurability; assesses **change & adoption readiness** — is the client actually able and willing to make the process changes the outcome needs. |
| **P3 Solution** | `operating_model` (+ `target_architecture`) | Designs the **to-be business process** — the concrete process changes that enable each outcome — and the instrumentation that makes each metric measurable. |
| **P5 Value** | `value_model` | The operational **measurement plan & enablement** (data source, owner, cadence) and the realization controls — the value contract. |

## Tie to readiness & sponsorship (why it is not "just metrics")

Parts (3) and (4) are **commitments**, so they also belong to two governance lenses:

- **Change readiness** — the client's ability and willingness to change the
  business process and to stand up the measurement. A high-value outcome with no
  process-change commitment is not ready.
- **Sponsor commitment** — the sponsor commits not only to **funding the
  technology** but to **driving the business-process change** and **owning the
  measurement**. A charter whose sponsor will fund a build but not change how the
  business works should say so — that is the honest readiness signal.

## Generation contract (what the deliverable generators enforce)

- The **charter** `value_hypothesis`/success-criteria section MUST cover all four
  parts; the `sponsor_commitment` section MUST state change-readiness and the
  sponsor's commitment to the process change + measurement.
- Figures without a baseline+target or a `PRELIMINARY_ESTIMATE`/citation tag are
  unsupported claims (the existing quality gate already refuses these).
- Where measurement or process-change is unknown, it is surfaced as
  `[CLIENT TO COMPLETE]` or a risk — never fabricated.

Related: [[project_deliverable_system_design]] · [[project_deliverable_durable_worker]] ·
`docs/strategy/DECISION-SPINE-STANDARD.md` · `docs/strategy/DELIVERABLE-CONTEXT-BINDING-STANDARD.md`.

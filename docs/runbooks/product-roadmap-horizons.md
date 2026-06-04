# Product Roadmap Horizons

## Purpose

This runbook defines the public-ish roadmap format used with pilot clients and
prospects. It is intentionally simpler than the internal backlog: a customer
should understand what is available now, what is next, and what is later without
seeing internal engineering noise or unapproved commitments.

## Roadmap Shape

Use three horizons:

| Horizon | Timeframe | Meaning | Allowed evidence |
| --- | --- | --- | --- |
| Now | Current release and active pilot execution | Work already live, merged, or in the release candidate path | Release records, PRs, QA evidence, deployed route, runbook |
| Next | Planned near-term work | Work accepted for the next planning window, but not promised as live | Approved backlog item, owner, dependencies, success criteria |
| Later | Directional roadmap | Valuable but not committed to the pilot scope or date | Product thesis, customer theme, discovery note |

Avoid quarter/date promises unless the work is already attached to a release
candidate, customer SOW, or founder-approved commitment.

## Customer-Safe Fields

Each roadmap entry should include:

- Theme.
- Customer outcome.
- Surface: Home, Admin/Setup, Moves/Nexus, Source, Tower/Atlas,
  Intelligence/Sentinel, Steward, platform, or private data plane.
- Status: Now, Next, Later.
- Evidence status: Live, release candidate, planned, discovery, blocked.
- Dependency, if any.
- Customer action required, if any.
- Explicit "not included" note when the boundary matters.

Do not expose internal ticket numbers, speculative dates, private security
findings, or another client's information.

## Roadmap Operating Cadence

| Cadence | Action |
| --- | --- |
| Weekly | Review feedback intake and decide whether any item moves into Now or Next |
| Monthly | Publish or refresh the customer-safe Now/Next/Later snapshot |
| Quarterly | Reconfirm strategic themes with customer sponsor and adjust Later |
| Before QBR | Reconcile shipped evidence with promised outcomes |

## Movement Rules

An item may move to `Now` only when:

- Scope is understood.
- Owner is named.
- Success criteria are clear.
- QA path is known.
- Rollback or no-runtime-impact posture is understood.
- Release lane is known.

An item may move to `Next` when:

- The customer outcome is clear.
- Dependencies are known.
- It is feasible within the next planning horizon.
- It does not conflict with security, tenant isolation, responsible AI, or
  single-client data-plane rules.

An item stays `Later` when:

- It requires live integrations not yet approved.
- It depends on external procurement, counsel, or customer data.
- It is valuable but not needed for the active pilot proof.
- It would distract from pilot-critical reliability, data loading, or decision
  support controls.

## Pilot Roadmap Guardrails

- Keep Home clean for business insight and day-to-day operator value.
- Keep Admin/Setup separate for user setup, connectors, data loading, template
  governance, quarantine, processing, and outputs exploration.
- Never imply cross-client data loading; private data-plane loading is strictly
  one client at a time.
- Separate current capability from roadmap capability in every customer-facing
  artifact.
- Mark real-time corpus/context refresh as future unless it is wired, tested,
  and approved for the client environment.
- Do not present AI output as autonomous decision-making; it is decision
  support with human ownership.

## Template

| Theme | Outcome | Surface | Horizon | Evidence status | Dependency | Customer action |
| --- | --- | --- | --- | --- | --- | --- |
| Example | Example outcome | Admin/Setup | Next | Planned | Client data policy sign-off | Approve data-load attestation |

## Related Runbooks

- `docs/runbooks/product-feedback-triage.md`
- `docs/runbooks/release-environments-and-promotion.md`
- `docs/runbooks/release-cadence.md`
- `docs/runbooks/pilot-data-loader-governance.md`

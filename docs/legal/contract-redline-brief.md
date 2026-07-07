# Contract Redline Brief

Status: draft for counsel review
Owner: AbarVa platform owner
Last updated: 2026-06-02
Backlog row: T015

## Purpose

This brief is the default redline guide for client NDAs, MSAs, and SOWs before
AbarVa signs a pilot or production agreement. It is not legal advice and should
not be sent to a customer as approved clause text without counsel review.

Use it to keep negotiation posture consistent: protect company survival, avoid
accidental IP transfer, preserve pricing freedom, and keep operational
obligations aligned with the actual pilot-stage platform.

## Must-Hold Positions

Hold the line hardest on liability, IP ownership, and most-favored-nation terms.
Those clauses can create company-level risk even when the pilot economics look
small.

| # | Clause | Client default position to redline | AbarVa must-change | Fallback position | Why it matters |
| --- | --- | --- | --- | --- | --- |
| 1 | Liability cap | Unlimited liability, or a cap such as "greater of $5M or fees paid." | Cap liability at 12 months of fees paid in the trailing period. Make the cap mutual. | 18-24 months of fees paid. Avoid anything above 2x annual recurring revenue unless counsel approves. | A large uncapped claim can turn one pilot into a company-ending exposure. |
| 2 | Indemnity scope | Vendor indemnifies for any claims arising from the services. | Limit indemnity to third-party IP infringement by the product, gross negligence or willful misconduct, and breach of confidentiality. Make equivalent duties mutual where applicable. | Add data breach caused by AbarVa negligence, still subject to the negotiated liability cap. | Broad indemnity can make AbarVa pay for disputes outside its control. |
| 3 | IP ownership | Client owns all work product, deliverables, derivatives, improvements, or learnings. | AbarVa retains platform IP, models, product improvements, methods, know-how, and generalized learnings. Client owns its data, configurations, and client-specific content. | Give the client a perpetual, royalty-free license to custom deliverables needed for its internal use while preserving AbarVa ownership. | Accidental assignment of platform improvements can block future sales, product reuse, and financing diligence. |
| 4 | Most-favored nation | Pricing must be no higher than pricing offered to similarly situated customers. | Strike entirely. | If unavoidable, limit to the same product, scope, volume, term, support level, data-plane posture, and commitment structure. Never make discounts retroactive. | MFN language can freeze pricing and turn future concessions into refund claims. |
| 5 | Termination for convenience | Client can terminate at any time on short notice. | Pilot: no termination for convenience after kickoff. Annual term: at least 90 days notice; refund only prepaid unused subscription; no refund on setup, implementation, or professional services fees. | Termination after month 6 with a three-month kill fee. | AbarVa absorbs implementation cost up front; short-notice termination can destroy pilot economics. |
| 6 | Service levels and credits | 99.9%+ uptime, escalating credits up to 100% of monthly fees, and termination for any SLA breach. | Pilot target: 99.5% monthly uptime with exclusions for maintenance, force majeure, customer systems, model providers, cloud providers, and third-party services. Credit cap at 25%; termination only after repeated material misses. | 99.7% monthly uptime with a 50% credit cap. | Do not promise enterprise production operations beyond current control-plane and data-plane evidence. |
| 7 | Audit rights | Client can audit books, systems, and processes at any time on short notice. | Once per year, mutually scheduled, limited to security and contract compliance, at the requesting party's cost, performed by a mutually agreed third party under NDA. | Twice per year maximum for regulated customers, still scoped and scheduled. | Unbounded audits consume founder time and can expose unrelated customer or platform information. |
| 8 | Assignment and change of control | Vendor cannot assign without client consent. | Either party may assign without consent in connection with merger, acquisition, reorganization, financing, or sale of substantially all assets. | Consent not unreasonably withheld, and deemed granted if no response within 30 days. | Missing assignment carveouts can slow or block acquisition, financing, or restructuring. |

## Sleeper Clauses

Also check every NDA, MSA, SOW, security exhibit, and purchase order for these
terms:

- Client policies incorporated "as updated from time to time." Bind only to the
  policies listed at signing, or require written acceptance of later policy
  changes.
- "Time is of the essence." Strike or limit to specific milestone obligations
  that counsel approves.
- Client approval over AbarVa personnel. Strike or limit to reasonable cause.
- Background checks, drug testing, or onsite personnel obligations. Keep them
  proportional to the remote founder-led pilot posture.
- Insurance requirements above the bound policy amount. Match the actual binder
  and treat higher limits as a future commercial item.
- Non-compete or competitor restrictions. Strike, or limit to named competitors
  and the contract term only.
- Source-code escrow. Accept only with a reputable escrow provider and narrow
  release triggers such as bankruptcy or permanent cessation of support.
- Client security tools installed into AbarVa systems. Refuse; security evidence
  should be provided through agreed reports, attestations, audits, or customer
  private data-plane controls.
- Liquidated damages or preset penalties. Strike and use SLA credits instead.
- "Services meet client business requirements." Replace with "materially
  conforms to documented specifications."
- Data sovereignty language. Tie it to the agreed region, deployment model, and
  private data-plane addendum. Do not imply unsupported cross-region or BYOK
  commitments.

## NDA-Specific Redlines

The NDA often arrives before the MSA, so treat it as a real negotiation:

- Strike IP-assignment language covering evaluation work, prototypes, feedback,
  or product ideas.
- Narrow non-solicit language so it does not block work with other customers or
  prospects.
- Add publicity language that allows customer-list or logo use only with prior
  written consent.
- Cap confidentiality term at two to three years, except for trade secrets that
  remain protected while they qualify as trade secrets.
- Add a residual knowledge clause so general skills, ideas, and know-how retained
  in unaided memory remain usable.

## Contract Review Packet

Attach or reference these artifacts during review:

- `docs/legal/client-paper-review-playbook.md`
- `docs/legal/ai-sow-clause-playbook.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`
- `docs/security/INFOSEC-ACCELERATOR.md`
- `docs/security/REFERENCE_ARCHITECTURE_SECURITY_REVIEW_DECK.md`
- Public `/subprocessors`, `/responsible-ai`, `/model-card`, and
  `/known-limitations` pages.

## Known Gaps

This is not lawyer-approved final contract language. T016 remains separate and
should track counsel review or approval of the redline brief before it is used
as a final negotiation playbook.

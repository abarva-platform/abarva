# Runtime Architecture Review Packet

## Review Scope

Use this packet before implementing or approving runtime work.

## Required Checks

- Product surface is named.
- Work object is named.
- Product API boundary is documented.
- Context Builder contract is documented.
- Knowledge Fabric dependencies are documented.
- Tool permissions are documented.
- Model Gateway path is documented if model use is allowed.
- Evidence ledger behavior is documented.
- Governance and audit requirements are documented.
- MVP / V1 / V2 classification is clear.
- Failure states are typed.

## Do-Not-Build Checks

- No direct model calls from agents.
- No direct model calls from UI.
- No prompt assembly in UI.
- No parser-by-model as the primary parsing path.
- No evidence-free claims.
- No workflow side effects without tool and audit boundaries.

## Validation Evidence

Runtime PRs should include scoped tests, TypeScript validation, build validation when practical, and deterministic smoke checks for the changed boundary.

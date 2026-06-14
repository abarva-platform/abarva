# First Client Preprod Rehearsal

Status: scaffold-ready, not executed

## Objective

Prove that a pilot client can use Client Preprod safely before Client Prod exists. The rehearsal validates private-plane provisioning evidence, data onboarding, retrieval, citation, context bundle traces, and module readiness without using production client data.

## Scope

Client Preprod only. Product Dev, Product Preview, and Product Prod are out of scope except for shared product release metadata and control-plane orchestration.

## Preconditions

- explicit client/preprod approval
- budget and RBAC owners named
- Key Vault/secrets model approved
- no PHI and no unapproved PII
- data manifest and templates approved
- rollback owner named

## Roles

Founder, platform operator, security reviewer, client owner, data owner, and rollback owner.

## Steps

1. Verify non-mutating repo packets.
2. Confirm approved execution ledger.
3. Provision only if approval exists.
4. Stage source files.
5. Commit records/facts/chunks.
6. Refresh search.
7. Run tenant-scoped retrieval.
8. Run citation and context-bundle proof.
9. Run module readiness checks for Intelligence, Moves, Source, and Tower.
10. Record pass/fail and signoff.

## Expected Evidence

See `rehearsal-evidence-log.md`.

## Rollback

Rollback requires preserving audit exports, disabling workload access, and retaining evidence according to client agreement.

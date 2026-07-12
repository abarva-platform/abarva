# SkyHarbor Candidate Tenant Data Version

Tenant: `skyharbor-air`
Status: `passed`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Promotion gate decision: `ready-for-operator-approval`

This PR10 proof creates inactive candidate-version metadata only. It does not write
production tenant data, update the Active Tenant Access Layer, promote the candidate,
or change module runtime consumption.

## Guardrails

- Dry-run only: true
- Physical table writes: false
- Active Tenant Access Layer updated: false
- Module runtime consumption changed: false
- Candidate promoted: false

## Proof Bundle

- Compatibility snapshot: `reports/skyharbor-compatibility-snapshot/skyharbor-compatibility-snapshot.json`
- Tenant packet: `reports/tenant-candidate-generation/skyharbor/packet/tenant-manifest.yaml`
- Source dry-run: `audit-artifacts/tenant-packet-dry-run/skyharbor`
- Target writer dry-run: `audit-artifacts/target-writer-dry-run/skyharbor`
- Module readiness: `reports/module-readiness-proof/skyharbor`
- Stranded intelligence: `reports/stranded-intelligence/skyharbor`
- Candidate version: `reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json`
- Promotion gate: `reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json`

## Counts

- Canonical records: 53
- Target operations planned: 106
- Module readiness entries: 5
- Promotion checks passed: 12
- Promotion checks failed: 0
- Stranded intelligence items: 53

## Module Readiness Summary

<!-- prettier-ignore -->
| Module | Evidence | Fact plan | Graph plan | Derived plan | Runtime reads candidate |
| --- | --- | --- | --- | --- | --- |
| home | true | true | false | true | false |
| intelligence | true | true | false | true | false |
| moves | true | true | false | true | false |
| source | true | true | false | false | false |
| tower | true | true | false | false | false |

## Blockers

- None for candidate metadata persistence. Active promotion is still disabled by design.

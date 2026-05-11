# Meridian Enterprise Context Refresh Simulation

Synthetic internal-context refresh pack for Day Two sync testing. No PHI. No industry or external research.

Generated: 2026-05-11T00:00:00.000Z
Tenant: meridian

## Snapshots

| Snapshot | Active records | New records | Changed records | Superseded facts | Stewardship tasks |
| --- | ---: | ---: | ---: | ---: | ---: |
| Week 0 baseline | 1030 | 0 | 0 | 0 | 0 |
| Week 1 operational refresh | 1039 | 9 | 4 | 12 | 6 |
| Month 1 operating refresh | 1039 | 0 | 5 | 9 | 7 |

## Refresh Scenarios

| Snapshot | Scenario | Domain | Change | Stewardship signal |
| --- | --- | --- | --- | --- |
| Week 1 operational refresh | ServiceNow ownership changed after CIO operations review. | CMDB | changed | Confirm decision rights and update application stewardship. |
| Week 1 operational refresh | Genesys renewal moved earlier and now requires sourcing action. | Contracts | changed | Create Source event or attach to existing contact center sourcing path. |
| Week 1 operational refresh | Eight new contact-center and integration incidents arrived from ITSM export. | Incidents | new | Review incident trend before approving dependent moves. |
| Week 1 operational refresh | First open integration problem closed with workaround validated. | Problems | closed | Supersede open blocker signal and keep closure evidence. |
| Week 1 operational refresh | Contact center service support group changed to platform engineering. | CMDB | changed | Revalidate incident routing and sourcing owner. |
| Week 1 operational refresh | New third-party risk version added for AI-enabled contact center work. | Policies | new | Require policy citation in Source artifacts and Move gate reviews. |
| Month 1 operating refresh | Initiative dependency now includes contact center service, Genesys contract, and updated AI sourcing policy. | Initiatives | changed | Alert Moves and Tower that this initiative now shares sourcing dependencies. |
| Month 1 operating refresh | Mirth integration CI became stale and no longer evidence-usable. | CMDB | stale | Open stewardship task before using this CI as cited evidence. |
| Month 1 operating refresh | MSFT Azure alias canonicalized to Microsoft Azure. | Vendors | canonicalized | Confirm alias map before contract/spend rollups. |
| Month 1 operating refresh | Oracle financials posted updated monthly spend baseline. | Spend | changed | Refresh sourcing value-at-stake assumptions. |
| Month 1 operating refresh | SLA breach trend worsened for a tier-one service. | SLAs | worsened | Escalate operational risk before dependent sourcing or Move approval. |

## Operating Model

- Stable source IDs are preserved across refreshes, so unchanged rows upsert cleanly.
- Changed facts are counted as superseded facts, preserving history for downstream evidence and retrieval.
- Snapshot rows are written before canonical overwrite decisions, so Source, Moves, Tower, and Intelligence can inspect freshness and stewardship risk first.
- Quality and stewardship tasks are generated for refresh signals that need human validation.

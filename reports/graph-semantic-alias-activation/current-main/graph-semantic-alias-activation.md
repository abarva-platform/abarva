# Graph Semantic Identity Alias Activation

Source SHA: `ee14b409a9a93ca1286d8b7b38e6823ab35db6a7`

This is a sanitized activation proof for three reviewed semantic identity aliases. It records lookup aliases against existing graph reconciliation node IDs only.

## Direct Answer

Activated alias records: 3. Quarantine changed from 5179 to 5129, a delta of -50. Graph tables written: false. Product read models updated: false.

## Approved Aliases

| Tenant    | Alias  | Canonical identity                   | Evidence                                                                                                                          | Affected endpoint occurrences |
| --------- | ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------: |
| tenant-07 | `CFO`  | `Chief Financial Officer`            | endpoint-label-is-unique-acronym-of-canonical-label; canonical_source_row=4; canonical_mapping_profile=organization-ownership/v1  |                            18 |
| tenant-07 | `CHRO` | `Chief Human Resources Officer`      | endpoint-label-is-unique-acronym-of-canonical-label; canonical_source_row=5; canonical_mapping_profile=organization-ownership/v1  |                            16 |
| tenant-07 | `CISO` | `Chief Information Security Officer` | endpoint-label-is-unique-acronym-of-canonical-label; canonical_source_row=26; canonical_mapping_profile=organization-ownership/v1 |                            16 |

## Before / After

| Metric                    | Before | After | Delta |
| ------------------------- | -----: | ----: | ----: |
| Relationship candidates   |   4454 |  4504 |    50 |
| Quarantined relationships |   5179 |  5129 |   -50 |

## Closed Gates

- No graph dictionary or object-registry activation.
- No graph materialization; graphTablesWritten must stay false.
- No canonical/data-plane write.
- No Layer 4 projection or product read-model refresh.
- No tenant data mutation.
- No live-client truth claim.

## Next Report-Only Lane

- Build the 6103 source-data-gated endpoint decision matrix.

# Tower source → mart delta

Both runs are `--dry-run --no-db`. **Before** = the projection as it ships today (V3 tree only). **After** = the same projection with the `tower-standardized-v1` T-family added.

## meridian-health

- V3 packet: `datasets/tenant-inputs/meridian-health/standard-2026-07-v3`
- Standardized packet: `tower-standardized-v1/meridian-health`

### Layer 1 — source rows read

| File              | Rows |
| ----------------- | ---: |
| `T01_initiatives` |   14 |
| `T08_spend`       |    7 |
| `T03_tool_usage`  |   40 |

### Layers 2–3 — facts and mart

| Layer                    | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| ------------------------ | --------------: | -------------------------: | ---------------: |
| canonical facts (merged) |             293 |                        401 |              427 |
| mart decision lanes      |              12 |                         26 |               26 |
| mart AI portfolio        |             255 |                        279 |              279 |
| mart evidence lineage    |             267 |                        305 |              305 |
| mart required-field gaps |              15 |                         24 |               15 |

### The two defects

| Measure               | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| --------------------- | --------------: | -------------------------: | ---------------: |
| `ai_tagged_spend_usd` |         $113.2M |                     $81.0M |          $157.0M |
| lanes with an owner   |           12/12 |                      26/26 |            26/26 |
| approved funding      |         $291.9M |                    $336.7M |          $336.7M |
| promised value        |          $35.5M |                    $742.0M |          $777.5M |
| finance-validated     |           $3.8M |                    $185.7M |          $189.5M |

## first-capital

- V3 packet: `datasets/tenant-inputs/first-capital/standard-2026-07-v3`
- Standardized packet: `tower-standardized-v1/first-capital-financial`

### Layer 1 — source rows read

| File              | Rows |
| ----------------- | ---: |
| `T01_initiatives` |   42 |
| `T08_spend`       |   42 |
| `T03_tool_usage`  |   35 |

### Layers 2–3 — facts and mart

| Layer                    | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| ------------------------ | --------------: | -------------------------: | ---------------: |
| canonical facts (merged) |             262 |                        499 |              536 |
| mart decision lanes      |               7 |                         42 |               49 |
| mart AI portfolio        |             232 |                        274 |              281 |
| mart evidence lineage    |             239 |                        316 |              330 |
| mart required-field gaps |               6 |                          7 |               12 |

### The two defects

| Measure               | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| --------------------- | --------------: | -------------------------: | ---------------: |
| `ai_tagged_spend_usd` |          $75.6M |                    $133.8M |          $209.4M |
| lanes with an owner   |             7/7 |                      42/42 |            49/49 |
| approved funding      |          $37.8M |                    $139.7M |          $177.5M |
| promised value        |          $50.8M |                   $3786.0M |         $3836.8M |
| finance-validated     |           $1.8M |                    $412.7M |          $414.4M |

## skyharbor-air

- V3 packet: `datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3`
- Standardized packet: `tower-standardized-v1/skyharbor-air`

### Layer 1 — source rows read

| File              | Rows |
| ----------------- | ---: |
| `T01_initiatives` |   30 |
| `T08_spend`       |  120 |
| `T03_tool_usage`  |  144 |

### Layers 2–3 — facts and mart

| Layer                    | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| ------------------------ | --------------: | -------------------------: | ---------------: |
| canonical facts (merged) |             247 |                        633 |              667 |
| mart decision lanes      |               6 |                         30 |               36 |
| mart AI portfolio        |             219 |                        255 |              261 |
| mart evidence lineage    |             225 |                        285 |              297 |
| mart required-field gaps |               3 |                         15 |               17 |

### The two defects

| Measure               | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| --------------------- | --------------: | -------------------------: | ---------------: |
| `ai_tagged_spend_usd` |          $90.2M |                    $406.5M |          $496.7M |
| lanes with an owner   |             6/6 |                      30/30 |            36/36 |
| approved funding      |          $45.1M |                   $1031.3M |         $1076.3M |
| promised value        |          $80.2M |                   $3374.0M |         $3454.2M |
| finance-validated     |           $5.7M |                    $432.0M |          $437.7M |

## lakeshore-holdings

- V3 packet: `none`
- Standardized packet: `tower-standardized-v1/lakeshore-industries`

### Layer 1 — source rows read

| File              | Rows |
| ----------------- | ---: |
| `T01_initiatives` |   10 |
| `T08_spend`       |   10 |
| `T03_tool_usage`  |   40 |

### Layers 2–3 — facts and mart

| Layer                    | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| ------------------------ | --------------: | -------------------------: | ---------------: |
| canonical facts (merged) |               — |                        130 |              130 |
| mart decision lanes      |               — |                         10 |               10 |
| mart AI portfolio        |               — |                         20 |               20 |
| mart evidence lineage    |               — |                         30 |               30 |
| mart required-field gaps |               — |                          1 |                1 |

### The two defects

| Measure               | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| --------------------- | --------------: | -------------------------: | ---------------: |
| `ai_tagged_spend_usd` |              $0 |                    $100.1M |          $100.1M |
| lanes with an owner   |               — |                      10/10 |            10/10 |
| approved funding      |              $0 |                     $76.4M |           $76.4M |
| promised value        |              $0 |                    $381.0M |          $381.0M |
| finance-validated     |              $0 |                     $91.7M |           $91.7M |

## apex-retail

- V3 packet: `none`
- Standardized packet: `tower-standardized-v1/apex-retail`

### Layer 1 — source rows read

| File              | Rows |
| ----------------- | ---: |
| `T01_initiatives` |   14 |
| `T08_spend`       |   14 |
| `T03_tool_usage`  |   44 |

### Layers 2–3 — facts and mart

| Layer                    | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| ------------------------ | --------------: | -------------------------: | ---------------: |
| canonical facts (merged) |               — |                        156 |              156 |
| mart decision lanes      |               — |                         14 |               14 |
| mart AI portfolio        |               — |                         25 |               25 |
| mart evidence lineage    |               — |                         39 |               39 |
| mart required-field gaps |               — |                          3 |                3 |

### The two defects

| Measure               | Today (V3 only) | **Decided (T owns value)** | Additive w/ SA08 |
| --------------------- | --------------: | -------------------------: | ---------------: |
| `ai_tagged_spend_usd` |              $0 |                    $101.2M |          $101.2M |
| lanes with an owner   |               — |                      14/14 |            14/14 |
| approved funding      |              $0 |                    $111.2M |          $111.2M |
| promised value        |              $0 |                    $641.0M |          $641.0M |
| finance-validated     |              $0 |                    $130.6M |          $130.6M |

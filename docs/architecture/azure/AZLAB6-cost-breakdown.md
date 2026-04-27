# AbarVa Azure Lab — Estimated Cost Breakdown

Slice ID: AZLAB6
Document: AZLAB6-cost-breakdown.md
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture document — docs only, no runtime code, no migrations, no model calls.

Budget ceiling: $200/month (ADR-004)
Region: East US 2
Last updated: 2026-04-26

---

## Summary

| Category | Service | Monthly Estimate |
|---|---|---|
| Data | Postgres (Control Plane) | $30 |
| Data | Postgres (Private Data Plane) | $30 |
| Data | Blob Storage (both planes) | $2 |
| Intelligence | Azure AI Search S1 | $75 |
| Intelligence | Azure OpenAI (GPT-4o pay-per-use) | $20 |
| Intelligence | Anthropic API (Claude) | $10 |
| Security | Key Vault (2 vaults) | $1 |
| Compute | Container Apps (Consumption) | $5 |
| Observability | Application Insights + Log Analytics | $5 |
| Networking | DNS, egress, firewall (minimal) | $5 |
| **TOTAL ESTIMATED** | | **$183/month** |
| **Budget ceiling** | | **$200/month** |
| **Headroom** | | **$17/month** |

---

## Detailed breakdown

### Postgres Flexible Server — Control Plane

Resource: `abarva-lab-pg-ctrl-eastus2`
SKU: Burstable B2ms (2 vCores, 8 GB RAM)
Storage: 32 GB SSD
Backup: 7-day retention, LRS

| Item | Unit Cost | Est. Usage | Monthly |
|---|---|---|---|
| Compute (B2ms, 730 hrs/month) | $0.0404/hr | 730 hrs | ~$30 |
| Storage (32 GB) | $0.115/GB | 32 GB | $4 |
| Backup storage | $0.095/GB | ~10 GB | $1 |
| **Subtotal** | | | **~$35** |

Note: B2ms is burstable. Actual compute may be lower if lab usage is intermittent. Estimated at full-running for ceiling purposes.

### Postgres Flexible Server — Private Data Plane

Resource: `abarva-lab-pg-pdp-eastus2`
Same SKU as Control Plane Postgres.

**Subtotal: ~$35/month**

### Blob Storage — Both Planes

Resources: `stabarvalabeactrl`, `stabarvalabeapdp`
SKU: LRS Hot, ~25 GB each

| Item | Unit Cost | Est. Usage | Monthly |
|---|---|---|---|
| Storage capacity (50 GB total) | $0.018/GB | 50 GB | $0.90 |
| Write operations (10K/month) | $0.05/10K | 10K | $0.05 |
| Read operations (100K/month) | $0.004/10K | 100K | $0.04 |
| **Subtotal** | | | **~$1** |

### Azure AI Search — Standard S1

Resource: `srch-abarva-lab-eastus2`

| Item | Cost |
|---|---|
| Standard S1 base price | $74.28/month |
| **Subtotal** | **~$75/month** |

Note: S1 includes 50 GB storage and 1 replica. Lab usage will be well under this capacity. If budget is tight, downgrade to Basic ($25/month) at the cost of reduced semantic ranking.

### Azure OpenAI — GPT-4o and Embedding

Resource: `abarva-lab-aoai-eastus2`

| Model | Pricing | Est. Usage | Monthly |
|---|---|---|---|
| GPT-4o input | $2.50/1M tokens | ~2M tokens | $5 |
| GPT-4o output | $10.00/1M tokens | ~500K tokens | $5 |
| text-embedding-3-small | $0.02/1M tokens | ~250M tokens | $5 |
| **Subtotal** | | | **~$15** |

Note: Embedding calls are high volume (every document indexed) but low cost per token.

### Anthropic API

| Model | Pricing | Est. Usage | Monthly |
|---|---|---|---|
| claude-3-5-sonnet input | $3.00/1M tokens | ~1M tokens | $3 |
| claude-3-5-sonnet output | $15.00/1M tokens | ~400K tokens | $6 |
| **Subtotal** | | | **~$9** |

Note: Anthropic is routed for complex reasoning tasks only. Lab usage is low-volume.

### Key Vault

Resources: `kv-abarva-lab-ctrl`, `kv-abarva-lab-pdp`
SKU: Standard

| Item | Unit Cost | Est. Usage | Monthly |
|---|---|---|---|
| Secret operations | $0.03/10K | ~20K | $0.06 |
| Key operations | $0.03/10K | ~5K | $0.015 |
| **Subtotal** | | | **~$0.10** |

### Container Apps — Private Data Plane Boundary Service

Resource: `ca-abarva-lab-pdp-eastus2`
Plan: Consumption (pay-per-use, scales to 0)

| Item | Unit Cost | Est. Usage | Monthly |
|---|---|---|---|
| vCPU-seconds | $0.000024/vCPU-sec | ~50K vCPU-sec | $1.20 |
| Memory GB-seconds | $0.000003/GB-sec | ~100K GB-sec | $0.30 |
| Requests | $0.40/1M | ~100K | $0.04 |
| **Subtotal** | | | **~$2** |

### Application Insights + Log Analytics

Resource: `appi-abarva-lab`, `law-abarva-lab`

| Item | Unit Cost | Est. Usage | Monthly |
|---|---|---|---|
| Log ingestion | $2.76/GB | ~1 GB/day = 30 GB/month | $5 |
| **Subtotal** | | | **~$5** |

### Networking

| Item | Est. Monthly |
|---|---|
| Azure Private DNS Zone | $0.50 |
| Egress (within Azure, cross-resource-group) | ~$2 |
| Container Apps + Postgres networking | ~$1 |
| **Subtotal** | **~$4** |

---

## Cost control triggers

| Threshold | Action |
|---|---|
| $150/month (75%) | Warning email to lab operator; review AI spend |
| $170/month (85%) | Reduce GPT-4o usage; consider search downgrade |
| $200/month (100%) | Action group fires; Container Apps scaled to 0; founder notified |

---

## Cost optimisation options

If lab spend trends above $170/month before the ceiling:

1. **Downgrade Azure AI Search to Basic** (-$50/month; lose semantic ranking)
2. **Reduce Postgres to B1ms** (-$15/month; risk OOM on complex queries)
3. **Pause Container Apps when not in active demo** (-$3/month)
4. **Reduce GPT-4o calls** by caching common context bundles (-$5/month)
5. **Use text-embedding-3-large only for high-trust docs** (-$3/month)

Even with all optimisations, minimum viable lab cost is ~$80/month (Postgres $35 + Search Basic $25 + AI $10 + other $10).

---

## Cost not included in estimate

- Azure subscription fee (none; Azure EA or pay-as-you-go)
- Developer workstation costs
- External DNS / domain registration
- Vercel hosting costs (separate from Azure)
- Anthropic API beyond lab volume

# Tower ingest · Azure Cost Management

Source slice: **S10** · target table: `tower_cloud_cost` · CLI: `src/scripts/tower/ingest-azure-cost.ts`.

Tower's first live cost-side integration. Every row is allocatable to an
AbarVa program through the Azure resource tag `program` — that's the headline
feature. Rows without a `program` tag fall through to `__untagged__` so portfolio
roll-ups stay arithmetically honest.

---

## Real-world extract path

Two supported paths from a customer's Azure tenant to the ingest CLI:

### 1. Azure Portal — Cost Management Exports (recommended)

1. Sign in to the Azure Portal as a user with `Cost Management Reader` on the
   billing scope (subscription, management group, or billing account).
2. Search for **Cost Management + Billing** → open the billing account or
   subscription scope.
3. Sidebar → **Cost Management** → **Exports**.
4. **+ Add** an export:
   - **Export type:** `Monthly export of last month's costs`
   - **Dataset:** `Cost and usage details (Actual)` with **all** columns
     (you only need a subset — see below — but Cost Management exports the
     whole dataset; trim downstream).
   - **Granularity:** `Daily` (the ingest rolls up to monthly).
   - **Format:** `CSV`
   - **Storage:** an Azure Storage account / blob container the customer
     controls. AbarVa pulls from a customer-owned blob; we do not own the
     export destination.
5. After the first scheduled run, copy the export CSV into the template
   workbook's **Data** sheet (column order is enforced by header name, not
   position). Or transform it directly with your own script; the canonical
   shape is documented below.

### 2. Cost Management REST API

For pull-based ingest (no scheduled CSV):

```
POST https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2024-08-01
Authorization: Bearer <AAD token with Cost Management Reader>
Content-Type: application/json

{
  "type": "ActualCost",
  "timeframe": "Custom",
  "timePeriod": { "from": "2026-04-01", "to": "2026-04-30" },
  "dataset": {
    "granularity": "None",
    "aggregation": {
      "totalCost": { "name": "Cost", "function": "Sum" }
    },
    "grouping": [
      { "type": "Dimension", "name": "SubscriptionId" },
      { "type": "Dimension", "name": "ResourceGroupName" },
      { "type": "Dimension", "name": "ResourceId" },
      { "type": "Dimension", "name": "ServiceName" },
      { "type": "Dimension", "name": "MeterCategory" },
      { "type": "Dimension", "name": "ResourceLocation" },
      { "type": "TagKey", "name": "program" },
      { "type": "TagKey", "name": "environment" }
    ]
  }
}
```

Map the response rows to the column shape below, drop into the **Data**
sheet, run the CLI.

---

## Column shape (the `Data` sheet)

| Column | Required | Notes |
|---|---|---|
| `subscription_id` | yes | Azure subscription GUID. |
| `resource_group` | yes | Resource group name. |
| `resource_name` | no | Resource short name; blank rolls to RG. |
| `service` | no | Azure service / meter sub-category (`Container Apps`, `Azure Database for PostgreSQL`, `Azure AI Search`, `Service Bus`, `Key Vault`, ...). |
| `tag_program` | no | **Headline allocation column.** Resource tag `program`. Blank rows roll into `__untagged__`. |
| `tag_environment` | no | One of `prod`, `staging`, `dev`, `unspecified`. |
| `period_start` | yes | YYYY-MM-DD. First day of billing month. |
| `period_end` | yes | YYYY-MM-DD. Last day of billing month. Must be on/after `period_start`. |
| `monthly_cost_usd` | yes | USD spend in the period. Must be `>= 0`. |
| `currency` | yes | **Must equal `USD`.** Pre-convert non-USD exports. |
| `meter_category` | no | Azure top-level meter category (`Compute`, `Networking`, `Storage`, `AI + Machine Learning`, ...). |
| `location` | no | Azure region slug (`eastus`, `westeurope`, ...). |

---

## Templates

Two files ship in `public/templates/tower/azure-cost/`:

- **`template.xlsx`** — blank workbook with headers, validation rules, and one
  example row. Customer-facing.
- **`sample.xlsx`** — synthetic Northwind Retail data, ~2000 rows across
  5 subscriptions × ~20 resource groups × 12 months. **Carries a SYNTHETIC
  banner across the top of the Data sheet.** Use for demos, never as a
  customer baseline.

Regenerate either with:

```
npx tsx src/scripts/tower/ingest-azure-cost.ts --regenerate-templates
```

---

## CLI

```
# Dry run — parse + validate, no writes, no DB connection
npx tsx src/scripts/tower/ingest-azure-cost.ts \
  --file=public/templates/tower/azure-cost/sample.xlsx \
  --dry-run

# Real ingest — DATABASE_URL must be set
npx tsx src/scripts/tower/ingest-azure-cost.ts \
  --client=<client_uuid> \
  --file=customer-export.xlsx
```

**Idempotency.** The CLI upserts on
`(client_id, subscription_id, resource_group, resource_name, service, meter_category, period_start)`.
Re-uploading the same month overwrites prior values. There is no soft-delete;
removing a customer row requires a manual SQL delete with the same natural
key.

---

## Validation

Hard rules (failure → no rows written):

- `currency = USD`
- `monthly_cost_usd >= 0`
- `period_start`, `period_end` parse as YYYY-MM-DD
- `period_end >= period_start`

Soft rules (warnings on stdout, ingest still proceeds):

- `> 5%` of rows lack `tag_program` → portfolio rollups will be incomplete
- Any row with `monthly_cost_usd > $100,000` → unusually large; flag for ops
- Any `period_start` that is not the 1st of a month → Azure exports are monthly
- Any duplicate natural key in the same file → last write wins

---

## Target table

`tower_cloud_cost` — see migration
`supabase/migrations/20260530140000_tower_cloud_cost.sql`. Service-role-only
RLS, mirroring the rest of the Tower data model until per-user RLS extends to
this table.

---

## Runbook · first customer onboard

1. Confirm customer has `Cost Management Reader` available for the relevant
   billing scope.
2. Ask them to tag at least their top 80% of spend with `program` and
   `environment` resource tags in Azure (the tag values are free-form — they
   become the keys we allocate against).
3. Schedule a daily export to a customer-owned blob container; give us
   read-only SAS access (or pull via the REST API path with our managed
   identity).
4. Pull the first month into `Data` sheet, run `--dry-run`; review warnings.
5. Re-run without `--dry-run` against the customer's `client_id`.
6. Verify the Tower cost lens shows non-zero spend by program.

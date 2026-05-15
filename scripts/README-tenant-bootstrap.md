# `tenant:bootstrap` · A2c onboarding orchestrator

> One command to take a canonical tenant from "Clerk + Supabase have nothing" to "every CXO can log in and `/intelligence#enterprise-context` renders all 15 coverage tiles + 6 context cards."
>
> Backlog: A2c (`docs/BACKLOG-2026-05-14.md`). PR # TBD.

---

## Why this exists

Onboarding a new tenant required ~6 separate manual steps invoked in the right order with the right secrets in `.env.local`. The audit 2026-05-13 found that the **seed → broker → UI pipeline is many-to-many**: loading the 14-segment folder is necessary but not sufficient. The broker has to successfully normalize + synthesize the rendered shape, or `/intelligence#enterprise-context` ships blank tiles to the CXO. `tenant:bootstrap` is the orchestrator that makes "onboard a tenant" a real verb rather than tribal knowledge.

---

## Usage

```bash
# Dry-run (default). Reports what would happen, doesn't mutate.
npm run tenant:bootstrap -- --tenant meridian

# Apply (mutating).
npm run tenant:bootstrap -- --tenant apexretail --apply

# Refresh existing tenant: skip provisioning + migrations + seeds,
# only rebuild broker context + verify-render.
npm run tenant:refresh -- --tenant arcturus --apply
```

Three canonical tenant keys today: `apexretail`, `meridian`, `arcturus` (First Capital).

Adding a new canonical tenant requires (a) adding it to `CANONICAL_TENANTS` in `scripts/tenant-bootstrap.ts`, (b) adding a `SETUP_DATA_LOADERS` entry, and (c) shipping a setup-data folder under `src/scripts/setup-data/<tenant>-data/`.

---

## What it does (in order)

| Step | Description | Where it lives |
|---|---|---|
| 1 | Validate the `--tenant` arg is canonical | inline |
| 2 | Verify required env vars are present | inline |
| 3 | Provision Clerk CXO personas (tenant-locked) | `scripts/provision-cxo-personas.ts --apply` |
| 4 | Run pending Supabase migrations | `npm run db:migrate` |
| 5 | Run baseline seeds (clients table, demo users, etc.) | `npm run db:seed` |
| 6 | Load the 14-segment setup-data pack | `src/scripts/setup-data/load-<tenant>-setup-data.ts` |
| 7 | **Verify-render** — assert all 15 coverage tiles + 6 context cards return data via the broker | `scripts/tenant-bootstrap-verify.ts` |
| 8 | Emit a structured report; exit non-zero on any failure | inline |

Steps 1–2 always run. Steps 3–6 are skipped when `--refresh-only` is passed. Step 7 always runs (it's the assertion that "bootstrap" actually completed).

---

## Required env vars

```
CLERK_SECRET_KEY                  Clerk admin operations (step 3)
NEXT_PUBLIC_SUPABASE_URL          Data plane (steps 4-7)
SUPABASE_SERVICE_ROLE_KEY         Data plane writes (steps 4-7)
ANTHROPIC_API_KEY                 Broker rebuild (step 7)
```

Loaded from `.env.local` via `dotenv`. The orchestrator fails fast in step 2 if any are missing.

---

## Verify-render — the critical assertion

The 14-segment folder in `src/scripts/setup-data/<tenant>-data/` contains raw content (CSV/MD/JSON). The broker normalizes that content into:

- **15 coverage-by-domain tiles** rendered on `/intelligence#enterprise-context` (org_decision_rights, facilities_business_units, cmdb_applications_services, ci_relationships_dependencies, vendors_contract_inventory, renewal_calendar, spend_baseline, policies_procedures, incidents, problems, changes, slas, initiative_portfolio, data_domains_stewardship, risk_compliance_register)
- **6 synthesized context cards** (platform-and-service-reliability, incident-problem-pressure, contract-renewal-exposure, spend-baseline-confidence, policy-ai-guardrails, initiative-dependency-map)

The mapping is many-to-many. A successful load of the 14 segments does NOT guarantee all 15+6 render — the broker might fail to synthesize a card if cross-cutting evidence rows are sparse. The verify-render step in `scripts/tenant-bootstrap-verify.ts` calls the broker's read-model the same way the UI does, then asserts every expected tile and card returns non-empty data.

On failure, the report tells you which tiles/cards are missing so you can either:
- Re-run setup data loaders with the right segments populated, OR
- Hand-edit `src/scripts/setup-data/<tenant>-data/<segment>/*` to add the missing content, OR
- Patch the broker read-model if the synthesis logic regressed.

---

## Output

Dry-run example:

```
─────────────────────────────────────────────────────────────────
A2c · tenant-bootstrap
  tenant       meridian
  mode         dry-run (default; safe)
  refresh-only no
─────────────────────────────────────────────────────────────────

✅  1 · validate tenant key  (1ms)
     recognized canonical tenant "meridian"
✅  2 · env-var pre-flight  (1ms)
     all 4 required env vars present
🟦  3 · Clerk CXO personas  (0ms)
     Would run scripts/provision-cxo-personas.ts --apply, scoped to meridian.
🟦  4 · Supabase migrations  (0ms)
     Would run `npm run db:migrate:dry` to check, then `npm run db:migrate` if changes pending.
🟦  5 · baseline seeds  (0ms)
     Would run `npm run db:seed`.
🟦  6 · setup-data pack  (0ms)
     Would run `npx tsx src/scripts/setup-data/load-meridian-setup-data.ts`.
🟦  7 · verify-render  (0ms)
     Would call the broker read-model + assert 15 coverage tiles + 6 cards return data for meridian
─────────────────────────────────────────────────────────────────

🟦  Dry-run complete. Re-run with --apply to actually provision.
```

Apply example (last line on success):

```
✅  Tenant "meridian" is bootstrap-complete. Verify by signing in as a
   CXO persona and opening /intelligence#enterprise-context.
```

---

## Failure modes

- **Missing env var.** Step 2 fails with "missing required env vars: …". Fix `.env.local` and re-run.
- **Clerk provisioning failed.** Step 3 surfaces stderr from `provision-cxo-personas.ts`. Usually means CLERK_SECRET_KEY is wrong or the script's protected-emails list rejected something.
- **Migrations failed.** Step 4 — read the `db:migrate` output. Common cause: Supabase role drift. Run `npm run audit:planes` to compare.
- **Setup-data loader failed.** Step 6 — the loader's stderr will point at the row that failed. Usually a malformed CSV in the setup-data folder.
- **Verify-render reports missing tiles or cards.** Step 7 names which tiles/cards came back empty. Re-check the 14-segment folder and the broker read-model.

---

## Roadmap

What this orchestrator does NOT yet do:

- **Run against a deployed Azure Container App** (`ca-abarva-web-lab-eastus`, #1950). That comes once Key Vault env projection lands and `/api/health` is wired. Today this script is local-execution-only.
- **Validate Clerk JWT template emits the right claims.** Today this is a manual check.
- **Per-customer Purview account provisioning** (B5b). That's a Bicep-side task that runs before this script.
- **Multi-tenant batch bootstrap.** If you need all 3 demo tenants bootstrapped, run the script 3 times. A wrapper for parallel batch is a follow-up.

---

## Tests

- `npx tsx scripts/tenant-bootstrap.ts --help` — should print usage.
- `npx tsx scripts/tenant-bootstrap.ts --tenant meridian --dry-run` — should print the plan without any side effects.
- `npx tsx scripts/tenant-bootstrap.ts --tenant meridian --apply` — should run the full pipeline. **Test in a non-prod environment first.**

---

## Companion files

- `scripts/tenant-bootstrap.ts` — the orchestrator
- `scripts/tenant-bootstrap-verify.ts` — the verify-render module (isolated for unit-test)
- `src/scripts/setup-data/load-{apex,meridian,firstcapital}-setup-data.ts` — the existing loaders this chains to
- `scripts/provision-cxo-personas.ts` — the Clerk provisioning step this chains to
- `package.json` — `npm run tenant:bootstrap` script wiring

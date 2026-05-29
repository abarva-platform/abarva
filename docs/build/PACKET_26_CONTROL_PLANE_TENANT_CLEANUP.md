# Packet 26 — Control-Plane / Data-Plane Cleanup (Codex Lane C)

**Status:** Ready for Codex. Long-running, parallelizable across files. Self-contained brief.
**Companion to:** the control-plane tenant-purity scanner shipped in PR #2354 (`scripts/audit/control-plane-tenant-purity.mjs`).
**Why this exists:** the 2026-05-26 architectural review found **1,151 hardcoded tenant strings** in `src/lib/`, `src/app/`, `src/components/`. Each one is a cross-tenant-leak landmine — the STRESS-P0-001..008 chain was each one of these landmines exploding for a specific signed-in user. Goal: drive the baseline down systematically.

---

## The baseline (as of 2026-05-26)

```
Apex Retail                    663 hits
Heliara                        204 hits  (legacy Meridian alias)
Brindlemark                    149 hits  (legacy First Capital alias)
Meridian Health                 77 hits
First Capital                   57 hits
Arcturus Financial               1 hit
Meridian Hospital                0 hits
Northstar Clinical               0 hits  ← Codex set the bar; lock it in
Northstar MedTech                0 hits  ← same
                              ────
                             1,151 total
```

The CI guard at `npm run audit:control-plane-purity:check` **fails any PR that increases** any of these counts. Reducing is welcome; increasing is not. Northstar at 0 is a hard floor via Jest test.

## Target

Drive total from **1,151 → <200** across multiple PRs over the next ~10 working days. Each PR should reduce the baseline by 50–200 strings. The scanner itself is the gate — passing the gate is sufficient.

## How to find work

```bash
node scripts/audit/control-plane-tenant-purity.mjs              # full report
node scripts/audit/control-plane-tenant-purity.mjs --json       # machine-readable
```

For per-file detail use:
```bash
grep -rln "Apex Retail" src/lib/ src/app/ src/components/ | grep -v __tests__ | head -20
```

## The migration recipe (apply per file)

### Step 1 — classify the hardcode

Each hardcoded tenant string falls into one of four buckets. Read the surrounding code to determine which:

| Bucket | What to do |
|---|---|
| **A. Display fixture** (e.g. `agentQuote: 'Five archetypes in scope for Apex Retail'`) | Replace the literal name with a parameter, resolve at render time via `getActiveClientRow().name` or pass `displayName` down as a prop |
| **B. Seed/demo data tagged to one tenant** (e.g. milestone-tracker-view.ts seed for Apex's four AI programmes) | Move the file to `src/data/<tenant>/`. Add a tenant-aware loader that returns empty/null for other tenants. |
| **C. Regression-test / smoke-test reference** (e.g. tenant-pin assertions, leakage detectors) | Add the file to `FILE_ALLOWLIST` in `scripts/audit/control-plane-tenant-purity.mjs` with a one-line comment explaining why the hardcode is legitimate (test target). |
| **D. Cross-tenant tutorial / comparison surface** (e.g. /home/learn case-study walkthroughs) | Add the file to `FILE_ALLOWLIST` with a comment marking it as an intentional cross-tenant educational surface. Mark it with a comment AT THE TOP OF THE FILE saying `// CROSS-TENANT TUTORIAL — intentionally references multiple tenants; resolved at render time per visible tenant pin.` |

Buckets A and B reduce the baseline count. Buckets C and D leave the count the same but the file becomes exempt from the regression gate going forward (the allowlist excludes it from the scan).

### Step 2 — for Bucket A (display fixtures)

Pattern: replace the literal with a placeholder + resolve at render.

Before:
```ts
// src/lib/intelligence/some-fixture.ts
export const QUOTE = 'Five archetypes in scope for Apex Retail.';
```

After:
```ts
// src/lib/intelligence/some-fixture.ts
export const QUOTE_TEMPLATE = 'Five archetypes in scope for {{tenant}}.';

// src/app/(maestro)/intelligence/.../page.tsx
import { getActiveClientRow } from '@/lib/active-client';
import { QUOTE_TEMPLATE } from '@/lib/intelligence/some-fixture';
const client = await getActiveClientRow(null);
const quote = QUOTE_TEMPLATE.replace('{{tenant}}', client?.name ?? 'your organization');
```

### Step 3 — for Bucket B (tenant-tagged seed data)

Pattern: move file to `src/data/<tenant>/`. The scanner allowlist already excludes `src/data/**`.

Before:
```ts
// src/lib/intelligence/milestone-tracker-view.ts
const SEED = [{ initiative: 'Apex Retail CDP Activation', ... }, ...];
```

After:
```ts
// src/data/apex/milestone-tracker-seed.ts
export const APEX_MILESTONE_SEED = [{ initiative: 'CDP Activation', ... }, ...];
// note: tenant name removed from individual rows since the file's location implies it

// src/lib/intelligence/milestone-tracker-view.ts
import { APEX_MILESTONE_SEED } from '@/data/apex/milestone-tracker-seed';
// ... and emit a tenant-aware version that switches on the active tenant
```

If the file is exclusively used in one tenant's surface, you can simply move it. If it's referenced from multi-tenant code, add a switch:

```ts
const seedByTenant: Record<ClientKey, MilestoneSeedRow[]> = {
  apexretail: APEX_MILESTONE_SEED,
  meridian: [],
  arcturus: [],
  northstar: [],
};
```

### Step 4 — for Buckets C/D (intentional references)

Edit `scripts/audit/control-plane-tenant-purity.mjs`:

```ts
const FILE_ALLOWLIST = new Set([
  'src/lib/client-config.ts',
  'src/lib/active-client.ts',
  'src/lib/auth/cxo-personas.ts',
  'src/lib/demo/demo-dataset-registry.ts',
  // Bucket C / D additions go here, one per line, with a comment:
  'src/lib/home/shell-home-fixture.ts',  // cross-tenant tutorial — case studies reference Apex/Meridian by name
  // ...
]);
```

After updating the allowlist, re-run `node scripts/audit/control-plane-tenant-purity.mjs --baseline` to capture the new lower total. Commit the new baseline file alongside the code changes.

### Step 5 — verify your PR

Before push:
```bash
node scripts/audit/control-plane-tenant-purity.mjs --check
# Should print "✓ Control-plane tenant-purity check passed" and exit 0
# If exit 1, you have new hardcodes — fix or allowlist
```

Then:
```bash
npm run typecheck
npm run lint
npx jest src/lib/__tests__/control-plane-tenant-purity.test.ts
# (last asserts Northstar still at zero — should pass since you're not adding Northstar refs)
```

---

## Suggested order (by impact)

Front-load the high-volume cleanup. Each batch produces a reviewable PR.

| Batch | Target | Expected count drop | Files |
|---|---|---|---|
| 1 | `src/lib/intelligence/seed-patterns-cdp.ts` (8 hits — Bucket B) | 8 → 0 | move pattern content to `src/data/apex/cdp-pattern-seed.ts` |
| 2 | `src/lib/tower/*` fixture files (~50 hits across 12 files) | 50 → 0 | move each to `src/data/<tenant>/tower-*-seed.ts` |
| 3 | `src/lib/intelligence/milestone-tracker-view.ts` (Bucket B) | ~30 → 0 | move Apex programmes seed |
| 4 | `src/lib/home/*` (Bucket D — cross-tenant tutorials) | ~20 → 0 via allowlist | allowlist with comment |
| 5 | Heliara + Brindlemark legacy aliases (353 hits) | 353 → 0 | search-and-replace with current tenant names, or move to `src/data/<tenant>/` |
| 6 | `src/data/arcturus/*` (1 hit) | trivial cleanup |
| 7 | Remaining Apex / Meridian / First Capital strings | 250 → <100 | case-by-case |

Total expected after Batch 7: **< 200 strings**, with Northstar still at 0.

---

## Hard rules

1. **Never increase any count** (the CI guard enforces; do not try to bypass).
2. **Never add a Northstar string anywhere in `src/lib/`, `src/app/`, `src/components/`** — Jest test enforces zero.
3. **Never move tenant data into the canonical `client-config.ts`** unless it's a true alias/canonical-name mapping. Demo content belongs in `src/data/<tenant>/` or in the Supabase corpus.
4. **One PR per logical batch.** Don't bundle multiple unrelated migrations.
5. **Include the updated baseline file** in every PR that legitimately reduces the count. (`node scripts/audit/control-plane-tenant-purity.mjs --baseline` regenerates it.)

## What's out of scope for Lane C

- `scripts/seed/load-tenant-substrate.ts` — Claude's lane
- `src/app/(maestro)/admin/context-layer/*` — Lane B (Packet 25)
- `src/app/api/intelligence/ask/*` — touched by Lane A only when needed
- `datasets/` directories — already data-plane, ignored by scanner
- Any production policy changes — out of all lanes

## Definition of done

The scanner total at `1,151` drops to `<200`. Northstar at 0 stays 0. No regression in agent behavior, no failed tests, no new tenant leaks during a stress run. The `/admin/context-layer` UI (Lane B) renders cleanly for every tenant without any cross-tenant content surfacing.

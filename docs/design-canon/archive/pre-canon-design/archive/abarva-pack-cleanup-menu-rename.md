# AbarVa Build Pack F · Menu + Rename + Dead Code Cleanup

**Date:** April 19, 2026
**Scope:** Three cleanups that tighten the product surface before the next build sprint. Menu restructure (Tower elevated), Maestro rename (drops the word), dead code deletion (Solutions library, AI Value Realization), forbidden-name guard hardened.
**Effort:** ~1 day total. Landable in one commit to engagement-v2 or a new short-lived worktree.
**Depends on:** Pack A (Nexus Depth) since that's where the Maestro naming lives.

---

## Part 1 · Menu restructure

### Final menu (6 items)

```
Home · Engagements · Data · Intelligence · Control Tower · Admin
```

Reduced from 7. Two "products" elevated to peer status in the nav: **Engagements** and **Control Tower**. Intelligence is the third product but its visual weight sits between the two (it's a meta-surface, not a customer-facing product).

### Changes from current

| Current | New | Why |
|---|---|---|
| Dashboard | **Home** | Cleaner. "Dashboard" is vague |
| Engagements | **Engagements** | No change |
| Data setup | **Data** | Shorter |
| User setup | (fold into Admin) | Admin-only concern, not a peer |
| Intelligence | **Intelligence** | No change (Pack E handles its internals) |
| Control Tower | **Control Tower** | No change |
| Admin | **Admin** | Absorbs User setup |

### Visual hierarchy on nav

Three "products" in standard weight (DM Sans 14px 600):
- Engagements
- Control Tower
- Intelligence

Three scaffolding items in lighter weight (DM Sans 14px 500, 60% opacity until hovered):
- Home
- Data
- Admin

Subtle distinction — the eye lands on the products first. Hierarchy without heavy-handed separators.

### Implementation

File: `src/components/layout/TopNav.tsx` (or wherever the nav config lives)

```tsx
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', weight: 'secondary' },
  { label: 'Engagements', href: '/engagements', weight: 'primary' },
  { label: 'Data', href: '/data', weight: 'secondary' },
  { label: 'Intelligence', href: '/intelligence/library', weight: 'primary' },
  { label: 'Control Tower', href: '/tower', weight: 'primary' },
  { label: 'Admin', href: '/admin', weight: 'secondary' },
];
```

Renderer: `weight: 'primary'` gets full opacity, 600 weight. `weight: 'secondary'` gets 60% opacity, 500 weight, full opacity on hover.

### Old routes stay live

Don't delete old URLs. Add redirects:
- `/dashboard` → `/dashboard` (no change, keep "Home" label but URL stays)
- `/data-setup` → `/data`
- `/user-setup` → `/admin/users`
- `/solutions` → `/engagements` (with optional toast: "Solutions has moved — the engagement is the product")
- `/ai-value-realization` → `/intelligence/insights`

Old bookmarks don't break.

### Commit

```
refactor(nav): restructure to 6 items, elevate Control Tower + Intelligence as peers to Engagements
```

---

## Part 2 · Maestro rename

**Decision from Anand:** drop "Maestro" entirely. The concept surfaces product-side as "Engagement Intelligence" (Pack E · Insights). Internal code uses neutral naming.

### Rename map

| Old | New | Where |
|---|---|---|
| `persons.maestro_profile` | `persons.profile` | migration + every reference |
| `persons.maestro_profile_updated_at` | `persons.profile_updated_at` | migration + references |
| `relationship_notes.subject_type = 'maestro'` | `'user'` | migration + references |
| `MAESTRO CONTEXT` block header | `USER CONTEXT` | system prompt assembly |
| `assembleMaestroContextBlock()` | `assembleUserContextBlock()` | function rename |
| `maestro-context.ts` | `user-context.ts` | file rename |
| `maestro-extractor.ts` | `user-extractor.ts` | file rename |
| `updateMaestroProfile()` | `updateUserProfile()` | function rename |
| `MaestroTurnContext` interface | `UserTurnContext` | type rename |
| `MaestroChrome` component | `AppChrome` | component rename |
| `maestroProfile` state var anywhere | `profile` | variable renames |
| Comments referencing "Maestro" as a role | drop or neutralize | grep + review |

### Migration 025 — column renames

**`db/migrations/025_drop_maestro_naming.sql`**

```sql
BEGIN;

ALTER TABLE persons RENAME COLUMN maestro_profile TO profile;
ALTER TABLE persons RENAME COLUMN maestro_profile_updated_at TO profile_updated_at;

-- subject_type enum already accepts 'user' per migration 023's CHECK.
-- Update existing rows from 'maestro' to 'user'.
UPDATE relationship_notes SET subject_type = 'user' WHERE subject_type = 'maestro';

-- Tighten the CHECK constraint (drop 'maestro', keep 'user' + 'sponsor' + 'observer')
ALTER TABLE relationship_notes DROP CONSTRAINT IF EXISTS relationship_notes_subject_type_check;
ALTER TABLE relationship_notes ADD CONSTRAINT relationship_notes_subject_type_check
  CHECK (subject_type IN ('sponsor', 'user', 'observer'));

NOTIFY pgrst, 'reload schema';

COMMIT;
```

### Code pass

Claude Code — run this sequence:

```bash
# 1. Grep first to inventory. Expect ~40-80 matches.
git grep -n -i 'maestro' -- ':!*.md' ':!node_modules'

# 2. Case-by-case replacement, NOT global sed:
#    - File renames (mv + update imports)
#    - Function renames (references across codebase)
#    - Type renames
#    - Column references in queries
#    - System prompt constants
#    - Component prop names
# 3. Run typecheck: npx tsc --noEmit
# 4. Run tests if any
# 5. Manual QA: visit /engage/meridian, open turn history, verify USER CONTEXT in trace drawer (if Pack D Principle 6 shipped)
```

### Markdown docs don't need the rename

The pack docs in `/mnt/user-data/outputs/` reference Maestro throughout. **Leave them alone** — they're historical artifacts. Future pack docs use the new naming.

### Commit

```
refactor(naming): drop "Maestro" — persons.profile, USER CONTEXT, subject_type 'user'
```

---

## Part 3 · Dead code + menu item deletion

### Solutions library

Grep and delete:

```bash
git grep -l -i 'solutions' -- 'src/' 'db/'
```

Expected hits to delete:
- `src/app/solutions/` (entire directory if present)
- `src/components/solutions/` (entire directory if present)
- `src/lib/solutions/` (entire directory if present)
- `src/app/api/solutions/` (entire directory if present)
- Any nav/menu entries for "Solutions"
- `db/migrations/*solutions*.sql` — **check if applied first.** If yes, add a drop migration. If no, delete the migration file.
- Seed script references to `solutions` table
- Type definitions: `Solution`, `SolutionLibrary`, etc.

If `solutions` table exists in prod:

```sql
-- db/migrations/026_drop_solutions.sql
BEGIN;
DROP TABLE IF EXISTS solutions CASCADE;
DROP TABLE IF EXISTS solution_components CASCADE;
DROP TABLE IF EXISTS solution_industries CASCADE;
-- ... whatever existed
COMMIT;
```

Run diagnostic first:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%solution%';
```

If diagnostic shows any of those tables have data, STOP and confirm with Anand before dropping.

### AI Value Realization menu

Same treatment:
- `src/app/ai-value-realization/` → delete
- `src/components/aiValueRealization/` → delete
- Any nav/menu entries → delete
- Redirect `/ai-value-realization` → `/intelligence/insights`

### Grep sweep for other dead terms

```bash
git grep -l -i -E '(cade|accenture|dell|mckinsey|deloitte|bcg|bain|huron|navigant|presbyterian|md anderson|phs)' -- ':!*.md' ':!node_modules'
```

Flag every hit for review. Most should be zero (naming rules have been enforced). If any hit appears in product code, rename per `FORBIDDEN_CLIENT_NAMES` guidance (Part 4).

### Commit

```
chore(cleanup): delete Solutions library + AI Value Realization dead code + redirect old URLs
```

---

## Part 4 · Forbidden-name guard (harden)

The manifest flagged this already. Make sure the guard is implemented, not just documented.

### File: `src/lib/config/naming.ts`

```typescript
export const FORBIDDEN_CLIENT_NAMES = [
  // Hard naming-rule violations
  'cade', 'accenture', 'dell', 'mckinsey', 'deloitte', 'bcg', 'bain',
  'huron', 'navigant', 'presbyterian', 'phs', 'md anderson',
  // Previously-seeded unwanted rows (keep the guard permanent)
  'commonspirit health', 'hp inc', 'first capital financial', 'meridian health system',
];

export function isForbiddenClientName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return FORBIDDEN_CLIENT_NAMES.some(forbidden =>
    normalized === forbidden || normalized.includes(forbidden)
  );
}

export function assertAllowedClientName(name: string): void {
  if (isForbiddenClientName(name)) {
    throw new Error(
      `Forbidden client name: "${name}" matches the AbarVa naming rules deny list. ` +
      `Use composite organization names for demos. See user memory for the full rule set.`
    );
  }
}
```

### Wire into every creation path

- `src/app/api/clients/create/route.ts` (or equivalent) → call `assertAllowedClientName(body.name)` before insert
- `src/scripts/seed/*.ts` (all seed scripts) → same check
- `src/scripts/tower-seed.ts` → same check
- `src/lib/data-setup/client-create.ts` → same check

### Database-level guard (belt + suspenders)

```sql
-- Add to migration 025 or a new migration:
CREATE OR REPLACE FUNCTION check_client_name_allowed() RETURNS trigger AS $$
BEGIN
  IF lower(trim(NEW.name)) = ANY(ARRAY[
    'cade', 'accenture', 'dell', 'mckinsey', 'deloitte', 'bcg', 'bain',
    'huron', 'navigant', 'presbyterian', 'phs', 'md anderson'
  ]) THEN
    RAISE EXCEPTION 'Forbidden client name: % violates naming rules', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_client_naming
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION check_client_name_allowed();
```

Even if future code forgets to call `assertAllowedClientName`, the DB won't accept the insert.

### Commit

```
feat(safety): forbidden-name guard in app layer + DB trigger
```

---

## Rollout sequence

Single worktree is fine — ideally on the same worktree where Pack A is executing since the rename touches Pack A's files.

```
1. Migration 025 (Maestro rename columns)
2. Code rename pass (files, functions, types, components)
3. Typecheck passes
4. Menu restructure (nav config update + redirects)
5. Dead code deletion (Solutions + AI Value Realization)
6. Migration 026 (drop Solutions tables if they exist)
7. Forbidden-name guard (app + DB trigger)
8. Manual QA: click through all 6 menu items, verify no Maestro references in UI, verify old URLs redirect
9. Four commits as specified in each section
```

---

## Acceptance

- Nav shows exactly 6 items, Tower and Engagements and Intelligence at primary visual weight
- `git grep -i maestro -- 'src/' 'db/'` returns zero matches (except in `/outputs/` pack docs)
- No "Solutions" nav item, no `/solutions` page, no `solutions` table
- No "AI Value Realization" nav item, old URL redirects to `/intelligence/insights`
- Attempting to create a client named "McKinsey" throws an error (both at app layer and DB layer)
- MD Anderson, CommonSpirit Health, HP Inc, First Capital Financial (duplicate), Meridian Health System (duplicate) all removed from `clients` table

---

## What this pack ships

A tighter, cleaner product surface. No dead weight, no orphan terminology, no naming-rule regressions possible. Foundation clear for the demo.

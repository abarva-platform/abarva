# Strategic Moves Participant Backfill Dry-Run (Local)

Date: 2026-05-03
Workspace: `/Users/anand/Documents/Codex/2026-04-28/repo-users-anand-projects-nexus-branch`
Migration target: `supabase/migrations/20260503113000_strategic_moves_schema_v02.sql`

## Scope
This dry-run validates the `engagement_participants.person_id` backfill logic order:
1. `user_id` -> `persons.email`
2. `user_name` -> `persons.name`

Per instruction, this report is local-only and does not use staging credentials.

## Local data sources inspected
- `supabase/migrations/054_program_demo_users.sql`
- `src/scripts/seed/programs-demo-apex.ts`
- `supabase/migrations/047_demo_portfolio_seed.sql`

## Findings (local fixture/seed paths)
- `054_program_demo_users.sql` inserts participants with `user_id = person_id::text` and `user_name = person_name` from the same `persons` seed set.
  - Email pass: may be unresolved where `user_id` is UUID text, not email.
  - Name pass: resolves to seeded `persons.name`.
- `programs-demo-apex.ts` inserts participant rows with `user_name` sourced from seeded person names.
  - Email pass: may miss (UUID user_id).
  - Name pass: resolves.

### Local unresolved estimate
From repository fixture/seed definitions above: **0 unresolved expected** after the second (name) pass.

## Staging validation query (run before applying NOT NULL posture)
```sql
-- unresolved rows after backfill passes
SELECT
  ep.engagement_id,
  ep.id AS participant_row_id,
  ep.user_id,
  ep.user_name,
  ep.role,
  'unresolved'::text AS resolution_status
FROM engagement_participants ep
WHERE ep.person_id IS NULL
ORDER BY ep.engagement_id, ep.id;
```

## Gate before enforcing NOT NULL
- If unresolved rows > 0: do not enforce `person_id NOT NULL` yet.
- If unresolved rows = 0 (or rows explicitly triaged): proceed with a follow-on migration for `NOT NULL` posture.

## Notes
- This local report is intentionally conservative: it does not claim live DB parity.
- Real unresolved count must be produced in staging/prod by running the SQL above on live data.

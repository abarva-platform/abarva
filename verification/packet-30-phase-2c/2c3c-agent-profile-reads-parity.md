# Packet 30 Phase 2C.3c — Agent/Profile Reads Parity

## Scope

This slice moves four small agent/profile read helpers from direct Supabase
helpers to `azureRead`:

- `src/lib/agent/prompts/_shared/maestro-context.ts`
- `src/lib/agent/prompts/_shared/topic-intelligence.ts`
- `src/lib/agent/tools/program/lookupPerson.ts`
- `src/lib/integrations/ai-egress/tenant-policy.ts`

No write paths, storage operations, migrations, or egress provider calls change.

## Behavior Parity

| File | Prior behavior | New behavior |
|---|---|---|
| `maestro-context.ts` | Read `persons.maestro_profile` and latest five `relationship_notes`; empty-safe. | Reads the same rows through `azureRead`; remains empty-safe. |
| `topic-intelligence.ts` | Read assigned `engagement_topics_map` rows, then matching `engagement_topics`; empty-safe. | Reads the same rows through `azureRead`; remains empty-safe. |
| `lookupPerson.ts` | Tokenize name/role query and OR-match against `persons.name`, `role`, and `email`, then tenant-scope by active client organization. | Uses parameterized SQL with `ILIKE ANY(...)` across the same columns, then preserves the same tenant-scoping logic. |
| `tenant-policy.ts` | Look up `clients.ai_policy` by id, tenant key, or name; throw on query error; default conservative when no valid policy exists. | Performs the same lookup through `azureRead`; preserves conservative fallback and error wrapping. |

## Census Delta

Baseline after Section 3.1 slice 2C.3b:

```text
144 files / 594 import-helper matches
298 files / 1401 broad matches
```

After this slice:

```text
140 files / 582 import-helper matches
294 files / 1383 broad matches
```

Delta:

```text
-4 files with import-helper matches
-12 import-helper matches
-4 files with broad matches
-18 broad matches
```

## Validation

```text
npx eslint src/lib/integrations/ai-egress/tenant-policy.ts src/lib/agent/prompts/_shared/maestro-context.ts src/lib/agent/prompts/_shared/topic-intelligence.ts src/lib/agent/tools/program/lookupPerson.ts
```

Result: PASS.

```text
npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts --runInBand
```

Result: PASS, 1 suite / 24 tests.

```text
npm run audit:runtime-supabase-imports
```

Result: PASS in warn mode, with the census delta above.

```text
npx tsc --noEmit --pretty false --skipLibCheck
```

Result: BLOCKED only by the pre-existing optional dependency resolution debt:
`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`,
and `@resvg/resvg-js`.

## Rollback

Revert this slice to restore direct Supabase reads in the four helper files.
No data rollback is required.

# 2026-06-02-template-library-exception-intake — Template Library Exception Intake

## Release ID

`2026-06-02-template-library-exception-intake`

## Status

`candidate`

## Plain-English Summary

Adds a controlled exception path for pilot context uploads that do not match a canonical template. Admins can now see every supported file format in the context template explorer, and the ingestion layer can assess whether a client upload is ready, needs column mapping, needs metadata, or uses an unsupported format.

## Layer Impact

- `client-data-lane`: Extends the private context-ingestion template registry and alignment assessment used before client data is parsed or committed.
- `internal-admin`: Enriches the admin template explorer so operators can see canonical formats, exception formats, and metadata packet requirements.

## Client Applicability

- All clients: Yes, the template and exception metadata model is generic across pilot tenants.
- Specific clients: None.
- Internal only: The current explorer route is an admin/setup surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/template-registry.ts` adds supported format profiles, exception formats, and metadata requirements.
- `src/lib/context-ingestion/template-alignment.ts` adds the upload alignment assessment helper.
- `src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts` covers format coverage, document metadata, non-aligned column mapping, PDF KPI exceptions, and org-structure document exceptions.
- `src/app/(maestro)/admin/context-layer/templates/page.tsx` surfaces canonical formats, exception formats, and metadata packet requirements.

## QA / Validation

- PASS — `npx jest src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts src/lib/context-ingestion/__tests__/schema-preflight.test.ts --runInBand`
- PASS — `npx eslint src/lib/context-ingestion/template-registry.ts src/lib/context-ingestion/template-alignment.ts src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts src/app/'(maestro)'/admin/context-layer/templates/page.tsx`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The registry and admin explorer update deploy with the app. No migration is included; durable persistence for exception packets remains a follow-on private data-plane task.

## Rollback Plan

Revert the PR. This removes the new exception metadata model and explorer display without changing stored tenant data.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2823
- CI: pending.
- Local validation commands listed above.

## Known Gaps

- Exception metadata is modeled and assessed in code but not yet persisted as a durable operator/client clarification queue.
- Native Azure document parsing is still covered by the broader pilot-loader processing wave and is not implemented in this slice.

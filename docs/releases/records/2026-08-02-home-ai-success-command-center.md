# 2026-08-02-home-ai-success-command-center — Home AI Success Command Center

## Release ID

`2026-08-02-home-ai-success-command-center`

## Status

`candidate`

## Plain-English Summary

Replaces the prior Home runtime with an evidence-bound AI Success Command Center. The new Home starts with the executive thesis, shows value-proof posture, renders portfolio and value-realization charts, and includes an end-to-end current-state architecture visual backed by governed synthetic assessment artifacts.

## Layer Impact

- Release lane: `global-control-lane`.
- CLIENT INTAKE: no client intake contract changes.
- SOURCE ADAPTERS: no loader or adapter mutation in this release.
- CANONICAL MODEL: no canonical model mutation in this release.
- PRODUCTS: `/home` now renders the AI Success Command Center. The old V4 preview runtime route and renderer package are retired from source.

## Client Applicability

- All clients: no.
- Specific clients: no production client activation in this release record.
- Internal only: yes, local candidate validation and review.
- Public/demo only: synthetic demonstration data only.
- Feature flag: none.

## Changes Included

- `/home` route now renders the AI Success Command Center data-bound page.
- New Home data adapter reads governed local assessment reports and allowed values.
- New Home command-center component uses Recharts and a current-state architecture renderer.
- The first viewport now renders the generated architecture advisory thesis,
  strengths, constraints, and leadership decision content instead of a static
  compressed summary.
- Ask aVa is wired as a real Home KNOW drawer. It calls `/api/home/know/ask`
  with the active tenant key, renders the shared aVa answer packet, supports
  compact and expanded states, and exposes the existing HTML/PDF export controls
  in expanded mode.
- Legacy Home V4 preview route, fixtures, and renderer package are removed from runtime source.
- Home audit script now validates data quality, visible values, source-copy contract checks, legacy retirement, and packages screenshots into a ZIP artifact.

## QA / Validation

- `npx eslint ...` passed with no errors; CSS file is ignored by ESLint config.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false` passed.
- `npm run test:nav` passed: 26 tests.
- `npm run test:behaviors` passed: 195 tests.
- `npx jest src/components/home/ai-success-command-center/__tests__/AiSuccessCommandCenter.test.tsx --runInBand` passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npm run build` passed after the Ask aVa repair.
- `npm run test:nav` passed: 26 tests.
- `npm run test:behaviors` passed: 195 tests.
- Home audit package reported `local_release_candidate`.
- Browser proof verified `/home` renders the expected headline, claim-threshold copy, architecture section, Recharts SVGs, no debug binding control, and no horizontal overflow.
- Anonymous `/home` redirects to `/sign-in?redirect=%2Fhome` after local proof hook removal.

## Rollout Plan

Merge through PR. Production activation requires the approved Azure Container Apps main deploy workflow and the standard signed-in browser proof on the deployed runtime.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none in this local candidate.
- Approved image digest: not applicable until deploy.
- ACA runtime invariant: not proven in this local candidate.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming production live proof.

## Rollback Plan

Revert this release commit or restore the prior Home implementation through a PR. No database migrations are included.

## Audit Evidence

- Local audit ZIP: `/Users/anand/Downloads/Abarva_Home_AI_Success_Command_Center_Full_Audit_20260802T223310.zip`
- Local audit ZIP SHA-256: `2e53f150e1f005823a4cd274b9b1db4b456bae4f1f2348471948e2e0b6c298d1`
- Ask aVa repair report: `proof/home-command-center-ava/report.md`
- Signed-in production before-state DOM proof:
  `proof/home-command-center-ava/live-home-current-state-dom.json`
- Visual screenshots: bundled in the audit ZIP under `visual-proof/`.
- Production build output: local command completed successfully.

## Known Gaps

- Live Postgres and Cube environment verification were open locally because credentials were not present.
- Authenticated production/signed-in proof is still required on the deployed ACA runtime.
- Local dev console included Clerk development-key warnings and server 404 diagnostic logging; production console cleanliness still needs signed-in runtime proof.

# Section 5 Testing Loop

This folder is the stable entrypoint for automated and manual demo-cycle testing.

Use it together with:

- Companion provisioning work: `scripts/create-test-users.ts`
- Findings harness: `src/testing/findings/`
- Cycle reports: `reports/test-cycles/`

## Testing loop

1. Provision or refresh the test accounts with `scripts/create-test-users.ts`.
2. Load one persona briefing from `docs/testing/personas/`.
3. Run the target journey for that persona.
4. Record turn-level findings into `reports/test-cycles/{cycle_id}/`.
5. Compare the current cycle against the previous cycle and classify deltas.

## Credential handling

Persona briefings intentionally do not hardcode live passwords or investor tokens.

- Account identities and local credential output come from the companion provisioning work in `scripts/create-test-users.ts`
- The latest local provisioning artifact is written to `reports/test-users/latest.local.json`
- Investor token values are generated during provisioning and should be read from the local artifact, not committed to the repo

## Cycle format

- Cycle id format: `cycle-YYYY-MM-DD-N`
- Example: `cycle-2026-04-23-1`

## Persona roster

| Persona | File | Role | Tenant scope | Primary use |
| --- | --- | --- | --- | --- |
| Marcus T. | `personas/marcus-t-apex-cfo.md` | client | Apex only | CFO approval and value scrutiny |
| Dr. L. Morales | `personas/dr-l-meridian-cmio.md` | client | Meridian only | Program creation and clinical workflow validation |
| Jake Anthology | `personas/jake-anthology-analyst.md` | investor | All four tenants | Investor diligence and cross-tenant review |
| Dara Platform | `personas/dara-platform-vp.md` | external | Public-only | Unauthenticated platform and messaging review |
| Mike Fortune | `personas/mike-fortune40-cio.md` | client | Meridian fallback | Cold executive credibility review |

## What every run should verify

- The persona only sees the routes and tenants they are supposed to see
- Navigation resolves cleanly with no 404s and no tenant leakage
- Composite and demo-rendering disclaimers remain present where required
- User-visible content does not expose raw code, unresolved tokens, or placeholder strings
- Findings are tagged to Categories A-E before the cycle closes

## Categories A-E

- `A`: routing and broken-link integrity
- `B`: tenant scoping and access control
- `C`: render quality and authored-content integrity
- `D`: click-path and workflow behavior
- `E`: performance, accessibility, and polish

## Authoring rule

Treat the persona files in this folder as the canonical briefing packets for extensions, crawlers, and human reviewers. If provisioning changes, update the persona docs in the same PR so the test loop stays synchronized.

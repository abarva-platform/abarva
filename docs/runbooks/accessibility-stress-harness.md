# Accessibility Stress Harness

This runbook covers T181: keyboard-only and screen-reader-oriented workflow
stress testing beyond static axe checks.

## Scope

The harness validates:

- A single visible `main` landmark on public and authenticated product surfaces.
- Keyboard reachability for visible links, buttons, inputs, and role-button
  controls.
- Visible focus indication on each focused stop.
- Coverage across Home, Admin, Intelligence, Strategic Moves, Source, and Tower
  when Clerk authentication is available.

## Command

```bash
BASE_URL=http://localhost:3000 \
  npx playwright test tests/e2e/accessibility-keyboard-stress.spec.ts
```

For deployed validation:

```bash
BASE_URL=https://app.abarva.ai \
  npx playwright test tests/e2e/accessibility-keyboard-stress.spec.ts
```

Authenticated routes require `CLERK_SESSION_TOKEN` or `CLERK_SECRET_KEY` per the
existing e2e auth helpers.

## Expected Evidence

Capture:

- Playwright command output.
- Target `BASE_URL`.
- Browser/project name.
- Any trace or screenshot produced by Playwright on failure.
- Defect tickets for missing landmarks, hidden focus, unreachable controls, or
  keyboard traps.

## Completion Boundary

This repository change adds the executable harness. T181 remains `In progress`
until the harness is run against the intended preview or production environment
with real Clerk auth and the resulting evidence is attached to the tracker.

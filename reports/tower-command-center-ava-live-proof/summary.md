# Tower Command Center aVa Live Proof

Date: 2026-07-23

Status: `MERIDIAN_LIVE_PROVEN`

Scope:

- Tenant: Meridian / Healthcare Demo
- Route: `https://app.abarva.ai/tower`
- Feature: `tower_command_center_v2`
- Proof account state: `.auth/agent-meridian.json`
- Merge commit proven: `38b8e3dd1a12e6e17170913acced7833c047bc61`

Deployment proof:

- ACA main deploy workflow run `30011196596` completed successfully.
- Runtime invariant passed at `2026-07-23T13:35:19.426Z`.
- Template and 100%-traffic revision image both used
  `acrabarvalab001.azurecr.io/abarva/web@sha256:56a0e1dfba15dbe2e71426de85ab9b6b27c6979dd8c301037650e3f0023ddc0a`.
- 100% traffic was on `ca-abarva-web-lab-eastus--m38b8e3dd`.
- `/api/health` returned `ok: true`.

Signed-in browser proof:

- `/tower?client=meridian` rendered the Command Center root.
- The governed aVa collapsed launcher was visible on the Command Center.
- Opening the launcher rendered the shared AgentDock composer.
- The governance caption remained visible: "aVa proposes · you approve · nothing acts on its own".
- `/tower/command?tab=evidence&client=meridian` redirected to `/tower?tab=evidence` and selected Evidence.
- `/tower/legacy?client=meridian` remained available and still mounted AgentDock.
- A real UI question posted to `/api/tower/cio-chat`, returned HTTP 200 with
  `application/x-ndjson`, and rendered an agent answer without error fallback copy.
- Isolated probes recorded zero console errors and zero page errors.

Evidence files:

- `2026-07-23-isolation/proof.json`
- `2026-07-23-isolation/tower-command-center-ava.png`
- `2026-07-23-isolation/tower-command-alias.png`
- `2026-07-23-isolation/tower-legacy.png`
- `2026-07-23-chat/proof.json`
- `2026-07-23-chat/tower-command-center-ava-answer.png`
- `../../audit-artifacts/aca-runtime-drift/tower-command-center-ava-20260723/runtime-invariant-proof.json`

Boundary:

- This proves Meridian only.
- It does not approve platform default-on.
- It does not prove other tenants.

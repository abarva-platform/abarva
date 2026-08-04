# Home Command Center aVa / Advisory Surface Proof

Date: 2026-08-03

## Scope

Checked the signed-in `/home` page for the airline demo Home command center and
patched the Home command-center branch so the page:

- renders the generated architecture advisory thesis on the landing viewport;
- opens a real Ask aVa drawer from the top button and side rail;
- binds questions to `/api/home/know/ask` with the active tenant key;
- renders aVa answers through the shared rich answer renderer;
- exposes HTML/PDF export controls in expanded mode.

No loaders, canonical data, schemas, promotions, baselines, publications, or
deployment settings were changed.

## Live Before-State Evidence

Artifact: `proof/home-command-center-ava/live-home-current-state-dom.json`

Findings from signed-in production DOM:

- Route: `https://app.abarva.ai/home`
- Title: `AI Success Command Center | AbarVa`
- Signed-in shell was visible.
- Current page rendered the Home command-center sections and the generated
  architecture/value evidence text.
- `hasAskAva: false`, so the live page did not expose a functional Ask aVa
  surface.

Screenshot note: the in-app browser screenshot API timed out or rejected the
available capture modes. A desktop fallback capture returned a black frame and
was discarded. The retained proof is DOM-based.

## Data Quality / Product Gaps

- Advisory rendering gap: the first viewport compressed the generated advisory
  into a generic thesis. It did not show the stronger generated architecture
  advisory thesis, strength, constraint, and leadership-decision material.
- aVa wiring gap: the visible Ask aVa controls were static. They did not open a
  reasoning surface or call the Home KNOW provider.
- Value-proof gap: the loaded evidence still shows 162 governed value claims and
  zero claimable value. That is a real product truth, not a UI defect.
- Contract evidence gap: commercial posture remains limited until clause/page
  level evidence is loaded for the contract corpus.
- Architecture target-state gap: current-state architecture is loaded; target
  state remains a hypothesis until explicitly authored and governed.
- Live proof gap: local `/home` remains Clerk-protected. Auth was not bypassed,
  so post-patch visual proof requires either deployment or a signed-in local
  session.

## Implemented Closure

- Landing page now uses `data.advisory.title` and
  `data.advisory.executiveThesis` directly.
- First viewport now adds decision-grade advisory pillars from generated
  strengths, constraints, and leadership decisions.
- Board readout panel now uses the generated transformation-priority rationale
  when available.
- Ask aVa drawer now supports closed, compact, and expanded states.
- Ask aVa questions call `/api/home/know/ask` with the active tenant key.
- Home KNOW responses are converted through `composeHomeKnowAvaAnswer`.
- Answers render through `AgentAnswerRenderer`, giving tables, charts, graphs,
  citations, caveats, and expanded HTML/PDF export controls.

## Validation

- `npx jest src/components/home/ai-success-command-center/__tests__/AiSuccessCommandCenter.test.tsx --runInBand`
  passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false`
  passed.
- `npx eslint src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx src/lib/home/readSkyHarborAiSuccessHome.ts src/components/home/ai-success-command-center/__tests__/AiSuccessCommandCenter.test.tsx docs/releases/records/2026-08-02-home-ai-success-command-center.md`
  passed for code; Markdown release record was ignored by ESLint config.
- `npm run release:check` passed.

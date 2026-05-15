# AZLAB43 - L7 Agent Quality Live Runner

Status: implemented in repo  
Date: 2026-05-15  
Layer: L7 - Agent quality

## Why This Matters

AZLAB37 gave AbarVa a deterministic 50-question corpus across Sentinel, Atlas, Nexus, Source, and Steward. That proved the evaluation contract existed, but it did not yet execute live answers.

This slice adds the runner/scorer that moves L7 from "we have questions" to "we can measure answers."

## What Landed

| Artifact | Purpose |
|---|---|
| `src/scripts/qa/agent-quality-live-runner.ts` | Operator runner for dry-run case planning, captured-answer scoring, and optional live execution against `/api/chat/agent`. |
| `npm run qa:agent-quality:runner` | General entry point. Supports `--mode dry-run`, `--mode score-file`, and `--mode live`. |
| `npm run qa:agent-quality:score` | Scores captured JSONL answers. |
| `npm run qa:agent-quality:live` | Executes live prompts against a target app URL using `AGENT_QUALITY_SESSION_COOKIE`. |
| `.github/workflows/agent-quality-live-runner.yml` | Weekly dry-run and manual live workflow. |

## Scoring Model

The runner scores answer shape rather than exact prose. Each JSONL corpus row already defines:

- required tenant terms
- forbidden terms
- whether tenant facts are required
- whether citation/evidence signals are required
- whether dissent/risk framing is required

The runner emits a per-case grade:

| Grade | Meaning |
|---|---|
| A | All expected checks pass. |
| B | One non-fatal miss. |
| C | Two misses; usable for debugging, not demo-grade. |
| D | Serious miss, especially forbidden terms. |
| F | Transport failure or empty answer. |

Default blocking threshold is `D` or worse. Operators can tighten or loosen with `--fail-on-grade`.

## Live Mode

Live mode calls:

```text
POST /api/chat/agent
```

with the case prompt, agent name, surface, tenant display name, and a small `surfaceContext.agentQualityRun` marker. It uses the existing authenticated app path instead of a test-only bypass.

Required input:

```bash
AGENT_QUALITY_SESSION_COOKIE='...' \
npm run qa:agent-quality:live -- \
  --base-url https://app.abarva.ai \
  --agent sentinel \
  --tenant apex-retail \
  --limit 5 \
  --out /tmp/agent-quality-answers.jsonl
```

The same captured answers can be re-scored without another live run:

```bash
npm run qa:agent-quality:score -- \
  --answers /tmp/agent-quality-answers.jsonl
```

## Current Limits

This is a deterministic heuristic scorer, not an LLM judge. It intentionally checks what the product can enforce cheaply:

- required / forbidden business terms
- evidence and citation signals
- dissent/risk language
- transport success
- answer presence

It does not yet score semantic correctness, cross-turn memory, or arithmetic/date consistency. Those remain in the Sentinel consistency-guard roadmap.

## Next Step

Run the manual GitHub workflow against the Azure Container Apps FQDN once Clerk allows the Azure host and a short-lived `AGENT_QUALITY_SESSION_COOKIE` is loaded as a repository secret. Store the JSONL answers artifact as the first L7 drift baseline.

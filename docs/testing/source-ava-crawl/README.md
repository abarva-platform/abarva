# Source/aVa Crawl Harness

`scripts/audit/source-ava-crawl.mjs` is a deterministic crawler/report harness for Source/aVa structured-response verification. It encodes the persona rubric from `docs/abarva-source/build-pack/17_CRAWLER_PERSONA_VERIFICATION.md` plus the Source lifecycle stages:

- Current state
- Demand challenge
- Scope
- RFP
- Vendor responses
- Evaluation
- Pricing
- BAFO
- Executive decision
- Transition
- Value realization

The harness is intentionally useful without external credentials. A credential-free browser run may only prove that routes are protected by auth; it will still write a report and mark signed-in Source/aVa behavior as unproven instead of treating auth blocking as product success.

## Run Modes

Static contract report, no browser:

```bash
node scripts/audit/source-ava-crawl.mjs --no-browser
```

Local browser crawl against a running dev server:

```bash
npm run dev
node scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000
```

Authenticated launch-identity crawl against a running dev server:

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs \
  --base-url http://localhost:3000 \
  --auth-client apex

DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/audit/source-ava-crawl.mjs \
  --base-url http://localhost:3000 \
  --auth-client skyharbor
```

The authenticated mode uses Clerk server-ticket sign-in for the launch identity associated with the requested client and then pins `abarva_active_client`.
If the local Clerk publishable/secret keys do not match, the report records the redirect-loop/auth blocker as `DEFER` instead of claiming signed-in Source proof.

Specific event route slug or id:

```bash
node scripts/audit/source-ava-crawl.mjs \
  --base-url http://localhost:3000 \
  --event-id data-ai-modernization-si-selection
```

Score captured aVa/Nexus responses in addition to route/UI evidence:

```bash
node scripts/audit/source-ava-crawl.mjs \
  --base-url http://localhost:3000 \
  --response-file reports/source-ava-responses.json
```

CI-style failure on rejected checks or auth-blocked crawl:

```bash
node scripts/audit/source-ava-crawl.mjs --base-url http://localhost:3000 --fail-on-reject
```

## Output

Each run writes:

```text
reports/source-ava-crawl/<timestamp>/
  source-ava-crawl.json
  source-ava-crawl.md
  route-*.png              # only for browser-accessible routes
```

Use `--out-dir` to override the report destination.

## Response File Shape

JSON object form:

```json
{
  "cio": "The current portfolio has ...",
  "cfo": "The value at stake is projected, not booked ...",
  "scope": "RFP release is blocked until ..."
}
```

JSON array form:

```json
[
  {
    "key": "cio",
    "prompt": "What needs my attention?",
    "response": "The current portfolio has ..."
  }
]
```

Markdown headings also work. The heading text is used as the response key:

```md
## cio

The current portfolio has ...
```

Useful keys include persona keys (`cio`, `cfo`, `procurement`, `cto`, `pmo`, `legal`, `sponsor`, `sourcing-lead`) and lifecycle keys (`current-state`, `demand-challenge`, `scope`, `rfp`, `vendor-responses`, `evaluation`, `pricing`, `bafo`, `executive-decision`, `transition`, `value-realization`).

## What It Checks

The report separates:

- Route reachability and auth blocking
- UI evidence terms for lifecycle stage, owner/action, value, risk, evidence, and governance signals
- Optional captured aVa/Nexus response grounding
- Persona verdicts in the standard format: persona, route, scenario, verdict, rationale, evidence observed, Nexus response observed, failures, required fix before release
- Table/chart evidence expectations for vendor response tables, pricing/value/risk charts, and supporting text

Verdicts are deterministic heuristics:

- `ACCEPT`: accessible UI evidence and captured response evidence both meet the threshold
- `DEFER`: partial evidence exists, browser access is auth-blocked, or response evidence was not supplied
- `REJECT`: required UI/response grounding is missing or captured text contains reject-patterns such as generic dashboard advice or unsupported certainty

## Truth Boundary

A passing static report is not live Source proof. A browser report with all routes blocked by auth only proves access control behavior. Release evidence should include a signed-in crawl and response-file scoring for the personas and lifecycle stages touched by the implementation.

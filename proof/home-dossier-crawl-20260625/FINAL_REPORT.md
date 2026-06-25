# Home/aVa Dimension Dossier Crawl - Final Report

Status: GO WITH FIXES for local engine path; BLOCKED for signed-in local browser due Clerk session policy; NOT DEPLOYED.

## Progress

| Category | Status | Complete |
| --- | --- | ---: |
| Dimension dossier backend | Complete locally | 100% |
| Home API wiring | Complete locally | 100% |
| Home renderer wiring | Complete locally | 95% |
| Regression tests | Passing locally | 100% |
| 54-question dossier crawl | Passing locally | 100% |
| Signed-in prod auth-state smoke | Passing for SkyHarbor/Lakeshore | 100% |
| Signed-in local browser crawl | Blocked by Clerk redirect/access policy | 35% |
| ACA deploy/live crawl | Not run in this worktree | 0% |

## What Passed

- 54 required Home/aVa questions executed against the new dossier engine.
- SkyHarbor: 27/27 passed.
- Lakeshore: 27/27 passed.
- Critical failures: 0.
- S25 and L25 hand off to Intelligence instead of making unsupported Home recommendations.
- Tenant fence probes do not expose the other tenant's actuals.
- Exact SkyHarbor org regression now synthesizes loaded named leadership instead of saying the organization cannot be characterized.

## Key Evidence

- `crawl-results.json`: 54/54 pass.
- `endpoint-audit.json`: route, dimensions, attached source families, section counts, citation counts.
- `tenant-fence-results.json`: cross-tenant probes and outcomes.
- `transcripts/skyharbor.md`: full SkyHarbor question/answer transcript.
- `transcripts/lakeshore.md`: full Lakeshore question/answer transcript.
- `screenshots/skyharbor/live-auth-smoke.png`: signed-in production Home smoke using existing auth state.
- `screenshots/lakeshore/live-auth-smoke.png`: signed-in production Home smoke using existing auth state.

## Important Boundary

The deployed production app was only auth-smoked. The new local code has not been merged/deployed in this run, so the full signed-in prod crawl against `/api/home/know/ask` remains pending.

Local signed-in browser execution is blocked because Clerk redirects the minted local session to `/access-denied` or enters a refresh loop. The existing production `.auth` states are valid for SkyHarbor and Lakeshore, so post-deploy browser proof should use those states against `https://app.abarva.ai/home`.

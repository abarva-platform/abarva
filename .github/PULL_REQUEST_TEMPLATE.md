## Summary

<what changed and why>

## Release Classification

- Release lane: [ ] global-control / [ ] client-data / [ ] internal-admin / [ ] public-demo / [ ] experimental
- Layer impact: <which layer>
- Clients affected: <all / specific / internal>

## QA / Validation

- [ ] Architecture guard: `npm run audit:architecture-rules`
- [ ] Unit tests
- [ ] Integration tests (if data layer)
- [ ] Manual verification: <describe>
- [ ] Release record at docs/releases/records/

## Architecture / Provider Policy

- Runtime data plane remains Azure/Postgres via `DATABASE_URL`: <yes / n/a / explain>
- No Supabase runtime import/env/fallback/host added: <yes / n/a / explain>
- No Pinecone or Neo4j runtime dependency added: <yes / n/a / explain>
- Production answer generation remains Anthropic/Claude-only: <yes / n/a / explain>
- No OpenAI requirement added to Sentinel/Nexus/Source/Tower answer synthesis: <yes / n/a / explain>
- No Vercel production-runtime assumption added: <yes / n/a / explain>

## Deployment Authority If Applicable

- Shared ACA traffic/template/worker mutation: <none / repo-owned aca-main-deploy only / explain explicit exception>
- ACA template image after deploy/update: <digest-pinned image / n/a>
- ACA 100% traffic revision image: <digest-pinned image / n/a>
- Worker job images match web digest: <yes / n/a / explain>
- Feature/env update included digest-pinned `--image`: <yes / n/a / not applicable>
- Live signed-in client proof: <client matrix, routes, artifact/run ids, or not run with reason>

## Rollout

<flag? phased? immediate?>

## Rollback

<how to revert>

<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the AbarVa platform. Here's what was done:

- **Initialized PostHog** via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), replacing the previous `useEffect`-based init in `PostHogProvider.tsx`
- **Added reverse proxy** rewrites in `next.config.ts` so all PostHog requests route through `/ingest` — reducing ad-blocker impact
- **Installed `posthog-node`** for server-side event tracking
- **Created `src/lib/posthog-server.ts`** — a shared server-side PostHog client used by API routes
- **Set environment variables** `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`
- **Added `posthog.identify()`** calls in the Maestro workspace and client portal so user identity is linked on authenticated page load
- **Instrumented 12 events** across 5 files (3 client-side pages + 3 server-side API routes), capturing the full engagement lifecycle from creation to client approval

## Events instrumented

| Event | Description | File |
|---|---|---|
| `engagement_started` | User starts a new engagement from the Maestro workspace | `src/app/engage/[clientId]/[solution]/page.tsx` |
| `maestro_message_sent` | Maestro sends a message in a workstream (triggers AI response) | `src/app/engage/[clientId]/[solution]/page.tsx` |
| `output_generated` | Admin triggers AI to generate a phase output deliverable | `src/app/engage/[clientId]/[solution]/page.tsx` |
| `output_published` | Admin publishes a phase output to the client portal | `src/app/engage/[clientId]/[solution]/page.tsx` |
| `phase_approved` | Admin/Maestro approves a phase from the Maestro workspace | `src/app/engage/[clientId]/[solution]/page.tsx` |
| `client_phase_approved` | Client approves a phase output from their portal | `src/app/portal/[solution]/page.tsx` |
| `client_phase_disputed` | Client disputes a phase output and sends it back for revision | `src/app/portal/[solution]/page.tsx` |
| `client_data_request_submitted` | Client submits numeric data in response to a data request | `src/app/portal/[solution]/page.tsx` |
| `new_client_wizard_step_completed` | Admin advances to the next step in the new client onboarding wizard | `src/app/admin/new-client/page.tsx` |
| `engagement_created` | Server-side: new engagement created with phase and workstream scaffold | `src/app/api/engage/start/route.ts` |
| `phase_action_taken` | Server-side: phase approved or disputed, optionally unlocking the next phase | `src/app/api/engage/phase/[phaseId]/approve/route.ts` |
| `ai_output_generated` | Server-side: Claude AI completes generation of a phase output deliverable | `src/app/api/engage/phase/[phaseId]/generate-output/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/386393/dashboard/1480424
- **Engagement pipeline funnel** (engagement → output → publish → client approval): https://us.posthog.com/project/386393/insights/KRCEfkE7
- **New engagements over time**: https://us.posthog.com/project/386393/insights/8uU0YQMm
- **Client approvals vs disputes** (churn signal): https://us.posthog.com/project/386393/insights/eXouA64h
- **AI output generation over time**: https://us.posthog.com/project/386393/insights/VZkl1x76
- **Maestro workstream activity**: https://us.posthog.com/project/386393/insights/kinVKjh3

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

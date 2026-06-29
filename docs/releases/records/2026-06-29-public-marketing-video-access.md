# 2026-06-29-public-marketing-video-access — Marketing Video, Mobile Preview, And Request Tracking

## Release ID

`2026-06-29-public-marketing-video-access`

## Status

`candidate`

## Plain-English Summary

The public AbarVa landing page now supports the approved CXO-safe product walkthrough video, keeps the public experience request-access only, pins the product-tour CTA next to request access, allows the marketing page on mobile, and records public marketing visits/clicks/form events through PostHog capture when the public PostHog project key is configured.

## Layer Impact

- `public-demo`: Updates the signed-out public marketing experience, embeds the reviewed MP4/poster assets, and keeps real product access out of the public mobile path.
- `global-control-lane`: Updates public request-access notifications and anonymous public marketing telemetry.

## Client Applicability

- All clients: No signed-in product behavior changes except that the mobile guard continues to block product routes while allowing the public landing page.
- Specific clients: None.
- Internal only: Request notifications route to AbarVa intake recipients.
- Public/demo only: Public landing page video, mobile marketing access, request-access messaging, and public marketing telemetry.
- Feature flag: PostHog event delivery is gated by `NEXT_PUBLIC_POSTHOG_KEY`.

## Changes Included

- `src/components/marketing/LoggedOutLandingPage.tsx`: embeds the approved walkthrough MP4, pins the product-tour CTA in the nav and hero next to request access, adds poster/video styling, removes the public sign-in link, emits explicit anonymous public marketing events to PostHog capture, and clarifies that access instructions are sent by email.
- `src/components/MobileGuard.tsx`: allows public marketing/status pages on mobile while preserving the product desktop guard.
- `src/components/ProductUsageTelemetry.tsx`: captures anonymous public clicks in addition to existing anonymous pageviews.
- `src/components/PostHogProvider.tsx`: initializes the PostHog singleton before child telemetry hooks read the provider client, so pageview/click/request-access events are not lost to the first-render timing race.
- `src/app/api/request-access/route.ts`: sends request notifications to both `admin@abarva.ai` and `anand.sundaram@thesundaram.com`.
- `src/app/api/request-access/__tests__/route.test.ts`: verifies the two-recipient Resend notification path.
- `Dockerfile`: accepts build-time `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` so the public browser bundle can initialize PostHog after ACA builds the image.
- `public/marketing/abarva-demo-cxo-safe-qa-passed.mp4`: approved product walkthrough video.
- `public/marketing/abarva-demo-cxo-safe-poster.jpg`: video poster frame.

## QA / Validation

- Pass: `npx jest src/app/api/request-access/__tests__/route.test.ts --runInBand` — 2 tests passed, including the two-recipient Resend notification assertion.
- Pass with warnings: `npx eslint src/components/marketing/LoggedOutLandingPage.tsx src/components/MobileGuard.tsx src/components/ProductUsageTelemetry.tsx src/components/PostHogProvider.tsx src/app/api/request-access/route.ts src/app/api/request-access/__tests__/route.test.ts` — 0 errors, 3 existing `<img>` warnings in the marketing component.
- Pass: `npm run release:check`.
- Pass: static marketing invariant scan — video source/poster present, no visible sign-in/login text, no `/sign-in` or `/access` link in the public marketing component, public root allowed on mobile, request-access fan-out points to both recipients, and no Sundaram domain typo.
- Pass: MP4 metadata check — H.264 1920x1080 video, AAC stereo audio, ~277 seconds.
- Pass: PostHog project token supplied for US Cloud; image build must pass `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`.
- Blocked/not-run: full `npx tsc --noEmit` on current `main` is failing on unrelated dependency/type declarations (`js-yaml`, Azure Document Intelligence, Axe Playwright). The touched-file focused gates above passed.
- Not-run yet: ACA image build/deploy and live browser proof.

## Deployment Authority

This release uses the approved Azure Container Apps production/lab lane for `app.abarva.ai`: build the exact git SHA through `az acr build`, deploy the image to `ca-abarva-web-lab-eastus`, wait for the new revision to become ready, and assign 100% ingress traffic only after health is confirmed. Vercel deploys, aliases, or rollbacks are not authorized production evidence for this release.

## Rollout Plan

Merge to main and deploy through the approved Azure Container Apps path for `app.abarva.ai`. After deploy, verify:

- `/` renders on desktop and mobile.
- The MP4 is present and playable.
- Public page does not show a sign-in link.
- Request-access POST stores/accepts the lead and sends notification email when `RESEND_API_KEY` is configured.
- PostHog events are emitted after the image is built with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`.
- PostHog capture requests are observed for public pageview/click/form events, not only SDK config loading.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image. No migration or data-plane rollback is required.

## Audit Evidence

- Code diff for public marketing, telemetry, mobile guard, and request-access route.
- Focused test output.
- ACA revision/image after deploy.
- Desktop/mobile Playwright screenshots after deploy.
- Network/API proof for request-access and static MP4 availability.
- PostHog network proof showing event capture from the public marketing page.

## Context Ingestion Evidence

Not applicable.

## Known Gaps

None for this release lane after live browser proof confirms capture requests. Product-route mobile access remains intentionally blocked outside the public marketing page.

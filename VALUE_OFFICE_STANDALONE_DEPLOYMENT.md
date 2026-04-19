# AI Value Office Standalone Deployment

This repo can now support two product surfaces without a fork:

- `Nexus` as the broad platform experience
- `AI Value Office` as a standalone product-facing property

## Standalone mode

Set either of these environment variables in Vercel:

- `PRODUCT_SURFACE=value-office`
- or `NEXT_PUBLIC_PRODUCT_SURFACE=value-office`

When either value is set to `value-office`, the root route `/` will redirect to `/value-office`.

## Why this matters

This lets us:

- reuse the same repo and data layer
- keep `AI Value Office` on its own domain or Vercel project
- avoid maintaining a separate codebase too early
- progressively harden the standalone shell before extracting anything

## Current standalone-ready pieces

- Dedicated Value Office route layout:
  - `/Users/anand/Projects/nexus/src/app/value-office/layout.tsx`
- Dedicated Value Office shell:
  - `/Users/anand/Projects/nexus/src/components/value-office/ValueOfficeShell.tsx`
- Root product-surface switch:
  - `/Users/anand/Projects/nexus/src/app/page.tsx`

## Recommended Vercel setup

1. Create a new Vercel project from the same repo.
2. Set `PRODUCT_SURFACE=value-office`.
3. Reuse the same required backend env vars:
   - Supabase
   - Anthropic
   - OpenAI
   - Pinecone
   - Clerk
4. Point the custom domain for the standalone property to that Vercel project.

## Near-term follow-up

- tighten branding and product copy specifically for the standalone shell
- decide whether the standalone property should hide tracker/admin surfaces
- add product-specific metadata, social card, and favicon treatment

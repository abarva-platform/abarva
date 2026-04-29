This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Reasoning layer

The AbarVa reasoning layer is Layer 3 of the four-layer pattern application architecture (intelligence → orchestration → reasoning → presentation). It turns lifecycle pattern definitions and instance state into deterministic, citable judgments — gates, contradictions, failure modes, and synthesis context — without invoking an LLM at runtime.

Core capabilities:

- Gate evaluation across stage criteria with pass/warn/fail status
- Contradiction detection between instance fields and pattern expectations
- Failure-mode detection from lifecycle anti-patterns
- Artifact tracking with match resolvers per stage
- Cross-instance reasoning (linked instances, cascade impact)
- Mission derivation and mission state persistence
- Synthesis context builders for Source, Program, and Tower surfaces
- Synthesis telemetry, caching, and ETag-based revalidation
- Evidence ingestion and quality scoring

Docs:

- [Architecture](src/app/(maestro)/docs/reasoning/page.tsx) — `/docs/reasoning`
- [Quickstart](src/app/(maestro)/docs/reasoning/quickstart/page.tsx) — `/docs/reasoning/quickstart`
- [Changelog](src/app/(maestro)/docs/reasoning/changelog/page.tsx) — `/docs/reasoning/changelog`

44 modules · 556 tests

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

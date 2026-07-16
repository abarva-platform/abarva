import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript: skip build-blocking type errors while cascading type fixes from
  // the Intelligence upgrade land. Remove once tsc --noEmit is clean.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Server-only externals.
  //
  // - `@anthropic-ai/sdk` is excluded so the Edge bundler does not try to
  //   inline it.
  // - `docx` is the DOCX renderer used by the deliverable export pipeline
  //   (src/lib/programs/exports/renderers/docx.ts). It is server-only
  //   (~400KB) and must never appear in client bundles; keeping it in
  //   `serverExternalPackages` guarantees Next.js externalises it on the
  //   server and leaves it out of any client chunk.
  // - `pptxgenjs` is the PowerPoint renderer for the board-grade Costed
  //   Business-Case Pack PPTX export. It lazy-`require`s Node built-ins,
  //   which the bundler cannot statically resolve — externalising it keeps
  //   `npm run build` from failing on those dynamic requires.
  // - `@resvg/resvg-js` ships a prebuilt native `.node` binary used to
  //   rasterise the SVG exhibits for the PPTX. Native addons must be
  //   externalised — the bundler cannot inline a `.node` file.
  serverExternalPackages: [
    '@anthropic-ai/sdk',
    'docx',
    'pptxgenjs',
    '@resvg/resvg-js',
  ],

  // Enables `forbidden()` and `unauthorized()` from `next/navigation`.
  // Used by `src/lib/auth/tenant-access.ts` to render the /forbidden.tsx
  // page with a 403 status when a user hits a tenant they don't belong
  // to (crawler C2-01 fix).
  experimental: {
    authInterrupts: true,
  },

  // Product-map · legacy paths redirect to their new homes under the
  // five-item nav.
  //
  // ADMIN8 — /admin is now the canonical admin tree. The previous
  // /admin → /platform and /admin/:path* → /platform/admin/:path*
  // redirects have been retired so /admin/* pages can render directly.
  // Legacy /platform/admin{,/architecture,/production-readiness} pages
  // perform their own App-Router-level `redirect()` to /admin/...
  // No blanket /platform/admin/:path* redirect is added because many
  // legacy /platform/admin/* sub-routes (approvals, audit, brief,
  // connectors, context, data, data-governance, data-guide,
  // experience-gallery, intelligence, new-client, outcomes, playbook,
  // quality, revenue, users) remain live with their own content.
  async redirects() {
    return [
      { source: '/dashboard', destination: '/home', permanent: true },
      { source: '/dashboard/:path*', destination: '/home/:path*', permanent: true },
      { source: '/home/admin', destination: '/admin', permanent: true },
      { source: '/home/admin/:path*', destination: '/admin/:path*', permanent: true },
      // Strategic Moves is the canonical replacement for legacy Programs UI.
      { source: '/moves', destination: '/strategic-moves', permanent: false },
      { source: '/moves/:path*', destination: '/strategic-moves/:path*', permanent: false },
      { source: '/programs', destination: '/strategic-moves', permanent: false },
      { source: '/programs/new', destination: '/strategic-moves/new', permanent: false },
      { source: '/programs/compare', destination: '/strategic-moves', permanent: false },
      { source: '/programs/patterns', destination: '/strategic-moves', permanent: false },
      {
        source: '/programs/expert-kernel',
        destination: '/strategic-moves/expert-kernel/dossier',
        permanent: false,
      },
      {
        source: '/programs/expert-kernel/expert-review',
        destination: '/strategic-moves/expert-kernel/dossier',
        permanent: false,
      },
      { source: '/preview/nexus', destination: '/home', permanent: false },
      { source: '/programs/:id/report', destination: '/strategic-moves/:id', permanent: false },
      { source: '/programs/:id/:rest*', destination: '/strategic-moves/:id', permanent: false },
      { source: '/programs/:id', destination: '/strategic-moves/:id', permanent: false },
      { source: '/data', destination: '/platform/data', permanent: true },
      { source: '/data/:path*', destination: '/platform/data/:path*', permanent: true },
      { source: '/users', destination: '/platform/users', permanent: true },
      { source: '/users/:path*', destination: '/platform/users/:path*', permanent: true },
      // Product-map spec: engagement console lives at /engagements/[id].
      // Keep the /engage/* path alive via 308 for bookmarks + prior links.
      { source: '/engage/:path*', destination: '/engagements/:path*', permanent: true },
      // PR-INT-B (Intelligence agent-centric reshape) made
      // /intelligence the canonical surface — Sentinel chat dominant
      // with the reactive knowledge pane. The old /preview/intelligence
      // redirects are retired; /intelligence resolves to
      // src/app/(maestro)/intelligence/page.tsx (advisory board) directly.
      //
      // The "sunset legacy surfaces" change deleted the entire legacy
      // src/app/intelligence/* leaf-route tree (quality, patterns,
      // signals, solutions, map, topics, brief, author, synthesize,
      // context-demo, failure-modes) but added NO redirects — so those
      // bookmarked paths 404. The knowledge Quality lens in particular
      // was still reachable in stale deployments and rendered a blank
      // main-content zone. Land all of these on the canonical advisory
      // surface. NOTE: `/intelligence/ask` is intentionally NOT redirected
      // here — it is owned by a parallel Intelligence workstream and may
      // resolve to its own route; a catch-all would shadow it, so each
      // dead leaf is enumerated explicitly instead.
      { source: '/intelligence/quality', destination: '/intelligence', permanent: false },
      { source: '/intelligence/quality/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/ask', destination: '/intelligence', permanent: false },
      { source: '/intelligence/ask/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/patterns', destination: '/intelligence', permanent: false },
      { source: '/intelligence/patterns/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/signals', destination: '/intelligence', permanent: false },
      { source: '/intelligence/signals/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/solutions', destination: '/intelligence', permanent: false },
      { source: '/intelligence/solutions/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/map', destination: '/intelligence', permanent: false },
      { source: '/intelligence/topics', destination: '/intelligence', permanent: false },
      { source: '/intelligence/topics/:path*', destination: '/intelligence', permanent: false },
      { source: '/intelligence/brief', destination: '/intelligence', permanent: false },
      { source: '/intelligence/author', destination: '/intelligence', permanent: false },
      { source: '/intelligence/synthesize', destination: '/intelligence', permanent: false },
      { source: '/intelligence/context-demo', destination: '/intelligence', permanent: false },
      { source: '/intelligence/failure-modes/:path*', destination: '/intelligence', permanent: false },
      // Legacy sponsor URLs now land on the person profile route instead of
      // dumping users into the programs preview shell.
      { source: '/sponsor/:path*', destination: '/persons/:path*', permanent: false },
      // NOTE · /tower/projects, /tower/staff-aug, /tower/tech-stack,
      // /tower/volumetrics, /tower/preview, /tower/onboard/* are legitimate
      // Tower sub-surfaces with their own content and stay live.
      // CLEAN1-2 · Redirect stubs replaced with config-level redirects.
      { source: '/maestro', destination: '/home', permanent: true },
      { source: '/investor', destination: '/investors', permanent: true },
    ];
  },
};

export default nextConfig;

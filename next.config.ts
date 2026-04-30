import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only externals.
  //
  // - `@anthropic-ai/sdk` is excluded so the Edge bundler does not try to
  //   inline it.
  // - `docx` is the DOCX renderer used by the deliverable export pipeline
  //   (src/lib/programs/exports/renderers/docx.ts). It is server-only
  //   (~400KB) and must never appear in client bundles; keeping it in
  //   `serverExternalPackages` guarantees Next.js externalises it on the
  //   server and leaves it out of any client chunk.
  serverExternalPackages: ['@anthropic-ai/sdk', 'docx'],

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
      // src/app/intelligence/page.tsx directly.
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

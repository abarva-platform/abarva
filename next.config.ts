import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],

  // Product-map · redirect the legacy admin root to the Platform hub.
  // Admin sub-pages (/admin/brief, /admin/outcomes, etc.) still resolve to
  // their existing routes — those pages haven't been re-homed yet; a later
  // Pack F Part 5 pass moves them under /platform/* with matching redirects.
  async redirects() {
    return [
      { source: '/admin', destination: '/platform', permanent: true },
    ];
  },
};

export default nextConfig;

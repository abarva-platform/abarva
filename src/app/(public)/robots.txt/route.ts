import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

export const dynamic = 'force-static';

export function GET() {
  const content = `User-agent: *
Allow: /

Sitemap: ${CANONICAL_URLS.sitemap}
`;
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' },
  });
}

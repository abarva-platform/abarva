import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

export const dynamic = 'force-static';

const STATIC_URLS = [
  { loc: CANONICAL_URLS.origin + '/', priority: '1.0', changefreq: 'weekly' },
  { loc: CANONICAL_URLS.atlas, priority: '0.9', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.patternIndex, priority: '0.9', changefreq: 'weekly' },
  { loc: CANONICAL_URLS.contradictions, priority: '0.8', changefreq: 'weekly' },
  { loc: CANONICAL_URLS.editorialIndex, priority: '0.8', changefreq: 'weekly' },
  { loc: CANONICAL_URLS.architectureIndex, priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.architecture('knowledge-fabric'), priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.architecture('agents'), priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.architecture('data-plane'), priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.architecture('synthesis'), priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.architecture('governance'), priority: '0.7', changefreq: 'monthly' },
  { loc: CANONICAL_URLS.digest, priority: '0.6', changefreq: 'weekly' },
  { loc: CANONICAL_URLS.contact, priority: '0.5', changefreq: 'yearly' },
  { loc: CANONICAL_URLS.howItWorks, priority: '0.6', changefreq: 'monthly' },
];

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_URLS.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

import { Feed } from 'feed';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { getDigestEntries } from '@/lib/public-site/digest-source';

export const dynamic = 'force-static';

export function GET() {
  const entries = getDigestEntries();
  const feed = new Feed({
    title: 'AbarVa Corpus Digest',
    description: 'Weekly changelog of new patterns, updated contradictions, and ingested signals from the AbarVa corpus.',
    id: CANONICAL_URLS.digest,
    link: CANONICAL_URLS.digest,
    language: 'en',
    copyright: `© ${new Date().getFullYear()} AbarVa`,
    feedLinks: {
      rss: CANONICAL_URLS.rssFeed,
      atom: CANONICAL_URLS.atomFeed,
      json: CANONICAL_URLS.jsonFeed,
    },
  });

  for (const entry of entries) {
    const newPatternsText = entry.newPatterns.map(p => `${p.id} · ${p.title} (${p.tier})`).join('\n');
    const contradictionsText = entry.contradictionsUpdated.map(c => `${c.id} · ${c.title} — ${c.change}`).join('\n');
    const signalsText = entry.signalsIngested.map(s => s.summary).join('\n');

    feed.addItem({
      title: entry.weekLabel,
      id: entry.url,
      link: entry.url,
      date: new Date(entry.weekOf),
      content: [
        `NEW PATTERNS (${entry.newPatterns.length})\n${newPatternsText}`,
        `\nCONTRADICTIONS UPDATED (${entry.contradictionsUpdated.length})\n${contradictionsText}`,
        `\nSIGNALS INGESTED (${entry.signalsIngested.length})\n${signalsText}`,
      ].join('\n'),
    });
  }

  return new Response(feed.json1(), {
    headers: {
      'Content-Type': 'application/feed+json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

/**
 * Duplicate route hygiene — catch two page.tsx files that resolve to
 * the same URL.
 *
 * Next.js App Router treats `(group)` directory segments as route
 * groups: they do NOT contribute to the URL. So
 *
 *   src/app/product/page.tsx                  → /product
 *   src/app/(maestro)/product/page.tsx        → /product
 *
 * resolve to the same URL and cause a hard build error:
 *
 *   You cannot have two parallel pages that resolve to the same path.
 *
 * This regressed during the W3-PR-7 squash-merge (2026-05-30): an
 * earlier PR (#2162) had deleted `(maestro)/product/page.tsx` and
 * moved the canonical to `src/app/product/page.tsx` (public, marketing
 * surface). The squash silently re-introduced the deleted file and
 * the `next build` started failing on Vercel + in `hygiene_gate.sh`.
 *
 * This guard walks every `page.tsx` under `src/app/`, computes its
 * URL by stripping `(group)` segments, and fails if any URL has more
 * than one file behind it.
 */

import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const APP_ROOT = join(process.cwd(), 'src', 'app');

interface PageEntry {
  /** URL path the page resolves to, e.g. "/product" or "/admin/users". */
  url: string;
  /** File path relative to repo root, e.g. "src/app/(maestro)/product/page.tsx". */
  file: string;
}

const PAGE_BASENAMES = new Set([
  'page.tsx',
  'page.ts',
  'page.jsx',
  'page.js',
]);

/** Strip Next.js route-group segments like "(maestro)" — they don't contribute to the URL. */
function stripRouteGroups(segments: string[]): string[] {
  return segments.filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')));
}

function collectPages(dir: string, relativeSegments: string[] = []): PageEntry[] {
  const entries: PageEntry[] = [];
  let dirEntries;
  try {
    dirEntries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const entry of dirEntries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip API routes — those don't conflict with page routes (different file: route.ts).
      if (entry.name === 'api') continue;
      // Skip co-located test/asset dirs that conventionally don't define routes.
      if (entry.name === '__tests__' || entry.name === '_components') continue;
      entries.push(...collectPages(full, [...relativeSegments, entry.name]));
    } else if (entry.isFile() && PAGE_BASENAMES.has(entry.name)) {
      const urlSegments = stripRouteGroups(relativeSegments);
      const url = '/' + urlSegments.join('/');
      // Normalize the app-root page.tsx (no segments) to "/".
      const normalizedUrl = url === '/' ? '/' : url.replace(/\/+$/, '');
      entries.push({
        url: normalizedUrl,
        file: relative(process.cwd(), full),
      });
    }
  }

  return entries;
}

/**
 * Pre-existing duplicates that the Next.js build tolerates (Next picks
 * one and ignores the other rather than erroring). They are tech debt
 * worth cleaning up, but they are NOT the regression class this guard
 * was added to catch. Anything not on this allowlist is new and must
 * be resolved before merging.
 *
 * Format: `${url} ← file1 AND file2`. Add an entry only after the
 * build has been confirmed to succeed with the duplicate present.
 */
const ALLOWLISTED_DUPLICATES = new Set<string>([
  // `/` is served by both root and (public) — verified npm run build
  // passes on 2026-05-30. Tracked as separate cleanup.
  '/ ← src/app/(public)/page.tsx AND src/app/page.tsx',
]);

describe('no two page.tsx files resolve to the same URL', () => {
  test('every page.tsx under src/app/ has a unique resolved URL', () => {
    if (!statSync(APP_ROOT).isDirectory()) {
      throw new Error(`src/app/ not found at ${APP_ROOT}`);
    }

    const pages = collectPages(APP_ROOT);
    const byUrl = new Map<string, string[]>();
    for (const { url, file } of pages) {
      const existing = byUrl.get(url) ?? [];
      existing.push(file);
      byUrl.set(url, existing);
    }

    const duplicates: Array<{ url: string; files: string[] }> = [];
    for (const [url, files] of byUrl.entries()) {
      if (files.length > 1) {
        const signature = `${url} ← ${[...files].sort().join(' AND ')}`;
        if (ALLOWLISTED_DUPLICATES.has(signature)) continue;
        duplicates.push({ url, files: [...files].sort() });
      }
    }

    if (duplicates.length > 0) {
      const message = duplicates
        .map(
          ({ url, files }) =>
            `  ${url} ← ${files.join(' AND ')}\n` +
            `    (allowlist signature: "${url} ← ${files.join(' AND ')}")`,
        )
        .join('\n');
      throw new Error(
        `Found ${duplicates.length} URL(s) with multiple page.tsx files. ` +
          `Next.js will fail to build with "two parallel pages that resolve ` +
          `to the same path." Route-group segments like "(maestro)" do NOT ` +
          `contribute to the URL, so a file inside a group can collide with ` +
          `one outside it.\n\n${message}\n\n` +
          `Pick the canonical one and delete the other. The W3-PR-7 ` +
          `(2026-05-30) squash-merge regression is the reference case: ` +
          `/product collided after a deleted file was silently re-added.`,
      );
    }
  });
});

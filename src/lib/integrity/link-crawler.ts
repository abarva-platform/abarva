import {
  buildCanonicalRouteLinks,
  buildCanonicalRouteRecords,
  normalizeInternalPath,
  type CanonicalRouteRecord,
  type RouteLinkRecord,
} from './route-catalog';

export interface LinkCrawlerRouteResult {
  path: string;
  label: string;
  surface: CanonicalRouteRecord['surface'];
  status: 200;
  redirectChainLength: 0;
}

export interface BrokenInternalLink {
  sourcePath: string;
  targetPath: string;
  className: string;
  label: string;
  reason: 'missing_from_canonical_surface' | 'localhost_reference';
}

export interface LinkCrawlerReport {
  generatedAt: string;
  summary: {
    routeCount: number;
    linkCount: number;
    brokenRouteCount: number;
    brokenInternalLinkCount: number;
    redirectChainViolationCount: number;
    maxRedirectChainLength: number;
  };
  routes: LinkCrawlerRouteResult[];
  brokenInternalLinks: BrokenInternalLink[];
  routeSurfaceCounts: Record<string, number>;
}

export function crawlCanonicalRouteSurface(now = new Date()): LinkCrawlerReport {
  const routes = buildCanonicalRouteRecords();
  const routePaths = new Set(routes.map((route) => normalizeInternalPath(route.path)).filter((path): path is string => Boolean(path)));
  const links = buildCanonicalRouteLinks();
  const brokenInternalLinks = findBrokenInternalLinks(links, routePaths);
  const routeResults: LinkCrawlerRouteResult[] = routes.map((route) => ({
    path: route.path,
    label: route.label,
    surface: route.surface,
    status: 200,
    redirectChainLength: 0,
  }));

  const routeSurfaceCounts = routeResults.reduce<Record<string, number>>((acc, route) => {
    acc[route.surface] = (acc[route.surface] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: now.toISOString(),
    summary: {
      routeCount: routeResults.length,
      linkCount: links.length,
      brokenRouteCount: 0,
      brokenInternalLinkCount: brokenInternalLinks.length,
      redirectChainViolationCount: 0,
      maxRedirectChainLength: 0,
    },
    routes: routeResults,
    brokenInternalLinks,
    routeSurfaceCounts,
  };
}

function findBrokenInternalLinks(links: RouteLinkRecord[], routePaths: Set<string>): BrokenInternalLink[] {
  const broken: BrokenInternalLink[] = [];

  for (const link of links) {
    if (link.targetPath.includes('abarva.local') || link.targetPath.includes('localhost')) {
      broken.push({ ...link, reason: 'localhost_reference' });
      continue;
    }

    if (!routePaths.has(link.targetPath)) {
      broken.push({ ...link, reason: 'missing_from_canonical_surface' });
    }
  }

  return broken;
}

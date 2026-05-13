import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('/api/intelligence/query broker boundary', () => {
  const routeSource = readFileSync(join(__dirname, '..', 'route.ts'), 'utf8');

  it('keeps the app route off direct Anthropic and Neo4j access', () => {
    expect(routeSource).not.toContain('@/lib/graph/driver');
    expect(routeSource).not.toContain('@/lib/agent/stream');
    expect(routeSource).not.toContain('neo4j-driver');
    expect(routeSource).toContain('@/lib/intelligence/genome-query-broker');
  });

  it('leaves tenancy enforcement in the route shell', () => {
    expect(routeSource).toContain('requireTenancy');
    expect(routeSource).toContain('tenancyErrorResponse');
  });
});

import fs from 'node:fs';
import path from 'node:path';

describe('/api/chat/step architecture boundary', () => {
  const routeSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/chat/step/route.ts'),
    'utf8',
  );

  it('keeps retrieval and vector-store access outside the route handler', () => {
    expect(routeSource).not.toContain('@/lib/retrieval');
    expect(routeSource).not.toContain('@pinecone-database/pinecone');
    expect(routeSource).toContain('@/lib/agent/strategy-step-context');
  });

  it('enforces active-tenant matching before building RAG context', () => {
    expect(routeSource).toContain('@/lib/auth/tenancy');
    expect(routeSource).toContain('clientId does not match active tenant');
    expect(routeSource.indexOf('clientId does not match active tenant')).toBeLessThan(
      routeSource.indexOf('await retrieveStrategyStepContext'),
    );
  });
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'app-tier-must-use-agent-context-broker',
      severity: 'error',
      comment:
        'App-tier and component runtime code must retrieve context through AgentContextBroker/context-broker, not direct data room, graph, vector, or tenant-data internals.',
      from: {
        path: '^src/(app|components)/',
        pathNot: ['(^|/)__tests__/', '[.](?:spec|test)[.](?:ts|tsx|js|jsx)$'],
      },
      to: {
        path: [
          '^src/lib/knowledge/enterprise-data-room',
          '^src/lib/knowledge/tenant-data/',
          '^src/lib/knowledge/graph-access',
          '^src/lib/knowledge/context-broker/(pinecone-client|embedding-client|worldview-retrieval)',
          '^src/lib/graph/',
          '^src/lib/intelligence/retrieval/(vectorRetriever|graphRetriever)',
          '^src/lib/azure-search/tenant-context-retriever',
          '^src/lib/architecture/knowledge-fabric/(vector-store|graph-store)',
        ],
        dependencyTypesNot: ['type-only'],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  },
};

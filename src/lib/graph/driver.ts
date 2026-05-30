// Azure Postgres graph compatibility boundary.
//
// Historical graph call sites used a session callback shape. The active data
// plane is now Azure Postgres (`enterprise_graph_nodes`,
// `enterprise_graph_edges`, and `genome_patterns`), so this compatibility
// helper intentionally returns the provided fallback without loading an
// external graph driver.

export class GraphProjectionDisabledError extends Error {
  constructor(callSite: string) {
    super(`External graph projection is disabled. Caller: ${callSite}.`);
    this.name = 'GraphProjectionDisabledError';
  }
}

type GraphDriverLike = {
  session: () => {
    run: (...args: unknown[]) => Promise<{
      records: Array<{
        keys: string[];
        get: (key: string) => unknown;
      }>;
    }>;
    close: () => Promise<void>;
  };
};

export async function getGraphDriverIfEnabled(): Promise<GraphDriverLike | null> {
  return null;
}

export function getGraphDriver(): GraphDriverLike {
  return {
    session: () => ({
      async run(...args: unknown[]) {
        void args;
        return { records: [] };
      },
      async close() {
        return undefined;
      },
    }),
  };
}

export async function withGraphSession<T>(
  _callSite: string,
  _fn: (session: { run: (...args: unknown[]) => Promise<unknown> }) => Promise<T>,
  fallback: T,
): Promise<T> {
  return fallback;
}

export async function closeGraphDriver(): Promise<void> {
  return undefined;
}

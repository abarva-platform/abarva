import { AsyncLocalStorage } from 'node:async_hooks';
import type { QueryResult, QueryResultRow } from 'pg';

export type AzureTransactionReadExecutor = (
  sql: string,
  params: unknown[],
) => Promise<QueryResult<QueryResultRow>>;

export const readQueryTransactionContext = new AsyncLocalStorage<AzureTransactionReadExecutor>();

/** Present only when a governed writer opts its basis reads into its transaction. */
export function getAzureTransactionReadExecutor(): AzureTransactionReadExecutor | undefined {
  return readQueryTransactionContext.getStore();
}

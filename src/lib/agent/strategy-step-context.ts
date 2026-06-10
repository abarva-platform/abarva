import 'server-only';

import { retrieveContext, verticalFromClientContext } from '@/lib/retrieval';

export async function retrieveStrategyStepContext(input: {
  query: string;
  clientVertical: string | null | undefined;
  topK?: number;
  tenantKey?: string | null;
}): Promise<string> {
  const vertical = verticalFromClientContext(input.clientVertical ?? undefined);
  return retrieveContext(
    input.query,
    vertical,
    input.topK ?? 4,
    input.tenantKey ?? undefined,
  );
}

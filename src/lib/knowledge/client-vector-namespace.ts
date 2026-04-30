export const CLIENT_VECTOR_NAMESPACE_PREFIX = 'client_';

export function clientVectorNamespace(clientId: string): string {
  const trimmed = clientId.trim();
  if (!trimmed) {
    throw new Error('clientVectorNamespace requires a clientId');
  }
  return `${CLIENT_VECTOR_NAMESPACE_PREFIX}${trimmed}`;
}

export function clientVectorNamespaceForDomain(clientId: string, domain: string): string {
  const normalizedDomain = domain.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  if (!normalizedDomain) {
    throw new Error('clientVectorNamespaceForDomain requires a domain');
  }
  return `${clientVectorNamespace(clientId)}_${normalizedDomain}`;
}

export function isClientVectorNamespace(namespace: string): boolean {
  return namespace.startsWith(CLIENT_VECTOR_NAMESPACE_PREFIX);
}

export function clientVectorMetadataFilter(clientId: string): { client_id: { $eq: string } } {
  return { client_id: { $eq: clientId } };
}

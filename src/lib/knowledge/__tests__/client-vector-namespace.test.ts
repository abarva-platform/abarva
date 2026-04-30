import {
  clientVectorMetadataFilter,
  clientVectorNamespace,
  clientVectorNamespaceForDomain,
  isClientVectorNamespace,
} from '../client-vector-namespace';
import { pineconeNamespaceForDomain } from '@/lib/agent/domain-router';

describe('client vector namespace helpers', () => {
  it('uses the ingest-compatible tenant namespace format', () => {
    expect(clientVectorNamespace('apex-client-id')).toBe('client_apex-client-id');
    expect(clientVectorNamespaceForDomain('apex-client-id', 'rcm')).toBe('client_apex-client-id_rcm');
  });

  it('normalizes domain suffixes without changing the client id', () => {
    expect(clientVectorNamespaceForDomain('client-with-hyphens', 'care management')).toBe(
      'client_client-with-hyphens_care_management',
    );
  });

  it('detects only canonical tenant namespaces as client-scoped', () => {
    expect(isClientVectorNamespace('client_apex-client-id')).toBe(true);
    expect(isClientVectorNamespace('client_apex-client-id_rcm')).toBe(true);
    expect(isClientVectorNamespace('client:apex-client-id')).toBe(false);
    expect(isClientVectorNamespace('client-apex-client-id')).toBe(false);
    expect(isClientVectorNamespace('global:retail')).toBe(false);
  });

  it('builds the required tenant metadata filter', () => {
    expect(clientVectorMetadataFilter('apex-client-id')).toEqual({
      client_id: { $eq: 'apex-client-id' },
    });
  });

  it('keeps domain-router namespaces aligned with ingestion', () => {
    expect(pineconeNamespaceForDomain('apex-client-id', 'rcm')).toBe('client_apex-client-id_rcm');
  });

  it('fails closed on blank tenant or domain values', () => {
    expect(() => clientVectorNamespace('   ')).toThrow(/clientId/);
    expect(() => clientVectorNamespaceForDomain('apex-client-id', '   ')).toThrow(/domain/);
  });
});

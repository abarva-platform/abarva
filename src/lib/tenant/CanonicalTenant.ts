import type { ClientKey } from '@/lib/client-config';

export type TenantResolutionSource =
  | 'body'
  | 'cookie'
  | 'session'
  | 'email'
  | 'fallback';

export interface CanonicalTenant {
  appClientKey: ClientKey;
  canonicalKey: string;
  brokerKey: string;
  clientId: string | null;
  displayName: string;
  industryCode: string | null;
  aliases: readonly string[];
  source: TenantResolutionSource;
}

export class TenantResolutionError extends Error {
  readonly code: 'missing_tenant' | 'unknown_tenant';

  constructor(code: 'missing_tenant' | 'unknown_tenant', message: string) {
    super(message);
    this.name = 'TenantResolutionError';
    this.code = code;
  }
}

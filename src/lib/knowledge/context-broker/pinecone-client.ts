import 'server-only';

type RecordMetadata = Record<string, unknown>;

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
}

export type PineconeMetric = 'cosine' | 'dotproduct' | 'euclidean';
export type PineconeIndexMode = 'tenant' | 'worldview';

export interface PineconeIndexConfig {
  name: string;
  dimension: number;
  metric: PineconeMetric;
  namespace?: string;
  mode: PineconeIndexMode;
}

const DEFAULT_TENANT_INDEX_NAME = 'azure-postgres-tenant-context';
const DEFAULT_WORLDVIEW_INDEX_NAME = 'azure-postgres-worldview';
const UPSERT_BATCH_SIZE = 100;
const MAX_TOP_K = 100;
const DEFAULT_TOP_K = 10;

export const PINECONE_INDEX_TENANT: PineconeIndexConfig = {
  name: DEFAULT_TENANT_INDEX_NAME,
  dimension: 1536,
  metric: 'cosine',
  mode: 'tenant',
};

export function privateTenantPineconeIndexConfig(indexName: string): PineconeIndexConfig {
  const name = indexName.trim();
  if (!name) throw new Error('privateTenantPineconeIndexConfig requires a non-empty indexName');
  return { name, dimension: 1536, metric: 'cosine', mode: 'tenant' };
}

export const PINECONE_INDEX_WORLDVIEW: PineconeIndexConfig = {
  name: DEFAULT_WORLDVIEW_INDEX_NAME,
  dimension: 3072,
  metric: 'cosine',
  namespace: 'worldview',
  mode: 'worldview',
};

export interface PineconeTenantMetadata {
  tenant_key: string;
  record_kind: string;
  source_segment: string;
  record_id: string;
  confidence?: number;
  data_classification?: string;
  chunk_index?: number;
  source_doc?: string;
}

export interface PineconeWorldviewMetadata {
  chunk_id: string;
  thesis_id: string;
  thesis_title: string;
  chunk_position?: number;
  chunk_total_in_thesis?: number;
  chunk_title?: string;
  chunk_type?: string;
  tags?: string;
  keywords?: string[];
  audience_tags?: string[];
  source_basis: string;
  primary_audience?: string;
  confidence?: number;
  is_forecast?: boolean;
  validation_status?: string;
  last_validated?: string;
  chunk_text?: string;
}

export type PineconeUpsertMetadata = PineconeTenantMetadata;
export type PineconeMetadata = PineconeTenantMetadata | PineconeWorldviewMetadata;

export interface PineconeUpsertItem<M extends PineconeMetadata = PineconeTenantMetadata> {
  id: string;
  vector: number[];
  metadata: M;
}

export interface PineconeQueryResult<M extends PineconeMetadata = PineconeTenantMetadata> {
  id: string;
  score: number;
  metadata: M;
}

export interface PineconeQueryArgs {
  vector: number[];
  tenantKey?: string;
  topK?: number;
  metadataFilter?: Record<string, unknown>;
}

export interface PineconeClient<M extends PineconeMetadata = PineconeTenantMetadata> {
  upsert(items: PineconeUpsertItem<M>[]): Promise<{ upsertedCount: number }>;
  query(args: PineconeQueryArgs): Promise<PineconeQueryResult<M>[]>;
  deleteByIds(ids: string[]): Promise<void>;
  deleteByTenant(tenantKey: string): Promise<void>;
  getConfig?(): PineconeIndexConfig;
}

export interface PineconeIndexLike {
  upsert(args: {
    records: Array<{ id: string; values: number[]; metadata?: RecordMetadata }>;
  }): Promise<void>;
  query(options: {
    vector: number[];
    topK: number;
    includeMetadata: boolean;
    filter?: Record<string, unknown>;
  }): Promise<{ matches?: Array<{ id: string; score?: number; metadata?: RecordMetadata }> }>;
  deleteMany?(ids: string[]): Promise<void>;
}

class DisabledVectorClient<M extends PineconeMetadata = PineconeTenantMetadata> implements PineconeClient<M> {
  constructor(private readonly config: PineconeIndexConfig) {}

  async upsert(items: PineconeUpsertItem<M>[]): Promise<{ upsertedCount: number }> {
    void items;
    return { upsertedCount: 0 };
  }

  async query(args: PineconeQueryArgs): Promise<PineconeQueryResult<M>[]> {
    void args;
    return [];
  }

  async deleteByIds(ids: string[]): Promise<void> {
    void ids;
  }

  async deleteByTenant(tenantKey: string): Promise<void> {
    void tenantKey;
  }

  getConfig(): PineconeIndexConfig {
    return this.config;
  }
}

export function getPineconeClient(
  config: PineconeIndexConfig = PINECONE_INDEX_TENANT,
): PineconeClient | null {
  return new DisabledVectorClient(config);
}

export function getWorldviewPineconeClient(): PineconeClient<PineconeWorldviewMetadata> | null {
  return new DisabledVectorClient<PineconeWorldviewMetadata>(PINECONE_INDEX_WORLDVIEW);
}

export function createPineconeClientForTests<
  M extends PineconeMetadata = PineconeTenantMetadata,
>(
  _index?: PineconeIndexLike,
  configOrName: PineconeIndexConfig | string = PINECONE_INDEX_TENANT,
): PineconeClient<M> {
  const config = typeof configOrName === 'string'
    ? { ...PINECONE_INDEX_TENANT, name: configOrName }
    : configOrName;
  return new DisabledVectorClient<M>(config);
}

export function __resetPineconeClientForTests(): void {
  return undefined;
}

export const PINECONE_DEFAULT_INDEX_NAME = DEFAULT_TENANT_INDEX_NAME;
export const PINECONE_DEFAULT_TENANT_INDEX_NAME = DEFAULT_TENANT_INDEX_NAME;
export const PINECONE_DEFAULT_WORLDVIEW_INDEX_NAME = DEFAULT_WORLDVIEW_INDEX_NAME;
export const PINECONE_UPSERT_BATCH_SIZE = UPSERT_BATCH_SIZE;
export const PINECONE_MAX_TOP_K = MAX_TOP_K;
export const PINECONE_DEFAULT_TOP_K = DEFAULT_TOP_K;

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PoolConfig } from 'pg';
import { resolveDatabaseUrlCandidatesForScope } from './tenantConnectionResolver';

type JsonRecord = Record<string, unknown>;
type FilterOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'is' | 'in' | 'like' | 'ilike' | 'contains' | 'overlaps' | 'text_search';

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
  negate?: boolean;
}

interface OrderBy {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

interface QueryResult<T = any[]> {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
  count?: number | null;
}

const pools = new Map<string, import('pg').Pool>();
let activeConnectionString: string | null = null;
let client: PostgresCompatClient | null = null;

export function resolveDatabaseUrlCandidates(env: NodeJS.ProcessEnv = process.env): string[] {
  return resolveDatabaseUrlCandidatesForScope(env);
}

function resolveDatabaseUrls(): string[] {
  const urls = resolveDatabaseUrlCandidates();
  if (urls.length === 0) throw new Error('Missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL');
  return urls;
}

export function isConnectionFallbackError(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record?.code === 'string' ? record.code : '';
  const message = typeof record?.message === 'string' ? record.message : String(error ?? '');
  return (
    ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'].includes(code) ||
    /getaddrinfo|connect\s+etimedout|connection\s+timeout|connection\s+terminated|econnrefused|enotfound/i.test(message)
  );
}

function disableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function runtimePostgresPoolConfig(
  connectionString: string,
  applicationName: string,
): PoolConfig {
  return {
    connectionString,
    application_name: applicationName,
    max: resolvePostgresPoolMax(),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: disableSsl(connectionString) ? false : { rejectUnauthorized: false },
  };
}

async function loadPg(): Promise<typeof import('pg')> {
  const loadPg = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<typeof import('pg')>;
  return loadPg('pg');
}

/**
 * Resolve the per-instance Postgres pool size for the write/compat pool.
 *
 * Default: 1. Cap: 20 (raised from 5 on 2026-05-30 in sync with the
 * azure read-adapter session pool — see
 * `src/lib/data-plane/read-adapters/azureSession.ts`'s
 * `resolveAzurePoolMax` for the rationale).
 */
export function resolvePostgresPoolMax(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.ABARVA_PG_POOL_MAX?.trim() || env.PGPOOL_MAX?.trim();
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 20);
}

async function getPool(connectionString: string): Promise<import('pg').Pool> {
  const existing = pools.get(connectionString);
  if (existing) return existing;
  const { Pool } = await loadPg();
  const pool = new Pool(runtimePostgresPoolConfig(connectionString, 'abarva-postgres-compat'));
  pools.set(connectionString, pool);
  return pool;
}

async function queryWithFallback<R extends import('pg').QueryResultRow>(
  sql: string,
  params: unknown[],
): Promise<import('pg').QueryResult<R>> {
  const candidates = resolveDatabaseUrls();
  const ordered = activeConnectionString
    ? [activeConnectionString, ...candidates.filter((url) => url !== activeConnectionString)]
    : candidates;
  let lastError: unknown = null;

  for (let index = 0; index < ordered.length; index++) {
    const connectionString = ordered[index]!;
    const pool = await getPool(connectionString);
    try {
      const result = await pool.query<R>(sql, params);
      activeConnectionString = connectionString;
      return result;
    } catch (error) {
      lastError = error;
      const canFallback = index < ordered.length - 1 && isConnectionFallbackError(error);
      if (!canFallback) throw error;
      pools.delete(connectionString);
      if (activeConnectionString === connectionString) activeConnectionString = null;
      await pool.end().catch(() => undefined);
      console.warn('[postgres-compat] primary database connection failed; trying fallback DATABASE_URL', {
        code: (error as { code?: unknown })?.code,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw lastError;
}

function quoteIdent(identifier: string): string {
  const clean = identifier.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${clean}"`;
}

function topLevelSplit(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSelect(selectText: string | undefined): string {
  const text = (selectText ?? '*').trim();
  if (!text || text === '*') return '*';
  const columns: string[] = [];
  for (const raw of topLevelSplit(text)) {
    const part = raw.trim();
    if (!part || part.includes('(') || part.includes('!')) continue;
    if (part === '*') {
      columns.push('*');
      continue;
    }
    const aliasMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)$/);
    if (aliasMatch) {
      columns.push(`${quoteIdent(aliasMatch[2]!)} AS ${quoteIdent(aliasMatch[1]!)}`);
      continue;
    }
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) {
      columns.push(quoteIdent(part));
    }
  }
  if (columns.includes('*')) return '*';
  return columns.length > 0 ? columns.join(', ') : '*';
}

function errorResult(error: unknown): QueryResult {
  const message = error instanceof Error ? error.message : String(error);
  return { data: null, error: { message }, count: null };
}

function normalizeValue(raw: string): unknown {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function parseOrFilter(raw: string): Filter | null {
  const match = raw.match(/^([a-zA-Z_][a-zA-Z0-9_\.]*)\.(eq|neq|gt|gte|lt|lte|is|like|ilike)\.(.*)$/);
  if (!match) return null;
  const [, column, op, value] = match;
  const map: Record<string, FilterOp> = {
    eq: '=',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    is: 'is',
    like: 'like',
    ilike: 'ilike',
  };
  return { column: column!, op: map[op!]!, value: normalizeValue(value!) };
}

class PostgresCompatQuery<T = any[]> implements PromiseLike<QueryResult<T>> {
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectText = '*';
  private filters: Filter[] = [];
  private orGroups: Filter[][] = [];
  private orders: OrderBy[] = [];
  private rowLimit: number | null = null;
  private rowOffset: number | null = null;
  private mutationPayload: unknown = null;
  private shouldReturnRows = false;
  private singleMode: 'single' | 'maybe' | null = null;
  private countMode: 'exact' | null = null;
  private headOnly = false;
  private conflictColumns: string[] = [];
  private ignoreDuplicates = false;

  constructor(private readonly table: string) {}

  select(columns = '*', options: { count?: 'exact'; head?: boolean } = {}): this {
    this.selectText = columns;
    this.countMode = options.count ?? null;
    this.headOnly = Boolean(options.head);
    this.shouldReturnRows = this.operation !== 'select';
    return this;
  }

  insert(payload: unknown): this {
    this.operation = 'insert';
    this.mutationPayload = payload;
    return this;
  }

  update(payload: unknown): this {
    this.operation = 'update';
    this.mutationPayload = payload;
    return this;
  }

  upsert(payload: unknown, options: { onConflict?: string; ignoreDuplicates?: boolean } = {}): this {
    this.operation = 'upsert';
    this.mutationPayload = payload;
    this.conflictColumns = options.onConflict?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
    this.ignoreDuplicates = Boolean(options.ignoreDuplicates);
    return this;
  }

  delete(options: { count?: 'exact' } = {}): this {
    this.operation = 'delete';
    this.countMode = options.count ?? null;
    return this;
  }

  eq(column: string, value: unknown): this { return this.addFilter(column, '=', value); }
  neq(column: string, value: unknown): this { return this.addFilter(column, '!=', value); }
  gt(column: string, value: unknown): this { return this.addFilter(column, '>', value); }
  gte(column: string, value: unknown): this { return this.addFilter(column, '>=', value); }
  lt(column: string, value: unknown): this { return this.addFilter(column, '<', value); }
  lte(column: string, value: unknown): this { return this.addFilter(column, '<=', value); }
  like(column: string, value: unknown): this { return this.addFilter(column, 'like', value); }
  ilike(column: string, value: unknown): this { return this.addFilter(column, 'ilike', value); }
  in(column: string, value: unknown[]): this { return this.addFilter(column, 'in', value); }
  is(column: string, value: unknown): this { return this.addFilter(column, 'is', value); }
  contains(column: string, value: unknown): this { return this.addFilter(column, 'contains', value); }
  overlaps(column: string, value: unknown): this { return this.addFilter(column, 'overlaps', value); }

  textSearch(column: string, query: string, options?: unknown): this {
    void options;
    return this.addFilter(column, 'text_search', query);
  }

  not(column: string, op: string, value: unknown): this {
    const filter = parseOrFilter(`${column}.${op}.${value === null ? 'null' : String(value)}`);
    if (filter) this.filters.push({ ...filter, negate: true });
    return this;
  }

  or(expression: string): this {
    const group = topLevelSplit(expression).map(parseOrFilter).filter((item): item is Filter => Boolean(item));
    if (group.length > 0) this.orGroups.push(group);
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string } = {}): this {
    if (options.foreignTable) return this;
    this.orders.push({
      column,
      ascending: options.ascending !== false,
      nullsFirst: options.nullsFirst,
    });
    return this;
  }

  limit(count: number): this {
    this.rowLimit = count;
    return this;
  }

  range(from: number, to: number): this {
    this.rowOffset = from;
    this.rowLimit = Math.max(0, to - from + 1);
    return this;
  }

  single<U = Record<string, any>>(): Promise<QueryResult<U>> {
    this.singleMode = 'single';
    this.rowLimit ??= 1;
    return this.execute() as unknown as Promise<QueryResult<U>>;
  }

  maybeSingle<U = Record<string, any>>(): Promise<QueryResult<U>> {
    this.singleMode = 'maybe';
    this.rowLimit ??= 1;
    return this.execute() as unknown as Promise<QueryResult<U>>;
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): PromiseLike<QueryResult<T> | TResult> {
    return this.execute().catch(onrejected);
  }

  private addFilter(column: string, op: FilterOp, value: unknown): this {
    this.filters.push({ column, op, value });
    return this;
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      if (this.operation === 'select') return await this.executeSelect();
      if (this.operation === 'insert') return await this.executeInsert();
      if (this.operation === 'update') return await this.executeUpdate();
      if (this.operation === 'delete') return await this.executeDelete();
      return await this.executeUpsert();
    } catch (error) {
      return errorResult(error) as QueryResult<T>;
    }
  }

  private async executeSelect(): Promise<QueryResult<T>> {
    const params: unknown[] = [];
    const where = this.buildWhere(params);
    if (this.countMode === 'exact' && this.headOnly) {
      const { rows } = await queryWithFallback<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${quoteIdent(this.table)}${where}`,
        params,
      );
      return { data: null, error: null, count: rows[0]?.n ?? 0 };
    }
    const sql = [
      `SELECT ${parseSelect(this.selectText)} FROM ${quoteIdent(this.table)}${where}`,
      this.buildOrder(),
      this.buildLimit(params),
    ].filter(Boolean).join(' ');
    const { rows } = await queryWithFallback(sql, params);
    const count = this.countMode === 'exact' ? rows.length : null;
    return this.formatRows(rows as T[], count);
  }

  private async executeInsert(): Promise<QueryResult<T>> {
    const rows = Array.isArray(this.mutationPayload) ? this.mutationPayload as JsonRecord[] : [this.mutationPayload as JsonRecord];
    if (rows.length === 0) return { data: this.singleMode ? null : ([] as T), error: null, count: 0 };
    const columns = Object.keys(rows[0]!);
    const params: unknown[] = [];
    const valuesSql = rows.map((row, rowIndex) => `(${columns.map((column, columnIndex) => {
      params.push(row[column]);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    }).join(', ')})`);
    const returning = this.shouldReturnRows ? ` RETURNING ${parseSelect(this.selectText)}` : '';
    const sql = `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql.join(', ')}${returning}`;
    const { rows: returnedRows, rowCount } = await queryWithFallback(sql, params);
    return this.shouldReturnRows ? this.formatRows(returnedRows as T[], rowCount ?? null) : { data: null, error: null, count: rowCount ?? null };
  }

  private async executeUpdate(): Promise<QueryResult<T>> {
    const payload = this.mutationPayload as JsonRecord;
    const columns = Object.keys(payload);
    const params = columns.map((column) => payload[column]);
    const setSql = columns.map((column, index) => `${quoteIdent(column)} = $${index + 1}`).join(', ');
    const where = this.buildWhere(params);
    const returning = this.shouldReturnRows ? ` RETURNING ${parseSelect(this.selectText)}` : '';
    const { rows, rowCount } = await queryWithFallback(
      `UPDATE ${quoteIdent(this.table)} SET ${setSql}${where}${returning}`,
      params,
    );
    return this.shouldReturnRows ? this.formatRows(rows as T[], rowCount ?? null) : { data: null, error: null, count: rowCount ?? null };
  }

  private async executeDelete(): Promise<QueryResult<T>> {
    const params: unknown[] = [];
    const where = this.buildWhere(params);
    const returning = this.shouldReturnRows ? ` RETURNING ${parseSelect(this.selectText)}` : '';
    const { rows, rowCount } = await queryWithFallback(
      `DELETE FROM ${quoteIdent(this.table)}${where}${returning}`,
      params,
    );
    return this.shouldReturnRows ? this.formatRows(rows as T[], rowCount ?? null) : { data: null, error: null, count: rowCount ?? null };
  }

  private async executeUpsert(): Promise<QueryResult<T>> {
    const rows = Array.isArray(this.mutationPayload) ? this.mutationPayload as JsonRecord[] : [this.mutationPayload as JsonRecord];
    if (rows.length === 0) return { data: this.singleMode ? null : ([] as T), error: null, count: 0 };
    const columns = Object.keys(rows[0]!);
    const params: unknown[] = [];
    const valuesSql = rows.map((row, rowIndex) => `(${columns.map((column, columnIndex) => {
      params.push(row[column]);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    }).join(', ')})`);
    const conflicts = this.conflictColumns.length > 0 ? this.conflictColumns : ['id'];
    const updateColumns = columns.filter((column) => !conflicts.includes(column));
    const conflictSql = conflicts.map(quoteIdent).join(', ');
    const updateSql = this.ignoreDuplicates
      ? 'DO NOTHING'
      : updateColumns.length > 0
      ? `DO UPDATE SET ${updateColumns.map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`).join(', ')}`
      : 'DO NOTHING';
    const returning = this.shouldReturnRows ? ` RETURNING ${parseSelect(this.selectText)}` : '';
    const { rows: returnedRows, rowCount } = await queryWithFallback(
      `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql.join(', ')}
       ON CONFLICT (${conflictSql}) ${updateSql}${returning}`,
      params,
    );
    return this.shouldReturnRows ? this.formatRows(returnedRows as T[], rowCount ?? null) : { data: null, error: null, count: rowCount ?? null };
  }

  private buildWhere(params: unknown[]): string {
    const clauses: string[] = [];
    for (const filter of this.filters) {
      clauses.push(this.filterToSql(filter, params));
    }
    for (const group of this.orGroups) {
      const parts = group.map((filter) => this.filterToSql(filter, params));
      if (parts.length > 0) clauses.push(`(${parts.join(' OR ')})`);
    }
    return clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
  }

  private filterToSql(filter: Filter, params: unknown[]): string {
    const column = filter.column.includes('.') ? filter.column.split('.').map(quoteIdent).join('.') : quoteIdent(filter.column);
    const not = filter.negate ? 'NOT ' : '';
    if (filter.op === 'is') {
      if (filter.value === null) return `${column} IS ${filter.negate ? 'NOT ' : ''}NULL`;
      params.push(filter.value);
      return `${not}${column} IS NOT DISTINCT FROM $${params.length}`;
    }
    if (filter.op === 'in') {
      params.push(filter.value ?? []);
      return `${not}${column} = ANY($${params.length})`;
    }
    if (filter.op === 'contains') {
      params.push(JSON.stringify(filter.value ?? {}));
      return `${not}${column} @> $${params.length}::jsonb`;
    }
    if (filter.op === 'overlaps') {
      params.push(filter.value);
      return `${not}${column} && $${params.length}`;
    }
    if (filter.op === 'text_search') {
      params.push(String(filter.value ?? ''));
      return `${not}to_tsvector('english', coalesce(${column}::text, '')) @@ websearch_to_tsquery('english', $${params.length})`;
    }
    params.push(filter.value);
    const op = filter.op === '!=' ? '<>' : filter.op.toUpperCase();
    return `${not}${column} ${op} $${params.length}`;
  }

  private buildOrder(): string {
    if (this.orders.length === 0) return '';
    return `ORDER BY ${this.orders.map((order) => {
      const nulls = order.nullsFirst === undefined ? '' : order.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST';
      return `${quoteIdent(order.column)} ${order.ascending ? 'ASC' : 'DESC'}${nulls}`;
    }).join(', ')}`;
  }

  private buildLimit(params: unknown[]): string {
    const parts: string[] = [];
    if (this.rowLimit != null) {
      params.push(this.rowLimit);
      parts.push(`LIMIT $${params.length}`);
    }
    if (this.rowOffset != null) {
      params.push(this.rowOffset);
      parts.push(`OFFSET $${params.length}`);
    }
    return parts.join(' ');
  }

  private formatRows(rows: T[], count: number | null): QueryResult<T> {
    if (this.singleMode) {
      if (rows.length === 0) {
        return this.singleMode === 'maybe'
          ? { data: null, error: null, count }
          : { data: null, error: { message: 'No rows returned' }, count };
      }
      return { data: rows[0] ?? null, error: null, count };
    }
    return { data: rows as T, error: null, count };
  }
}

export interface PostgresCompatClient {
  [key: string]: any;
  from: <T = any[]>(table: string) => PostgresCompatQuery<T>;
  schema: (schemaName: string) => PostgresCompatClient;
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<QueryResult<Blob>>;
      upload: (path: string, body: unknown, options?: unknown) => Promise<QueryResult<{ path: string }>>;
      remove: (paths: string[]) => Promise<QueryResult<null>>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
      createSignedUrl: (path: string, expiresIn: number, options?: unknown) => Promise<QueryResult<{ signedUrl: string }>>;
    };
  };
}

function createPostgresCompatClient(): PostgresCompatClient {
  const compat: PostgresCompatClient = {
    from: <T = any[]>(table: string) => new PostgresCompatQuery<T>(table),
    schema: () => compat,
    storage: {
      from: (bucket: string) => ({
        download: async (storagePath: string) => ({
          data: null,
          error: {
            message: `Postgres data plane does not expose object storage download for ${bucket}/${storagePath}`,
          },
        }),
        upload: async (storagePath: string) => ({
          data: { path: storagePath },
          error: null,
        }),
        remove: async () => ({ data: null, error: null }),
        getPublicUrl: (storagePath: string) => ({ data: { publicUrl: `/api/storage/${bucket}/${storagePath}` } }),
        createSignedUrl: async (storagePath: string) => ({
          data: { signedUrl: `/api/storage/${bucket}/${storagePath}` },
          error: null,
        }),
      }),
    },
  };
  return compat;
}

export function getAzureReadFluentClient(): PostgresCompatClient {
  client ??= createPostgresCompatClient();
  return client;
}

export function getAzureWriteFluentClient(): PostgresCompatClient {
  return getAzureReadFluentClient();
}

import {
  createDefaultSession,
  type SessionRunner,
  type SqlRunner,
} from './read-adapters/azureSession';

type SqlScalar = string | number | boolean | Date | null;
type SqlValue = SqlScalar | readonly SqlScalar[];

type WhereOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is';

export interface WherePredicate {
  op: WhereOperator;
  value: SqlValue;
}

export type WhereValue = SqlValue | WherePredicate;

export interface AzureReadSelect {
  table: string;
  columns?: readonly string[] | '*';
  where?: Readonly<Record<string, WhereValue>>;
  orderBy?: {
    column: string;
    direction?: 'asc' | 'desc';
    nulls?: 'first' | 'last';
  };
  limit?: number;
  offset?: number;
  missingTable?: 'empty' | 'throw';
}

export interface AzureReadClient {
  query<R = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
    opts?: { missingTable?: 'empty' | 'throw' },
  ): Promise<R[]>;
  select<R = Record<string, unknown>>(request: AzureReadSelect): Promise<R[]>;
  maybeSingle<R = Record<string, unknown>>(request: AzureReadSelect): Promise<R | null>;
  count(request: Omit<AzureReadSelect, 'columns' | 'orderBy' | 'limit' | 'offset'>): Promise<number>;
  withSession<T>(fn: (run: SqlRunner) => Promise<T>): Promise<T>;
}

const DEFAULT_APPLICATION_NAME = 'abarva-runtime-azure-read';
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertIdentifier(value: string, label: string): string {
  if (!IDENTIFIER_RE.test(value)) {
    throw new Error(`azure_read_invalid_${label}: ${value}`);
  }
  return value;
}

function quoteIdentifier(value: string): string {
  return `"${assertIdentifier(value, 'identifier')}"`;
}

function normalizeLimit(value: number | undefined, label: string): number | null {
  if (value === undefined) return null;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`azure_read_invalid_${label}: ${value}`);
  }
  return value;
}

function assertSelectOnly(sql: string): void {
  const normalized = sql.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim();
  if (!/^(?:with\b[\s\S]+?\bselect\b|select\b)/i.test(normalized)) {
    throw new Error('azure_read_query_must_be_select_only');
  }
  if (/;\s*\S/.test(normalized)) {
    throw new Error('azure_read_query_must_not_contain_multiple_statements');
  }
  if (/\b(insert|update|delete|merge|alter|drop|truncate|grant|revoke|create)\b/i.test(normalized)) {
    throw new Error('azure_read_query_must_be_read_only');
  }
}

function isMissingTableError(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record?.code === 'string' ? record.code : '';
  const message = typeof record?.message === 'string' ? record.message : String(error ?? '');
  return code === '42P01' || /relation .* does not exist/i.test(message);
}

function predicateFor(value: WhereValue): WherePredicate {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    'op' in value
  ) {
    return value as WherePredicate;
  }
  return { op: value === null ? 'is' : 'eq', value };
}

function buildWhereClause(where: AzureReadSelect['where'], params: unknown[]): string {
  if (!where || Object.keys(where).length === 0) return '';

  const clauses = Object.entries(where).map(([column, raw]) => {
    const predicate = predicateFor(raw);
    const quotedColumn = quoteIdentifier(column);
    if (predicate.op === 'is') {
      if (predicate.value !== null) throw new Error(`azure_read_invalid_is_value: ${column}`);
      return `${quotedColumn} IS NULL`;
    }
    if (predicate.op === 'in') {
      if (!Array.isArray(predicate.value)) throw new Error(`azure_read_invalid_in_value: ${column}`);
      params.push(predicate.value);
      return `${quotedColumn} = ANY($${params.length})`;
    }

    params.push(predicate.value);
    const param = `$${params.length}`;
    switch (predicate.op) {
      case 'eq':
        return `${quotedColumn} = ${param}`;
      case 'neq':
        return `${quotedColumn} <> ${param}`;
      case 'gt':
        return `${quotedColumn} > ${param}`;
      case 'gte':
        return `${quotedColumn} >= ${param}`;
      case 'lt':
        return `${quotedColumn} < ${param}`;
      case 'lte':
        return `${quotedColumn} <= ${param}`;
      case 'like':
        return `${quotedColumn} LIKE ${param}`;
      case 'ilike':
        return `${quotedColumn} ILIKE ${param}`;
      default:
        throw new Error(`azure_read_unsupported_operator: ${predicate.op}`);
    }
  });

  return ` WHERE ${clauses.join(' AND ')}`;
}

function buildSelectSql(request: AzureReadSelect, count = false): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const table = quoteIdentifier(request.table);
  const columns = count
    ? 'count(*)::int AS n'
    : request.columns === '*' || !request.columns
      ? '*'
      : request.columns.map((column) => quoteIdentifier(column)).join(', ');
  const where = buildWhereClause(request.where, params);
  const order = request.orderBy && !count
    ? ` ORDER BY ${quoteIdentifier(request.orderBy.column)} ${(request.orderBy.direction ?? 'asc').toUpperCase()}${request.orderBy.nulls ? ` NULLS ${request.orderBy.nulls.toUpperCase()}` : ''}`
    : '';
  const limit = normalizeLimit(request.limit, 'limit');
  const offset = normalizeLimit(request.offset, 'offset');
  const paging = [
    limit !== null ? ` LIMIT ${limit}` : '',
    offset !== null ? ` OFFSET ${offset}` : '',
  ].join('');
  return {
    sql: `SELECT ${columns} FROM ${table}${where}${order}${paging}`,
    params,
  };
}

export function createAzureReadClient(
  session: SessionRunner = createDefaultSession(DEFAULT_APPLICATION_NAME),
): AzureReadClient {
  const withSession: AzureReadClient['withSession'] = (fn) => session(fn);

  const query: AzureReadClient['query'] = async (sql, params = [], opts = {}) => {
    assertSelectOnly(sql);
    try {
      return await withSession((run) => run(sql, [...params]));
    } catch (error) {
      if ((opts.missingTable ?? 'throw') === 'empty' && isMissingTableError(error)) return [];
      throw error;
    }
  };

  const select = async <R = Record<string, unknown>>(request: AzureReadSelect): Promise<R[]> => {
    const built = buildSelectSql(request);
    return query<R>(built.sql, built.params, { missingTable: request.missingTable });
  };

  const maybeSingle = async <R = Record<string, unknown>>(
    request: AzureReadSelect,
  ): Promise<R | null> => {
    const rows = await select<R>({ ...request, limit: request.limit ?? 1 });
    return rows[0] ?? null;
  };

  return {
    query,
    select,
    maybeSingle,
    async count(request) {
      const built = buildSelectSql(request, true);
      const rows = await query<{ n: number }>(built.sql, built.params, {
        missingTable: request.missingTable,
      });
      return rows[0]?.n ?? 0;
    },
    withSession,
  };
}

export const azureRead = createAzureReadClient();

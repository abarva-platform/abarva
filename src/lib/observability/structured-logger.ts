export type StructuredLogLevel = 'info' | 'warn' | 'error';

export interface TenantLogContext {
  activeClientKey?: string | null;
  activeClientName?: string | null;
  requestedClientKey?: string | null;
  requestedClientName?: string | null;
}

export interface StructuredLogEntry {
  level: StructuredLogLevel;
  event: string;
  timestamp: string;
  message?: string;
  tenant?: TenantLogContext;
  route?: string;
  surface?: string;
  metadata?: Record<string, unknown>;
}

export type StructuredLogSink = Pick<Console, 'info' | 'warn' | 'error'>;

let logSink: StructuredLogSink = console;

function withoutEmptyValues<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, entryValue]) => entryValue !== undefined && entryValue !== null,
    ),
  ) as Partial<T>;
}

export function writeStructuredLog(
  level: StructuredLogLevel,
  event: string,
  input: Omit<StructuredLogEntry, 'level' | 'event' | 'timestamp'> = {},
): StructuredLogEntry {
  const entry: StructuredLogEntry = withoutEmptyValues({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...input,
    tenant: input.tenant ? withoutEmptyValues(input.tenant) : undefined,
    metadata: input.metadata ? withoutEmptyValues(input.metadata) : undefined,
  }) as StructuredLogEntry;

  logSink[level](JSON.stringify(entry));
  return entry;
}

export function setStructuredLogSinkForTests(sink: StructuredLogSink): void {
  logSink = sink;
}

export function resetStructuredLogSinkForTests(): void {
  logSink = console;
}

import type { ClientConfig } from 'pg';

export function shouldDisablePostgresSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
    if (sslMode === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function postgresClientOptions(
  connectionString: string,
  applicationName?: string,
): ClientConfig {
  return {
    connectionString,
    ...(applicationName ? { application_name: applicationName } : {}),
    ssl: shouldDisablePostgresSsl(connectionString)
      ? false
      : { rejectUnauthorized: false },
  };
}


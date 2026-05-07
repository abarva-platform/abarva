// .env loader + typed config. We resolve everything once at startup so
// downstream code never reads process.env directly — that keeps the
// crawler's surface area small and easy to test.

import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

loadDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

export interface CrawlConfig {
  tenantUrl: string;
  tenantHostname: string;
  tenantPathPrefix: string;
  signinUrl: string;
  auditorEmail: string;
  auditorRole: string;
  maxPages: number;
  maxHours: number;
  delayMinMs: number;
  delayMaxMs: number;
  dryPages: number;
  headed: boolean;
  piiRedactionMode: 'strictest' | 'standard';
  storageStatePath: string;
  outputDir: string;
  vaultDir: string;
  screenshotDir: string;
}

function require(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return v.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function optionalBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (!v) return fallback;
  return /^(true|1|yes|y|on)$/i.test(v);
}

export function loadConfig(): CrawlConfig {
  const tenantUrl = require('TENANT_URL');
  const tenantHostname =
    process.env.TENANT_HOSTNAME?.trim() || new URL(tenantUrl).hostname;
  const tenantPathPrefix =
    process.env.TENANT_PATH_PREFIX?.trim() || new URL(tenantUrl).pathname || '/';

  return {
    tenantUrl,
    tenantHostname,
    tenantPathPrefix,
    signinUrl: process.env.SIGNIN_URL?.trim() || `https://${tenantHostname}/sign-in`,
    auditorEmail: process.env.AUDITOR_EMAIL?.trim() || 'unknown@unknown',
    auditorRole: process.env.AUDITOR_ROLE?.trim() || 'unknown',
    maxPages: optionalNumber('CRAWL_MAX_PAGES', 5000),
    maxHours: optionalNumber('CRAWL_MAX_HOURS', 2),
    delayMinMs: optionalNumber('CRAWL_DELAY_MIN_MS', 800),
    delayMaxMs: optionalNumber('CRAWL_DELAY_MAX_MS', 1200),
    dryPages: optionalNumber('CRAWL_DRY_PAGES', 50),
    headed: optionalBool('CRAWL_HEADED', true),
    piiRedactionMode:
      process.env.PII_REDACTION_MODE === 'standard' ? 'standard' : 'strictest',
    storageStatePath: resolve(ROOT, 'auth', 'storageState.json'),
    outputDir: resolve(ROOT, 'crawl', 'output'),
    vaultDir: resolve(ROOT, 'vault'),
    screenshotDir: resolve(ROOT, 'crawl', 'output', 'screenshots'),
  };
}

// CLOUD4 - Local Private Deployment Lab config tests.
//
// Pure file-shape checks. No docker, no cloud APIs, no model calls,
// no real secrets. Reads:
//   - docker-compose.private-lab.yml
//   - .env.private-lab.example
// at the repo root.

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const COMPOSE_PATH = path.join(REPO_ROOT, 'docker-compose.private-lab.yml');
const ENV_EXAMPLE_PATH = path.join(REPO_ROOT, '.env.private-lab.example');

const EXPECTED_SERVICES = ['app', 'postgres', 'minio', 'model-gateway-stub'] as const;

const REQUIRED_ENV_KEYS = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'DATABASE_URL',
  'S3_ENDPOINT',
  'MODEL_GATEWAY_URL',
] as const;

// ---------------------------------------------------------------------
// docker-compose.private-lab.yml
// ---------------------------------------------------------------------

describe('CLOUD4 - docker-compose.private-lab.yml', () => {
  let compose: string;

  beforeAll(() => {
    expect(fs.existsSync(COMPOSE_PATH)).toBe(true);
    compose = fs.readFileSync(COMPOSE_PATH, 'utf8');
  });

  it('declares all 4 expected services as top-level service keys', () => {
    for (const svc of EXPECTED_SERVICES) {
      const re = new RegExp(`^  ${svc}:`, 'm');
      expect(compose).toMatch(re);
    }
  });

  it('declares the canonical private bridge network name', () => {
    expect(compose).toMatch(/abarva-private-lab/);
  });

  it('marks itself LAB ONLY in the file header', () => {
    const head = compose.split('\n').slice(0, 12).join('\n');
    expect(head.toLowerCase()).toMatch(/lab only/);
  });

  it('does not claim production posture', () => {
    expect(compose).not.toMatch(/production_ready/i);
    expect(compose).not.toMatch(/production-ready/i);
    expect(compose).not.toMatch(/"production"/);
  });

  it('does not embed real-looking secret patterns', () => {
    expect(compose).not.toMatch(/(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9]{20,}/);
    expect(compose).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    // Long opaque token with mixed letters+digits.
    expect(hasMixedAlnumRun(compose, 40)).toBe(false);
  });

  it('does not reference real model provider hostnames', () => {
    expect(compose).not.toMatch(/openai\.com/i);
    expect(compose).not.toMatch(/anthropic\.com/i);
    expect(compose).not.toMatch(/googleapis\.com/i);
    expect(compose).not.toMatch(/cohere\.com/i);
    // The literal hostname `azure.com` should not appear (lab is local).
    expect(compose).not.toMatch(/\bazure\.com\b/i);
  });
});

// ---------------------------------------------------------------------
// .env.private-lab.example
// ---------------------------------------------------------------------

describe('CLOUD4 - .env.private-lab.example', () => {
  let env: string;

  beforeAll(() => {
    expect(fs.existsSync(ENV_EXAMPLE_PATH)).toBe(true);
    env = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  });

  it('declares all required env keys', () => {
    for (const key of REQUIRED_ENV_KEYS) {
      const re = new RegExp(`^${key}=`, 'm');
      expect(env).toMatch(re);
    }
  });

  it('marks itself EXAMPLE ONLY at the top', () => {
    const head = env.split('\n').slice(0, 10).join('\n').toUpperCase();
    expect(head).toMatch(/EXAMPLE ONLY/);
  });

  it('does not claim production posture', () => {
    expect(env).not.toMatch(/production_ready/i);
    expect(env).not.toMatch(/production-ready/i);
  });

  it('does not embed real-looking secret patterns', () => {
    expect(env).not.toMatch(/(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9]{20,}/);
    expect(env).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(hasMixedAlnumRun(env, 40)).toBe(false);
  });

  it('does not reference real model provider hostnames or keys', () => {
    expect(env).not.toMatch(/openai\.com/i);
    expect(env).not.toMatch(/anthropic\.com/i);
    expect(env).not.toMatch(/googleapis\.com/i);
    expect(env).not.toMatch(/cohere\.com/i);
    expect(env).not.toMatch(/\bazure\.com\b/i);
    // No provider key envs should be set in a lab example.
    expect(env).not.toMatch(/^OPENAI_API_KEY=/m);
    expect(env).not.toMatch(/^ANTHROPIC_API_KEY=/m);
    expect(env).not.toMatch(/^AZURE_OPENAI_API_KEY=/m);
  });

  it('routes MODEL_GATEWAY_URL to the in-network stub only', () => {
    const m = env.match(/^MODEL_GATEWAY_URL=(.+)$/m);
    expect(m).not.toBeNull();
    const url = m![1].trim();
    // Must point at the lab stub hostname; never to a public host.
    expect(url).toMatch(/^http:\/\/model-gateway-stub:/);
  });
});

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

/**
 * True when `text` contains a contiguous run of >=`min` [A-Za-z0-9]
 * chars that includes BOTH a letter and a digit. This rules out
 * comment dividers (`---...`) and all-letter words while still
 * matching real provider-key shapes.
 */
function hasMixedAlnumRun(text: string, min: number): boolean {
  const re = /[A-Za-z0-9]{40,}/g;
  const matches = text.match(re) ?? [];
  return matches.some(
    (tok) => tok.length >= min && /[A-Za-z]/.test(tok) && /[0-9]/.test(tok),
  );
}

#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://app.abarva.ai';
const DEFAULT_ALERT_TO = 'admin@abarva.ai';
const DEFAULT_FROM = 'AbarVa Monitor <support@send.abarva.ai>';

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

async function readText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function checkSignIn(baseUrl) {
  const response = await fetch(`${baseUrl}/sign-in`, { redirect: 'manual' });
  const body = await readText(response);
  const ok = response.status === 200 && /Sign in with a one-time code/i.test(body);
  return {
    name: 'sign-in route renders public email-code login',
    ok,
    status: response.status,
    detail: ok
      ? 'ok'
      : `Expected 200 with email-code sign-in copy; got ${response.status}. Body starts: ${body.slice(0, 220)}`,
  };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'abarva-request-access-canary/1.0',
    },
    body: JSON.stringify(body),
  });
  const text = await readText(response);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw text in detail.
  }
  return { response, text, json };
}

async function checkPersonalEmailValidation(baseUrl) {
  const { response, text, json } = await postJson(`${baseUrl}/api/request-access`, {
    name: 'AbarVa Canary',
    email: 'request-access-canary@gmail.com',
    company: 'AbarVa Canary',
  });
  const message = String(json?.error ?? '');
  const ok = response.status === 422 && /work email/i.test(message);
  return {
    name: 'request-access rejects personal email with useful validation',
    ok,
    status: response.status,
    detail: ok
      ? 'ok'
      : `Expected 422 work-email validation; got ${response.status}. Body: ${text.slice(0, 500)}`,
  };
}

async function checkRequiredFieldsValidation(baseUrl) {
  const { response, text, json } = await postJson(`${baseUrl}/api/request-access`, {
    email: 'missing-name@send.abarva.ai',
  });
  const message = String(json?.error ?? '');
  const ok = response.status === 400 && /name, work email, and company/i.test(message);
  return {
    name: 'request-access validates required fields',
    ok,
    status: response.status,
    detail: ok
      ? 'ok'
      : `Expected 400 required-field validation; got ${response.status}. Body: ${text.slice(0, 500)}`,
  };
}

async function sendAlert({ baseUrl, failures, results }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REQUEST_ACCESS_ALERT_TO || DEFAULT_ALERT_TO;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey) {
    console.error('[request-access-canary] RESEND_API_KEY is not configured; cannot email alert.');
    return false;
  }

  const checkedAt = new Date().toISOString();
  const text = [
    'Request-access canary failed.',
    '',
    `Base URL: ${baseUrl}`,
    `Checked at: ${checkedAt}`,
    '',
    'Failures:',
    ...failures.map((failure) => `- ${failure.name}: ${failure.detail}`),
    '',
    'All checks:',
    ...results.map((result) => `- ${result.ok ? 'PASS' : 'FAIL'} ${result.name} (${result.status})`),
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '[AbarVa alert] Request access canary failed',
      text,
    }),
  });

  if (!response.ok) {
    const body = await readText(response);
    console.error('[request-access-canary] failed to send alert:', response.status, body);
    return false;
  }
  return true;
}

async function main() {
  const baseUrl = normalizeBaseUrl(argValue('--base-url', process.env.PRODUCTION_BASE_URL));
  const outPath = argValue('--out', null);
  const results = [
    await checkSignIn(baseUrl),
    await checkPersonalEmailValidation(baseUrl),
    await checkRequiredFieldsValidation(baseUrl),
  ];
  const failures = results.filter((result) => !result.ok);
  const summary = {
    ok: failures.length === 0,
    baseUrl,
    checkedAt: new Date().toISOString(),
    results,
  };

  if (outPath) {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    await sendAlert({ baseUrl, failures, results });
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  const baseUrl = normalizeBaseUrl(argValue('--base-url', process.env.PRODUCTION_BASE_URL));
  const detail = err instanceof Error ? err.stack || err.message : String(err);
  console.error('[request-access-canary] crashed:', detail);
  await sendAlert({
    baseUrl,
    failures: [{ name: 'canary crashed', detail, status: 0, ok: false }],
    results: [],
  });
  process.exitCode = 1;
});

import { test, expect } from '@playwright/test';

const eventId = '00000000-0000-4000-8000-000000000001';
const domain = 'vendor.example.invalid';
const pageUrl = `https://${domain}/rfp/${eventId}`;
const apiUrl = `https://${domain}/api/v1/source/rfp/${eventId}/acknowledge`;

test('vendor session reaches the overview and its API on the same origin', async ({ context }) => {
  const name = 'vendor-session';
  await context.addCookies([{ name, value: 'opaque-session', domain, path: '/', httpOnly: true }]);

  expect((await context.cookies(pageUrl)).map((cookie) => cookie.name)).toContain(name);
  expect((await context.cookies(apiUrl)).map((cookie) => cookie.name)).toContain(name);

  await context.clearCookies();
  await context.addCookies([
    { name, value: 'old-path-session', domain, path: `/rfp/${eventId}`, httpOnly: true },
  ]);
  expect((await context.cookies(pageUrl)).map((cookie) => cookie.name)).toContain(name);
  expect((await context.cookies(apiUrl)).map((cookie) => cookie.name)).not.toContain(name);
});

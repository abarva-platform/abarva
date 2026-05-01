export const DEMO_CODE_VALUE = '424242';

export const DEMO_CODE_ALLOWED_EMAILS = [
  'demo-apexretail+clerk_test@abarva.com',
  'demo-meridian+clerk_test@abarva.com',
  'demo-firstcapital+clerk_test@abarva.com',
] as const;

const DEMO_CODE_ALLOWED_EMAIL_SET = new Set<string>(DEMO_CODE_ALLOWED_EMAILS);

export function normalizeDemoCodeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isDemoCodeEmail(email: string | null | undefined): boolean {
  return DEMO_CODE_ALLOWED_EMAIL_SET.has(normalizeDemoCodeEmail(email));
}

import { CANONICAL_AUTH_EMAILS } from '@/lib/auth/canonical-auth-roster';

export const DEMO_CODE_VALUE = '424242';

export const DEMO_CODE_ALLOWED_EMAILS = CANONICAL_AUTH_EMAILS;

const DEMO_CODE_ALLOWED_EMAIL_SET = new Set<string>(DEMO_CODE_ALLOWED_EMAILS);

export function normalizeDemoCodeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isDemoCodeEmail(email: string | null | undefined): boolean {
  return DEMO_CODE_ALLOWED_EMAIL_SET.has(normalizeDemoCodeEmail(email));
}

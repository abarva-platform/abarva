import { CANONICAL_AUTH_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { isLaunchApprovedEmail } from '@/lib/auth/launch-access-server';

export const DEMO_CODE_VALUE = '424242';

export const DEMO_CODE_ALLOWED_EMAILS = [
  ...CANONICAL_AUTH_EMAILS,
  ...ANAND_OPERATOR_AUTH_EMAILS,
] as const;

const DEMO_CODE_ALLOWED_EMAIL_SET = new Set<string>(DEMO_CODE_ALLOWED_EMAILS);

export function normalizeDemoCodeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isDemoCodeEmail(email: string | null | undefined): boolean {
  const normalized = normalizeDemoCodeEmail(email);
  return DEMO_CODE_ALLOWED_EMAIL_SET.has(normalized) || isLaunchApprovedEmail(normalized);
}

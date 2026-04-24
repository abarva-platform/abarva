const DEMO_CODE_EMAIL_RE = /\+clerk_test@abarva\.com$/i;

export const DEMO_CODE_VALUE = '424242';

export function isDemoCodeEmail(email: string | null | undefined): boolean {
  return DEMO_CODE_EMAIL_RE.test((email ?? '').trim());
}

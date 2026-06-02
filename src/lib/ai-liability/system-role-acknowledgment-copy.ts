export const SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION =
  '2026-06-02.tenant-admin-system-role-v1';

export const SYSTEM_ROLE_ACKNOWLEDGMENT_ROUTE =
  '/admin/system-role-acknowledgment';

export const SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT =
  'I acknowledge that I am acting as a tenant administrator or system owner for this AbarVa workspace. I am responsible for validating tenant scope, approving user access, reviewing connector and data-load permissions, confirming loaded data belongs only to this client, and ensuring AI-assisted outputs are reviewed by accountable humans before action.';

export const SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS = [
  'Tenant scope must remain limited to this client workspace; cross-tenant loading or approval is not permitted.',
  'User access, connector setup, templates, and data-load permissions require accountable admin review.',
  'PHI, PII, financial, contractual, and workforce-sensitive data must be handled through approved controls before processing.',
  'AI-generated recommendations, alerts, drafts, and summaries remain decision-support. Humans approve actions and own the outcome.',
] as const;

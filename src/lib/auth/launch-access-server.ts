import { isClientKey, type ClientKey } from '@/lib/client-config';
import {
  getStaticLaunchAccessProfile,
  normalizeLaunchEmail,
  type LaunchAccessProfile,
  type LaunchAccessRole,
} from '@/lib/auth/launch-access';

const CLIENT_ENV_VARS: ReadonlyArray<readonly [string, ClientKey]> = [
  ['ABARVA_LAUNCH_APEX_EMAILS', 'apexretail'],
  ['ABARVA_LAUNCH_FIRST_CAPITAL_EMAILS', 'arcturus'],
  ['ABARVA_LAUNCH_MERIDIAN_EMAILS', 'meridian'],
  ['ABARVA_LAUNCH_SKYHARBOR_EMAILS', 'skyharbor'],
  ['ABARVA_LAUNCH_LAKESHORE_EMAILS', 'lakeshore'],
];

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => normalizeLaunchEmail(entry))
    .filter(Boolean);
}

function envProfileForEmail(email: string): LaunchAccessProfile | null {
  const normalized = normalizeLaunchEmail(email);
  if (!normalized) return null;

  if (splitCsv(process.env.ABARVA_LAUNCH_ADMIN_EMAILS).includes(normalized)) {
    return { email: normalized, role: 'admin', label: 'Runtime admin access' };
  }

  for (const [envName, clientKey] of CLIENT_ENV_VARS) {
    if (splitCsv(process.env[envName]).includes(normalized)) {
      return { email: normalized, role: 'client', clientKey, label: `Runtime ${clientKey} client access` };
    }
  }

  for (const rawEntry of splitCsv(process.env.ABARVA_LAUNCH_ALLOWED_EMAILS)) {
    const [rawEmail, rawRole, rawClientKey] = rawEntry.split(':').map((part) => part?.trim().toLowerCase());
    if (rawEmail !== normalized) continue;
    const role = (rawRole === 'admin' || rawRole === 'maestro' || rawRole === 'client')
      ? (rawRole as LaunchAccessRole)
      : 'client';
    const clientKey = isClientKey(rawClientKey) ? rawClientKey : undefined;
    return {
      email: normalized,
      role,
      clientKey,
      label: clientKey ? `Runtime ${clientKey} access` : 'Runtime launch access',
    };
  }

  return null;
}

export function getLaunchAccessProfile(email: string | null | undefined): LaunchAccessProfile | null {
  return getStaticLaunchAccessProfile(email) ?? envProfileForEmail(normalizeLaunchEmail(email));
}

export function isLaunchApprovedEmail(email: string | null | undefined): boolean {
  return getLaunchAccessProfile(email) !== null;
}

/**
 * Nexus Pricing Engine — PR3 governed-load client pricing profile import.
 *
 * Same parse -> validate -> diff -> approve/commit shape as
 * `rate-card-import.ts`, scoped to `pricing_client_profile_values`
 * (assumption_key/assumption_value) instead of rate-card lines.
 */
import {
  createClientProfileVersion,
  getCurrentClientProfile,
  listClientProfileValues,
  type CreateClientProfileVersionResult,
  type NewClientProfileValueInput,
} from "./client-profile-repository";
import { parseClientPricingProfileCsv } from "./csv-parse";
import { validateClientProfileRowsWithinUpload } from "./semantic-validation";
import type { ClientPricingProfileCsvRow, RowError } from "./types";

export interface ClientProfileDiffEntry {
  assumptionKey: string;
  assumptionValue: unknown;
}

export interface ClientProfileDiff {
  added: ClientProfileDiffEntry[];
  changed: { before: ClientProfileDiffEntry; after: ClientProfileDiffEntry }[];
  unchanged: ClientProfileDiffEntry[];
  removed: ClientProfileDiffEntry[];
}

export function computeClientProfileDiff(
  currentValues: readonly { assumption_key: string; assumption_value: unknown }[],
  incomingValues: readonly NewClientProfileValueInput[],
): ClientProfileDiff {
  const currentByKey = new Map(currentValues.map((v) => [v.assumption_key, v.assumption_value]));
  const incomingByKey = new Map(incomingValues.map((v) => [v.assumptionKey, v.assumptionValue]));

  const added: ClientProfileDiffEntry[] = [];
  const changed: { before: ClientProfileDiffEntry; after: ClientProfileDiffEntry }[] = [];
  const unchanged: ClientProfileDiffEntry[] = [];

  for (const [key, value] of incomingByKey) {
    if (!currentByKey.has(key)) {
      added.push({ assumptionKey: key, assumptionValue: value });
    } else {
      const before = currentByKey.get(key);
      if (JSON.stringify(before) !== JSON.stringify(value)) {
        changed.push({
          before: { assumptionKey: key, assumptionValue: before },
          after: { assumptionKey: key, assumptionValue: value },
        });
      } else {
        unchanged.push({ assumptionKey: key, assumptionValue: value });
      }
    }
  }

  const removed: ClientProfileDiffEntry[] = [];
  for (const [key, value] of currentByKey) {
    if (!incomingByKey.has(key)) removed.push({ assumptionKey: key, assumptionValue: value });
  }

  const byKey = (a: { assumptionKey: string }, b: { assumptionKey: string }) =>
    a.assumptionKey < b.assumptionKey ? -1 : a.assumptionKey > b.assumptionKey ? 1 : 0;

  return {
    added: added.sort(byKey),
    changed: changed.sort((a, b) => byKey(a.after, b.after)),
    unchanged: unchanged.sort(byKey),
    removed: removed.sort(byKey),
  };
}

function toNewClientProfileValueInput(row: ClientPricingProfileCsvRow): NewClientProfileValueInput {
  return { assumptionKey: row.assumptionKey, assumptionValue: row.assumptionValue };
}

export interface ClientProfileImportPreview {
  tenantKey: string;
  currentVersion: number | null;
  parseErrors: RowError[];
  validationErrors: RowError[];
  validRowCount: number;
  diff: ClientProfileDiff;
  valuesToCommit: NewClientProfileValueInput[];
}

export async function previewClientPricingProfileImport(input: {
  tenantKey: string;
  csvText: string;
}): Promise<ClientProfileImportPreview> {
  const parsed = parseClientPricingProfileCsv(input.csvText);
  const validated = validateClientProfileRowsWithinUpload(parsed.rows);

  const currentProfile = await getCurrentClientProfile(input.tenantKey);
  const currentValues = currentProfile ? await listClientProfileValues(currentProfile.id) : [];

  const valuesToCommit = validated.validRows.map(toNewClientProfileValueInput);
  const diff = computeClientProfileDiff(
    currentValues.map((v) => ({ assumption_key: v.assumption_key, assumption_value: v.assumption_value })),
    valuesToCommit,
  );

  return {
    tenantKey: input.tenantKey,
    currentVersion: currentProfile?.profile_version ?? null,
    parseErrors: parsed.errors,
    validationErrors: validated.errors,
    validRowCount: validated.validRows.length,
    diff,
    valuesToCommit,
  };
}

export async function commitClientPricingProfileImport(
  input: {
    tenantKey: string;
    values: readonly NewClientProfileValueInput[];
    approvedBy: string;
    approvalRationale?: string;
  },
  store?: Parameters<typeof createClientProfileVersion>[1],
): Promise<CreateClientProfileVersionResult> {
  return createClientProfileVersion(
    {
      tenantKey: input.tenantKey,
      status: "approved",
      approvedBy: input.approvedBy,
      approvalRationale: input.approvalRationale ?? null,
      values: input.values,
    },
    store,
  );
}

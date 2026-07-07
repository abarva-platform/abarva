export interface VendorInferencePricingTier {
  thresholdCallsPerMonth: number;
  perCallUsd: number;
}

export interface VendorInferenceEconomics {
  perCallUsd: number | null;
  pricingTierLadder: VendorInferencePricingTier[];
  repricingClauseText: string | null;
  repricingNoticeDays: number | null;
  volumeLockExpiresOn: string | null;
  contractCeilingUsdPerYear: number | null;
  asOf: string;
}

export interface ClientVendorInferenceEconomics {
  clientId: string;
  vendorId: string;
  vendorName: string;
  inferenceEconomics: VendorInferenceEconomics;
  sourceBasis: string;
}

const AS_OF = '2026-05-31';

const unknownInferenceEconomics: VendorInferenceEconomics = {
  perCallUsd: null,
  pricingTierLadder: [],
  repricingClauseText: null,
  repricingNoticeDays: null,
  volumeLockExpiresOn: null,
  contractCeilingUsdPerYear: null,
  asOf: AS_OF,
};

export const SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS = [
  {
    clientId: 'apex-retail',
    vendorId: 'vendor:apex:adobe',
    vendorName: 'Adobe',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/apex-retail-synthetic-v1/04-vendors/vendor-scorecards-2026q1.csv',
  },
  {
    clientId: 'apex-retail',
    vendorId: 'vendor:apex:aws',
    vendorName: 'AWS',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/apex-retail-synthetic-v1/04-vendors/vendor-scorecards-2026q1.csv',
  },
  {
    clientId: 'apex-retail',
    vendorId: 'vendor:apex:ibm-sterling-oms',
    vendorName: 'IBM Sterling OMS',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/apex-retail-synthetic-v1/04-vendors/vendor-scorecards-2026q1.csv',
  },
  {
    clientId: 'meridian-health',
    vendorId: 'vendor:meridian:nuance-microsoft',
    vendorName: 'Nuance/Microsoft',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/meridian-health-synthetic-v1/04-vendors/vendor-scorecards.csv',
  },
  {
    clientId: 'meridian-health',
    vendorId: 'vendor:meridian:aws',
    vendorName: 'AWS',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/meridian-health-synthetic-v1/04-vendors/vendor-scorecards.csv',
  },
  {
    clientId: 'skyharbor-air',
    vendorId: 'SHA-VEND-001',
    vendorName: 'IBM',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/skyharbor-air-synthetic-v1/09-vendors-contracts/vendor-contracts.csv',
  },
  {
    clientId: 'skyharbor-air',
    vendorId: 'SHA-VEND-002',
    vendorName: 'AWS',
    inferenceEconomics: unknownInferenceEconomics,
    sourceBasis: 'datasets/skyharbor-air-synthetic-v1/09-vendors-contracts/vendor-contracts.csv',
  },
] as const satisfies ReadonlyArray<ClientVendorInferenceEconomics>;

function normalizeVendorKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const VENDOR_ALIASES: ReadonlyMap<string, ClientVendorInferenceEconomics> = (() => {
  const entries: Array<[string, ClientVendorInferenceEconomics]> = [];
  for (const row of SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS) {
    entries.push([normalizeVendorKey(row.vendorId), row]);
    entries.push([normalizeVendorKey(row.vendorName), row]);
    entries.push([normalizeVendorKey(`${row.clientId}:${row.vendorName}`), row]);
  }
  entries.push(['nuance-dax', SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS[3]]);
  entries.push(['dax-copilot', SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS[3]]);
  entries.push(['adobe-cdp', SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS[0]]);
  entries.push(['ibm-mainframe', SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS[5]]);
  return new Map(entries);
})();

export function normalizeVendorEconomicsKey(value: string): string {
  return normalizeVendorKey(value);
}

export function getInferenceEconomicsForVendor(
  vendorIdOrName: string,
): VendorInferenceEconomics | null {
  const match = VENDOR_ALIASES.get(normalizeVendorKey(vendorIdOrName));
  return match?.inferenceEconomics ?? null;
}

export function getInferenceEconomicsForClientVendor(
  clientId: string,
  vendorIdOrName: string,
): VendorInferenceEconomics | null {
  const clientKey = normalizeVendorKey(`${clientId}:${vendorIdOrName}`);
  const scoped = VENDOR_ALIASES.get(clientKey);
  if (scoped) return scoped.inferenceEconomics;

  const unscoped = VENDOR_ALIASES.get(normalizeVendorKey(vendorIdOrName));
  return unscoped?.clientId === clientId ? unscoped.inferenceEconomics : null;
}

export function listInferenceEconomicsForClient(
  clientId: string,
): ClientVendorInferenceEconomics[] {
  return SIGNATURE_CLIENT_VENDOR_INFERENCE_ECONOMICS.filter((row) =>
    row.clientId === clientId);
}

import { normalizeSetupAiInitiativeTenantKey } from "./ai-initiatives";

export interface SetupAiInitiativesPrivatePlane {
  tenantKey: string;
  privateSchema: string;
  initiativeTable: "setup_ai_initiatives";
  uploadBatchTable: "setup_ai_initiative_upload_batches";
  auditEventTable: "setup_ai_initiative_audit_events";
}

const PLANES: Record<string, SetupAiInitiativesPrivatePlane> = {
  "apex-retail": {
    tenantKey: "apex-retail",
    privateSchema: "client_apex_retail_private",
    initiativeTable: "setup_ai_initiatives",
    uploadBatchTable: "setup_ai_initiative_upload_batches",
    auditEventTable: "setup_ai_initiative_audit_events",
  },
  "meridian-health": {
    tenantKey: "meridian-health",
    privateSchema: "client_meridian_health_private",
    initiativeTable: "setup_ai_initiatives",
    uploadBatchTable: "setup_ai_initiative_upload_batches",
    auditEventTable: "setup_ai_initiative_audit_events",
  },
  "first-capital": {
    tenantKey: "first-capital",
    privateSchema: "client_first_capital_private",
    initiativeTable: "setup_ai_initiatives",
    uploadBatchTable: "setup_ai_initiative_upload_batches",
    auditEventTable: "setup_ai_initiative_audit_events",
  },
} as const;

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function getSetupAiInitiativesPrivatePlane(
  tenantKey: string | null | undefined,
): SetupAiInitiativesPrivatePlane | null {
  if (!tenantKey) return null;
  return PLANES[normalizeSetupAiInitiativeTenantKey(tenantKey)] ?? null;
}

export function listSetupAiInitiativesPrivatePlanes(): readonly SetupAiInitiativesPrivatePlane[] {
  return Object.values(PLANES);
}

export function quoteSetupAiInitiativesIdentifier(identifier: string): string {
  if (!IDENTIFIER_RE.test(identifier))
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  return `"${identifier}"`;
}

export function setupAiInitiativesTableRef(
  plane: SetupAiInitiativesPrivatePlane,
  table:
    | SetupAiInitiativesPrivatePlane["initiativeTable"]
    | SetupAiInitiativesPrivatePlane["uploadBatchTable"]
    | SetupAiInitiativesPrivatePlane["auditEventTable"],
): string {
  return `${quoteSetupAiInitiativesIdentifier(plane.privateSchema)}.${quoteSetupAiInitiativesIdentifier(table)}`;
}

import { createHash } from "node:crypto";
import Papa from "papaparse";

const LAB_TENANT = "meridian-health";
const CONFIRMATION = "APPLY_NDA_LAB_CONTACTS";
const columns = ["vendor_id", "legal_name", "contact_id", "display_name", "email",
  "contact_policy", "contact_state", "source_system", "source_record_id",
  "evidence_reference", "as_of_date"];
const suppliers = [
  ["SYN-SUP-AMS-001", "Fictional Aster Ridge Managed Services LLC"],
  ["SYN-SUP-AMS-002", "Fictional Harborline Application Operations Inc."],
  ["SYN-SUP-AMS-003", "Fictional Linden Vale Endpoint Services LLC"],
  ["SYN-SUP-AMS-004", "Fictional Westhaven Infrastructure Operations Inc."],
] as const;

type ContactCsvRow = Record<(typeof columns)[number], string>;

export const ndaLabContactInputPath =
  "datasets/source/source-nda-lab-contacts-v1/contacts.csv";

export type NdaLabContact = {
  vendorId: string;
  legalName: string;
  contactId: string;
  displayName: string;
  email: string;
  contactPolicy: "contact_allowed";
  contactState: "active";
  sourceSystem: string;
  sourceRecordId: string;
  evidenceReference: string;
  asOfDate: string;
};

export type NdaLabContactPlan = {
  tenantKey: string;
  inputSha256: string;
  inputSourceVersion: string;
  contacts: NdaLabContact[];
  authority: {
    syntheticLabOnly: true;
    contactApprovalsWritten: false;
    suppliersContacted: false;
    emailsSent: false;
  };
};

export function buildNdaLabContactPlan(input: {
  csvText: string;
  tenantKey: string;
  inputSourceVersion: string;
  expectedSha256: string;
}): NdaLabContactPlan {
  if (input.tenantKey !== LAB_TENANT) throw new Error("lab_tenant_only");
  if (input.inputSourceVersion !== "v1") throw new Error("unexpected_input_version");
  const inputSha256 = createHash("sha256").update(input.csvText).digest("hex");
  if (!/^[a-f0-9]{64}$/.test(input.expectedSha256) || input.expectedSha256 !== inputSha256) {
    throw new Error("input_sha256_mismatch");
  }
  const parsed = Papa.parse<ContactCsvRow>(input.csvText, {
    header: true, skipEmptyLines: true, transform: (value) => value.trim(),
  });
  if (parsed.errors.length || JSON.stringify(parsed.meta.fields) !== JSON.stringify(columns) ||
      parsed.data.length !== suppliers.length) throw new Error("invalid_contact_fixture_shape");
  const contacts = parsed.data.map((row, index): NdaLabContact => {
    const [vendorId, legalName] = suppliers[index]!;
    if (row.vendor_id !== vendorId || row.legal_name !== legalName) {
      throw new Error("unexpected_supplier_identity");
    }
    const n = index + 1;
    if (row.email !== `signer-${n}@nda.example`) throw new Error("synthetic_email_required");
    if (row.contact_id !== `SYN-NDA-SIGNER-${String(n).padStart(3, "0")}` ||
        row.display_name !== `Fictional NDA Test Signer ${n}` ||
        row.contact_policy !== "contact_allowed" || row.contact_state !== "active" ||
        row.source_system !== "synthetic_lab_nda_test_signers" ||
        row.source_record_id !== `SYN-NDA-TEST-${n}` ||
        row.evidence_reference !== `source-nda-lab-contacts-v1:row-${n}` ||
        !/^\d{4}-\d{2}-\d{2}$/.test(row.as_of_date) ||
        !Number.isFinite(Date.parse(`${row.as_of_date}T00:00:00Z`))) {
      throw new Error("invalid_synthetic_contact_authority");
    }
    return {
      vendorId, legalName, contactId: row.contact_id,
      displayName: row.display_name, email: row.email,
      contactPolicy: "contact_allowed", contactState: "active",
      sourceSystem: row.source_system, sourceRecordId: row.source_record_id,
      evidenceReference: row.evidence_reference, asOfDate: row.as_of_date,
    };
  });
  return {
    tenantKey: input.tenantKey, inputSha256, inputSourceVersion: input.inputSourceVersion,
    contacts,
    authority: { syntheticLabOnly: true, contactApprovalsWritten: false,
      suppliersContacted: false, emailsSent: false },
  };
}

type Database = { query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }> };

export async function applyNdaLabContactPlan(plan: NdaLabContactPlan, input: {
  db: Database;
  csvText: string;
  approved: boolean;
  confirmation: string;
  approvalReference: string;
}): Promise<{ inserted: number }> {
  if (plan.tenantKey !== LAB_TENANT || plan.contacts.length !== suppliers.length ||
      !input.approved || input.confirmation !== CONFIRMATION ||
      !input.approvalReference.trim()) throw new Error("apply_not_authorized");
  let verifiedPlan: NdaLabContactPlan;
  try {
    verifiedPlan = buildNdaLabContactPlan({ csvText: input.csvText,
      tenantKey: plan.tenantKey, inputSourceVersion: plan.inputSourceVersion,
      expectedSha256: plan.inputSha256 });
  } catch {
    throw new Error("plan_changed_after_validation");
  }
  if (JSON.stringify(verifiedPlan) !== JSON.stringify(plan)) {
    throw new Error("plan_changed_after_validation");
  }
  const { db } = input;
  await db.query("BEGIN");
  try {
    await db.query("SELECT set_config('app.tenant_key', $1, true)", [plan.tenantKey]);
    let inserted = 0;
    for (const contact of plan.contacts) {
      const vendor = await db.query(
        `SELECT legal_name, active_state FROM source.vendor
         WHERE tenant_key = $1 AND vendor_id = $2 FOR SHARE`,
        [plan.tenantKey, contact.vendorId],
      );
      const canonical = vendor.rows[0] as { legal_name?: string; active_state?: string } | undefined;
      if (vendor.rows.length !== 1 || canonical?.legal_name !== contact.legalName ||
          canonical.active_state !== "active") throw new Error("canonical_supplier_mismatch");
      const result = await db.query(
        `INSERT INTO source.vendor_contact
           (tenant_key, vendor_id, contact_id, display_name, email, contact_policy,
            contact_state, source_system, source_record_id, evidence_reference, as_of_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date)
         ON CONFLICT (tenant_key, vendor_id, contact_id) DO NOTHING RETURNING id`,
        [plan.tenantKey, contact.vendorId, contact.contactId, contact.displayName,
          contact.email, contact.contactPolicy, contact.contactState, contact.sourceSystem,
          contact.sourceRecordId, contact.evidenceReference, contact.asOfDate],
      );
      if (result.rows.length === 1) {
        inserted++;
        continue;
      }
      const existing = await db.query(
        `SELECT display_name, email, contact_policy, contact_state, source_system,
                source_record_id, evidence_reference, as_of_date::text AS as_of_date
         FROM source.vendor_contact
         WHERE tenant_key = $1 AND vendor_id = $2 AND contact_id = $3 FOR UPDATE`,
        [plan.tenantKey, contact.vendorId, contact.contactId],
      );
      const row = existing.rows[0] as Record<string, string> | undefined;
      if (existing.rows.length !== 1 || !row ||
          row.display_name !== contact.displayName || row.email !== contact.email ||
          row.contact_policy !== contact.contactPolicy || row.contact_state !== contact.contactState ||
          row.source_system !== contact.sourceSystem || row.source_record_id !== contact.sourceRecordId ||
          row.evidence_reference !== contact.evidenceReference || row.as_of_date !== contact.asOfDate) {
        throw new Error("conflicting_canonical_contact");
      }
    }
    await db.query("COMMIT");
    return { inserted };
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

import { createHash } from "node:crypto";
import { buildNdaLabContactPlan, applyNdaLabContactPlan } from "../load-nda-lab-contacts";
import { assertNdaLabContactLoadApproval, parseNdaLabContactJobArgs } from "../nda-lab-contact-job";

const header = "vendor_id,legal_name,contact_id,display_name,email,contact_policy,contact_state,source_system,source_record_id,evidence_reference,as_of_date";
const rows = [
  ["SYN-SUP-AMS-001", "Fictional Aster Ridge Managed Services LLC", "SYN-NDA-SIGNER-001", "Fictional NDA Test Signer 1", "signer-1@nda.example"],
  ["SYN-SUP-AMS-002", "Fictional Harborline Application Operations Inc.", "SYN-NDA-SIGNER-002", "Fictional NDA Test Signer 2", "signer-2@nda.example"],
  ["SYN-SUP-AMS-003", "Fictional Linden Vale Endpoint Services LLC", "SYN-NDA-SIGNER-003", "Fictional NDA Test Signer 3", "signer-3@nda.example"],
  ["SYN-SUP-AMS-004", "Fictional Westhaven Infrastructure Operations Inc.", "SYN-NDA-SIGNER-004", "Fictional NDA Test Signer 4", "signer-4@nda.example"],
].map(([vendorId, legalName, contactId, displayName, email], index) =>
  [vendorId, legalName, contactId, displayName, email, "contact_allowed", "active",
    "synthetic_lab_nda_test_signers", `SYN-NDA-TEST-${index + 1}`,
    `source-nda-lab-contacts-v1:row-${index + 1}`, "2026-10-04"].join(","));
const csvText = `${header}\n${rows.join("\n")}\n`;
const hash = createHash("sha256").update(csvText).digest("hex");
const build = (text = csvText, tenantKey = "meridian-health", expectedSha256 = hash) =>
  buildNdaLabContactPlan({ csvText: text, tenantKey, inputSourceVersion: "v1", expectedSha256 });

describe("synthetic NDA contact intake", () => {
  it("plans only four declared fictional lab signers and never a supplier-domain delivery", () => {
    const plan = build();
    expect(plan.tenantKey).toBe("meridian-health");
    expect(plan.inputSha256).toBe(hash);
    expect(plan.contacts.map((row) => row.vendorId)).toEqual([
      "SYN-SUP-AMS-001", "SYN-SUP-AMS-002", "SYN-SUP-AMS-003", "SYN-SUP-AMS-004",
    ]);
    expect(plan.contacts.every((row) => row.email.endsWith("@nda.example") &&
      row.displayName.startsWith("Fictional NDA Test Signer "))).toBe(true);
    expect(plan.authority).toEqual({ syntheticLabOnly: true, contactApprovalsWritten: false,
      suppliersContacted: false, emailsSent: false });
  });

  it("rejects another tenant, changed bytes, non-fictional email and do-not-contact supplier", () => {
    expect(() => build(csvText, "another-tenant")).toThrow("lab_tenant_only");
    expect(() => build(`${csvText} `)).toThrow("input_sha256_mismatch");
    const realDomain = csvText.replace("signer-1@nda.example", "signer-1@supplier.test");
    expect(() => build(realDomain, "meridian-health", createHash("sha256").update(realDomain).digest("hex")))
      .toThrow("synthetic_email_required");
    const prohibited = csvText.replace("SYN-SUP-AMS-004", "SYN-SUP-AMS-005");
    expect(() => build(prohibited, "meridian-health", createHash("sha256").update(prohibited).digest("hex")))
      .toThrow("unexpected_supplier_identity");
  });

  it("refuses apply without a named approval or with a conflicting canonical contact", async () => {
    const query = jest.fn(async (_sql: string, _values?: unknown[]) => ({ rows: [] as unknown[] }));
    const db = { query };
    await expect(applyNdaLabContactPlan(build(), { db, csvText, approved: false, confirmation: "APPLY_NDA_LAB_CONTACTS", approvalReference: "SYN-NDA-CONTACT-REVIEW" }))
      .rejects.toThrow("apply_not_authorized");
    expect(query).not.toHaveBeenCalled();
    query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    query.mockResolvedValueOnce({ rows: [] }); // set_config
    query.mockResolvedValueOnce({ rows: [{ legal_name: "Other entity", active_state: "active" }] });
    query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK
    await expect(applyNdaLabContactPlan(build(), { db, csvText, approved: true, confirmation: "APPLY_NDA_LAB_CONTACTS", approvalReference: "SYN-NDA-CONTACT-REVIEW" }))
      .rejects.toThrow("canonical_supplier_mismatch");
    expect(query.mock.calls.some(([sql]) => String(sql).includes("ROLLBACK"))).toBe(true);
  });

  it("refuses a post-plan edit before opening a transaction", async () => {
    const plan = build();
    plan.contacts[0]!.email = "someone@external.example";
    const query = jest.fn(async () => ({ rows: [] }));
    await expect(applyNdaLabContactPlan(plan, { db: { query }, csvText, approved: true,
      confirmation: "APPLY_NDA_LAB_CONTACTS", approvalReference: "SYN-NDA-CONTACT-REVIEW" }))
      .rejects.toThrow("plan_changed_after_validation");
    expect(query).not.toHaveBeenCalled();
  });

  it("applies all four only after canonical identity matches, then supports exact replay", async () => {
    let insertCount = 0;
    const query = jest.fn(async (sql: string, values?: unknown[]) => {
      if (sql.includes("FROM source.vendor\n")) {
        if (values?.[0] !== "meridian") return { rows: [] };
        const row = build().contacts.find((contact) => contact.vendorId === values?.[1]);
        return { rows: row ? [{ legal_name: row.legalName, active_state: "active" }] : [] };
      }
      if (sql.includes("INSERT INTO source.vendor_contact")) {
        insertCount++;
        return { rows: insertCount <= 4 ? [{ id: insertCount }] : [] };
      }
      if (sql.includes("FROM source.vendor_contact")) {
        const row = build().contacts.find((contact) => contact.contactId === values?.[2]);
        if (!row) return { rows: [] };
        return { rows: [{ display_name: row.displayName, email: row.email,
          contact_policy: row.contactPolicy, contact_state: row.contactState,
          source_system: row.sourceSystem, source_record_id: row.sourceRecordId,
          evidence_reference: row.evidenceReference, as_of_date: row.asOfDate }] };
      }
      return { rows: [] };
    });
    const args = { db: { query }, csvText, approved: true,
      confirmation: "APPLY_NDA_LAB_CONTACTS", approvalReference: "SYN-NDA-CONTACT-REVIEW" };
    await expect(applyNdaLabContactPlan(build(), args)).resolves.toEqual({ inserted: 4 });
    await expect(applyNdaLabContactPlan(build(), args)).resolves.toEqual({ inserted: 0 });
    expect(query.mock.calls.filter(([sql]) => sql === "COMMIT")).toHaveLength(2);
    expect(query.mock.calls.filter(([sql]) => sql.includes("set_config('app.tenant_key'"))
      .every(([, values]) => values?.[0] === "meridian")).toBe(true);
    expect(query.mock.calls.filter(([sql]) => sql.includes("source.vendor_contact"))
      .every(([, values]) => values?.[0] === "meridian")).toBe(true);
  });

  it("requires an exact operator contract and extra proof target for apply", () => {
    const base = {
      SOURCE_NDA_CONTACT_TENANT_KEY: "meridian-health",
      SOURCE_NDA_CONTACT_INPUT_SOURCE_VERSION: "v1",
      SOURCE_NDA_CONTACT_INPUT_SHA256: hash,
      SOURCE_NDA_CONTACT_RUN_ID: "nda-contact-test-1",
      SOURCE_NDA_CONTACT_IDEMPOTENCY_KEY: "nda-contact-test-v1",
      SOURCE_NDA_CONTACT_BUILD_VERSION: "test-sha",
      SOURCE_NDA_CONTACT_IMAGE_DIGEST: `sha256:${"a".repeat(64)}`,
      SOURCE_NDA_CONTACT_OPERATOR: "test-operator",
    };
    expect(parseNdaLabContactJobArgs({ ...base })).toMatchObject({ apply: false,
      tenantKey: "meridian-health", inputSha256: hash });
    expect(() => parseNdaLabContactJobArgs({ ...base, SOURCE_NDA_CONTACT_TENANT_KEY: "other" }))
      .toThrow("lab_tenant_only");
    expect(() => parseNdaLabContactJobArgs({ ...base, SOURCE_NDA_CONTACT_MODE: "apply" }))
      .toThrow("apply_not_authorized");
    expect(() => parseNdaLabContactJobArgs({ ...base, SOURCE_NDA_CONTACT_MODE: "apply",
      SOURCE_NDA_CONTACT_APPLY_APPROVED: "true", SOURCE_NDA_CONTACT_CONFIRMATION: "APPLY_NDA_LAB_CONTACTS",
      SOURCE_NDA_CONTACT_APPROVAL_REFERENCE: "private-approval-1" }))
      .toThrow("proof_target_required");
  });

  it("requires a named-person manifest load approval bound to the exact source hash", () => {
    const approval = { approved_by: "Jordan Rivera", approved_at: "2026-10-04",
      assessment_id: "nda-contact-assessment-v1", source_set_hash: hash,
      release_record: "docs/releases/records/2026-10-04-source-nda-lab-contact-intake.md" };
    expect(() => assertNdaLabContactLoadApproval({ load_approval: null }, hash, approval.assessment_id))
      .toThrow("manifest_load_approval_required");
    expect(() => assertNdaLabContactLoadApproval({ load_approval: { ...approval, source_set_hash: "a".repeat(64) } }, hash, approval.assessment_id))
      .toThrow("manifest_load_approval_mismatch");
    expect(() => assertNdaLabContactLoadApproval({ load_approval: { ...approval, approved_by: "Release Bot" } }, hash, approval.assessment_id))
      .toThrow("manifest_load_approval_mismatch");
    expect(() => assertNdaLabContactLoadApproval({ load_approval: approval }, hash, approval.assessment_id))
      .not.toThrow();
  });
});

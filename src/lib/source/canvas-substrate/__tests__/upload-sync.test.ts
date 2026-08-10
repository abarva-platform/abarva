// Audit F1/F2 fix proof: an uploaded evidence file durably moves the canvas substrate —
// the evidence-readiness ladder upgrades (never downgrades), the artifact links, and gate
// criteria only auto-meet for ART-* presence checks. Raw evidence no longer masquerades
// as a stage deliverable (which previously could falsely satisfy an ART criterion).
import {
  matchEvidenceRequirementForUpload,
  syncUploadToCanvasSubstrate,
} from "../upload-sync";
import { inferSourceArtifactFamily } from "@/lib/source/artifact-registry/upload-contract";

// ── fake fluent db ──────────────────────────────────────────────────────────
interface Row {
  [k: string]: unknown;
}
function fakeDb(seed: {
  evidence?: Row | null;
  criteria?: Record<string, Row>;
}) {
  const writes: Array<{
    table: string;
    op: string;
    payload: Row;
    filters: Array<[string, unknown]>;
  }> = [];
  const state = {
    evidence: seed.evidence ?? null,
    criteria: seed.criteria ?? {},
  };
  function builder(table: string) {
    const filters: Array<[string, unknown]> = [];
    const b: Record<string, unknown> = {};
    let op = "select";
    let payload: Row = {};
    b.select = () => b;
    b.insert = (p: Row) => {
      op = "insert";
      payload = p;
      return b;
    };
    b.update = (p: Row) => {
      op = "update";
      payload = p;
      return b;
    };
    b.eq = (k: string, v: unknown) => {
      filters.push([k, v]);
      return b;
    };
    b.maybeSingle = async () => {
      if (table === "source_event_evidence_states")
        return { data: state.evidence, error: null };
      const cid = String(filters.find((f) => f[0] === "criterion_id")?.[1]);
      return { data: state.criteria[cid] ?? null, error: null };
    };
    b.then = (onF: (r: { error: null }) => unknown) => {
      writes.push({ table, op, payload, filters });
      return Promise.resolve({ error: null }).then(onF);
    };
    return b;
  }
  return { db: { from: builder } as never, writes };
}

describe("matchEvidenceRequirementForUpload (filename → canonical requirement)", () => {
  it("matches the SkyHarbor audit files to the right Strategy requirements", () => {
    expect(
      matchEvidenceRequirementForUpload({
        stageKey: "strategy",
        filename: "SkyHarbor_Incumbent_AMS_Support_Contract_Baseline.csv",
      })?.requirementId,
    ).toBe("EVID-SRC-STR-INCUMBENT");
    expect(
      matchEvidenceRequirementForUpload({
        stageKey: "strategy",
        filename: "SkyHarbor_Sponsor_Commitment_Memo.txt",
      })?.requirementId,
    ).toBe("EVID-SRC-STR-SPONSOR-COMMIT");
  });

  it('is stage-scoped ("contract" maps differently in scope) and honest on no match', () => {
    expect(
      matchEvidenceRequirementForUpload({
        stageKey: "scope",
        filename: "fy26_support_contract_spend.xlsx",
      })?.requirementId,
    ).toBe("EVID-SRC-SCOPE-FY-CONTRACT");
    expect(
      matchEvidenceRequirementForUpload({
        stageKey: "scope",
        filename: "application_inventory_cmdb.csv",
      })?.requirementId,
    ).toBe("EVID-SRC-SCOPE-APP-INV");
    expect(
      matchEvidenceRequirementForUpload({
        stageKey: "strategy",
        filename: "holiday_photos.png",
      }),
    ).toBeNull();
  });

  it("matches operational extracts across the full sourcing lifecycle", () => {
    const cases = [
      ["rfp", "security_privacy_dpa_controls.xlsx", "EVID-SRC-RFP-SECURITY-PRIVACY"],
      ["responses", "supplier_pricing_rate_card_submission.xlsx", "EVID-SRC-RESP-PRICING-SHEETS"],
      ["evaluation", "tprm_risk_assessment_vendor_scores.csv", "EVID-SRC-EVAL-RISK-ASSESSMENT"],
      ["pricing", "ap_detail_invoice_payment_lines.csv", "EVID-SRC-PRICE-INVOICE-DETAIL"],
      ["bafo", "bafo_offer_concession_register.xlsx", "EVID-SRC-BAFO-OFFERS"],
      ["executive_decision", "value_ledger_benefit_case.xlsx", "EVID-SRC-DEC-VALUE-LEDGER"],
      ["selection", "obligation_deliverable_register.xlsx", "EVID-SRC-SEL-OBLIGATION-REGISTER"],
      ["transition", "transition_readiness_tracker.csv", "EVID-SRC-TRAN-MILESTONES"],
      ["transition", "cmdb_handover_access_assets.csv", "EVID-SRC-TRAN-ASSET-ACCESS"],
      ["value", "finance_confirmation_realized_value.xlsx", "EVID-SRC-VAL-FINANCE-CONFIRMATION"],
    ] as const;

    for (const [stageKey, filename, requirementId] of cases) {
      expect(
        matchEvidenceRequirementForUpload({ stageKey, filename })
          ?.requirementId,
      ).toBe(requirementId);
    }
  });
});

describe("syncUploadToCanvasSubstrate (durable F1 fix)", () => {
  const base = {
    sourceEventRowId: "evt-row-1",
    tenantKey: "skyharbor-air",
    stageKey: "strategy" as const,
    artifactId: "art-1",
    filename: "SkyHarbor_Incumbent_AMS_Support_Contract_Baseline.csv",
    parsed: true,
  };

  it("upgrades Not Requested → Parsed, links the artifact, reports minimum honestly", async () => {
    const { db, writes } = fakeDb({
      evidence: { current_state: "Not Requested" },
    });
    const res = await syncUploadToCanvasSubstrate(
      { ...base, artifactFamily: "other" },
      db,
    );
    expect(res.evidence).toEqual({
      requirementId: "EVID-SRC-STR-INCUMBENT",
      previousState: "Not Requested",
      newState: "Parsed",
      minimumState: "Available",
      meetsMinimum: false, // Parsed < Available — honest: parsed but not yet validated
    });
    const w = writes.find((x) => x.table === "source_event_evidence_states");
    expect(w?.op).toBe("update");
    expect(w?.payload.current_state).toBe("Parsed");
    expect(w?.payload.source_artifact_id).toBe("art-1");
  });

  it("meets minimum when the requirement floor is Loaded", async () => {
    const { db } = fakeDb({ evidence: { current_state: "Not Requested" } });
    const res = await syncUploadToCanvasSubstrate(
      {
        ...base,
        filename: "SkyHarbor_Sponsor_Commitment_Memo.txt",
        artifactFamily: "other",
        parsed: false,
      },
      db,
    );
    expect(res.evidence?.requirementId).toBe("EVID-SRC-STR-SPONSOR-COMMIT");
    expect(res.evidence?.newState).toBe("Loaded");
    expect(res.evidence?.meetsMinimum).toBe(true);
  });

  it("never downgrades a validated state", async () => {
    const { db, writes } = fakeDb({
      evidence: { current_state: "Usable Evidence" },
    });
    const res = await syncUploadToCanvasSubstrate(
      { ...base, artifactFamily: "other" },
      db,
    );
    expect(res.evidence?.newState).toBe("Usable Evidence");
    expect(
      writes.filter((w) => w.table === "source_event_evidence_states"),
    ).toHaveLength(0);
  });

  it("inserts the evidence row when the scaffold row is missing", async () => {
    const { db, writes } = fakeDb({ evidence: null });
    await syncUploadToCanvasSubstrate({ ...base, artifactFamily: "other" }, db);
    const w = writes.find((x) => x.table === "source_event_evidence_states");
    expect(w?.op).toBe("insert");
    expect(w?.payload.requirement_id).toBe("EVID-SRC-STR-INCUMBENT");
    expect(w?.payload.tenant_key).toBe("skyharbor-air");
  });

  it("ART-* presence criteria auto-meet; appends evidence id; dedups", async () => {
    const { db, writes } = fakeDb({
      criteria: {
        "ART-AMS-PLAN-01": {
          state: "pending",
          evidence_artifact_ids: ["old-1"],
        },
      },
    });
    const res = await syncUploadToCanvasSubstrate(
      {
        ...base,
        filename: "SkyHarbor Sourcing Strategy v2.docx",
        artifactFamily: "sourcing_strategy",
      },
      db,
    );
    const crit = res.criteria.find((c) => c.criterionId === "ART-AMS-PLAN-01");
    expect(crit?.autoMet).toBe(true);
    const w = writes.find(
      (x) => x.table === "source_event_gate_criterion_states",
    );
    expect(w?.payload.state).toBe("met");
    expect(w?.payload.evidence_artifact_ids).toEqual(["old-1", "art-1"]);
  });

  it("non-ART (human/HARD) criteria are linked but never auto-met", async () => {
    const { db, writes } = fakeDb({
      criteria: {
        "ART-AMS-PLAN-01": { state: "met", evidence_artifact_ids: [] },
      },
    });
    const res = await syncUploadToCanvasSubstrate(
      {
        ...base,
        filename: "strategy.docx",
        artifactFamily: "sourcing_strategy",
      },
      db,
    );
    // already met → linked, not re-met
    const crit = res.criteria.find((c) => c.criterionId === "ART-AMS-PLAN-01");
    expect(crit?.autoMet).toBe(false);
    const w = writes.find(
      (x) => x.table === "source_event_gate_criterion_states",
    );
    expect(w?.payload.state).toBeUndefined(); // no state change written
    expect(w?.payload.evidence_artifact_ids).toEqual(["art-1"]);
  });
});

describe("inferSourceArtifactFamily (F2 — raw evidence is not a deliverable)", () => {
  it("no longer mislabels the audit files as sourcing_strategy", () => {
    expect(
      inferSourceArtifactFamily({
        stageKey: "strategy",
        filename: "SkyHarbor_Incumbent_AMS_Support_Contract_Baseline.csv",
      }),
    ).toBe("other");
    expect(
      inferSourceArtifactFamily({
        stageKey: "strategy",
        filename: "SkyHarbor_Sponsor_Commitment_Memo.txt",
      }),
    ).toBe("other");
    expect(
      inferSourceArtifactFamily({
        stageKey: "scope",
        filename: "application_inventory_cmdb_export.csv",
      }),
    ).toBe("other");
    expect(
      inferSourceArtifactFamily({
        stageKey: "scope",
        filename: "itsm_ticket_volumes_may.xlsx",
      }),
    ).toBe("other");
  });

  it("keeps real deliverables in their families", () => {
    expect(
      inferSourceArtifactFamily({
        stageKey: "rfp",
        filename: "AMS RFP v1.docx",
      }),
    ).toBe("rfp");
    expect(
      inferSourceArtifactFamily({
        stageKey: "pricing",
        filename: "pricing_workbook.xlsx",
      }),
    ).toBe("pricing_workbook");
    expect(
      inferSourceArtifactFamily({
        stageKey: "strategy",
        filename: "sourcing strategy memo.docx",
      }),
    ).toBe("sourcing_strategy");
    expect(
      inferSourceArtifactFamily({
        stageKey: "evaluation",
        filename: "vendor scorecard.xlsx",
      }),
    ).toBe("scorecard");
  });

  it("stage fallback still applies to unrecognized deliverable-ish names", () => {
    expect(
      inferSourceArtifactFamily({
        stageKey: "responses",
        filename: "acme_reply_final.pdf",
      }),
    ).toBe("proposal");
  });
});

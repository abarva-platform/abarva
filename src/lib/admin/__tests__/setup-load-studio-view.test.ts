import { buildLoadStudioView } from "@/lib/admin/setup-load-studio-view";
import type {
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from "@/lib/admin/setup-acts-registry";

function segment(
  over: Partial<InventorySegmentRollup>,
): InventorySegmentRollup {
  return {
    segmentId: "s1",
    segmentName: "application_portfolio",
    familyNumber: 1,
    recordCount: 120,
    coverageScore: 0.72,
    staleCount: 0,
    missingCount: 0,
    healthState: "complete",
    lastReviewedAt: "2026-05-30T00:00:00Z",
    lastIngestedAt: "2026-05-30T00:00:00Z",
    ...over,
  };
}

function snapshot(
  over: Partial<SetupInventorySnapshot>,
): SetupInventorySnapshot {
  return {
    tenantKey: "apex-retail",
    segments: [segment({})],
    totalRecords: 120,
    totalChunks: 0,
    totalNodes: 0,
    totalEdges: 0,
    recentActivity: [],
    lastIngestedAt: "2026-05-30T00:00:00Z",
    ...over,
  };
}

describe("buildLoadStudioView", () => {
  it("derives every metric from the real snapshot — never fabricated", () => {
    const view = buildLoadStudioView({
      tenantName: "Apex Retail Group",
      vertical: "Retail",
      snapshot: snapshot({
        segments: [
          segment({
            segmentId: "a",
            recordCount: 200,
            coverageScore: 0.9,
            healthState: "complete",
          }),
          segment({
            segmentId: "b",
            segmentName: "vendor_contracts",
            recordCount: 80,
            coverageScore: 0.4,
            healthState: "critical",
          }),
        ],
        totalRecords: 280,
        lastIngestedAt: "2026-05-30T00:00:00Z",
      }),
    });
    expect(view.hasData).toBe(true);
    // committed = 1 (the complete one), total = 2
    expect(view.metrics[1]!.value).toBe("1 / 2");
    // needs attention = 1 (the critical one)
    expect(view.metrics[2]!.value).toBe("1");
    expect(view.metrics[2]!.tone).toBe("risk");
    // records loaded = 280, real
    expect(view.metrics[3]!.value).toBe("280");
    // last loaded = the ingest date, deterministic
    expect(view.metrics[4]!.value).toBe("2026-05-30");
    // identity
    expect(view.tenant.initials).toBe("AG");
    expect(view.tenant.breadcrumb).toBe(
      "Admin / Data Loads / Apex Retail Group",
    );
  });

  it("sorts readiness by record weight and maps health to calm status", () => {
    const view = buildLoadStudioView({
      tenantName: "Apex Retail Group",
      vertical: "Retail",
      snapshot: snapshot({
        segments: [
          segment({
            segmentId: "small",
            recordCount: 10,
            healthState: "sparse",
          }),
          segment({
            segmentId: "big",
            recordCount: 500,
            healthState: "complete",
          }),
        ],
      }),
    });
    expect(view.readiness[0]!.segmentId).toBe("big");
    expect(view.readiness[0]!.statusLabel).toBe("Committed");
    expect(view.readiness[0]!.statusTone).toBe("ready");
    expect(view.readiness[1]!.statusLabel).toBe("Needs attention");
    expect(view.readiness[1]!.statusTone).toBe("attention");
  });

  it("surfaces a blocked dimension as the single next action, routing to upload", () => {
    const view = buildLoadStudioView({
      tenantName: "Apex Retail Group",
      vertical: "Retail",
      snapshot: snapshot({
        segments: [
          segment({
            segmentId: "ok",
            recordCount: 100,
            healthState: "complete",
          }),
          segment({
            segmentId: "blk",
            segmentName: "erp_landscape",
            recordCount: 0,
            healthState: "not_started",
          }),
        ],
      }),
    });
    expect(view.nextAction).not.toBeNull();
    expect(view.nextAction!.headline).toContain("Erp landscape");
    expect(view.nextAction!.action!.href).toBe("/admin/context-layer/uploads");
    // a not-started segment with zero records shows no fabricated percent
    const blocked = view.readiness.find((r) => r.segmentId === "blk")!;
    expect(blocked.completePercent).toBeNull();
    // workflow rail pauses at Validate when something needs attention
    const validate = view.workflow.find((s) => s.name === "Validate")!;
    expect(validate.state).toBe("active");
  });

  it("renders the audit trail from real recent activity", () => {
    const view = buildLoadStudioView({
      tenantName: "Apex Retail Group",
      vertical: "Retail",
      snapshot: snapshot({
        recentActivity: [
          {
            actor: "Carlos Rivera",
            what: "Committed vendor contracts",
            timestampIso: "2026-05-30T10:00:00Z",
          },
          {
            actor: "Import pipeline",
            what: "Scanned application portfolio",
            timestampIso: "2026-05-29T10:00:00Z",
          },
        ],
      }),
    });
    expect(view.ledger).toHaveLength(2);
    expect(view.ledger[0]!.what).toBe("Committed vendor contracts");
    expect(view.ledger[0]!.who).toBe("Carlos Rivera");
    expect(view.ledger[0]!.when).toBe("2026-05-30");
  });

  it("returns honest empty states when the tenant has loaded nothing", () => {
    const view = buildLoadStudioView({
      tenantName: "SkyHarbor Air",
      vertical: "Airline",
      snapshot: null,
    });
    expect(view.hasData).toBe(false);
    expect(view.readiness).toHaveLength(0);
    expect(view.ledger).toHaveLength(0);
    // never a fabricated number
    expect(view.metrics[0]!.value).toBe("—");
    expect(view.metrics[3]!.value).toBe("—");
    expect(view.metrics[4]!.value).toBe("—");
    // first-load guidance, routing into the upload workflow
    expect(view.nextAction!.headline).toContain("first governed load");
    expect(view.nextAction!.action!.href).toBe("/admin/context-layer/uploads");
    // workflow rail waits at Upload
    const upload = view.workflow.find((s) => s.name === "Upload")!;
    expect(upload.state).toBe("active");
  });

  it("makes the pilot no-bypass data-load rule visible in the operator controls", () => {
    const view = buildLoadStudioView({
      tenantName: "SkyHarbor Air",
      vertical: "Airline",
      snapshot: null,
    });

    const pilotRule = view.controls.find(
      (control) => control.label === "Pilot data rule",
    );
    expect(pilotRule).toEqual({
      label: "Pilot data rule",
      headline: "No bypass loads",
      detail:
        "New client data enters through this governed load workflow. If a dimension is missing, add the loader path before ingesting it.",
      tone: "attention",
      action: {
        label: "Start a governed load",
        href: "/admin/context-layer/uploads",
      },
    });
  });

  it("exposes a registry-backed template guide with honest format paths", () => {
    const view = buildLoadStudioView({
      tenantName: "SkyHarbor Air",
      vertical: "Airline",
      snapshot: null,
    });

    expect(view.templateGuide.headline).toBe("Load a new client file");
    expect(view.templateGuide.allTemplatesAction.href).toBe(
      "/admin/context-layer/templates",
    );
    expect(view.templateGuide.uploadAction.href).toBe(
      "/admin/context-layer/uploads",
    );
    expect(view.templateGuide.formatSupport).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          format: "CSV",
          path: "live",
          note: expect.stringContaining("loaded from this workflow today"),
        }),
        expect.objectContaining({
          format: "XLSX",
          path: "controlled",
          note: expect.stringContaining("controlled intake"),
        }),
        expect.objectContaining({
          format: "PDF",
          path: "controlled",
          note: expect.stringContaining("evidence or exception intake"),
        }),
        expect.objectContaining({
          format: "PPTX",
          path: "controlled",
        }),
        expect.objectContaining({
          format: "DOCX",
          path: "controlled",
        }),
      ]),
    );

    expect(view.templateGuide.starterTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "org-roles",
          label: "Org, roles, and teams",
          formats: expect.arrayContaining(["CSV", "XLSX", "JSON"]),
          action: {
            label: "Upload",
            href: "/admin/context-layer/uploads?template=org-roles",
          },
        }),
        expect.objectContaining({
          id: "integration-topology",
          label: "Integration topology",
          formats: expect.arrayContaining(["CSV", "JSON", "JSONL"]),
          action: {
            label: "Upload",
            href: "/admin/context-layer/uploads?template=integration-topology",
          },
        }),
        expect.objectContaining({
          id: "annual-quarterly-reports",
          formats: expect.arrayContaining(["PDF", "PPTX", "DOCX"]),
          action: {
            label: "View intake details",
            href: "/admin/context-layer/templates",
          },
        }),
      ]),
    );
  });

  it("surfaces AI setup approval and anomaly triage guardrails", () => {
    const view = buildLoadStudioView({
      tenantName: "SkyHarbor Air",
      vertical: "Airline",
      snapshot: null,
    });

    const setupSuggestions = view.controls.find(
      (control) => control.label === "AI setup suggestions",
    );
    const anomalyTriage = view.controls.find(
      (control) => control.label === "AI anomaly triage",
    );

    expect(setupSuggestions).toMatchObject({
      headline: "Admin approval required",
      detail:
        "AI-suggested tenant configuration changes cannot apply until an admin approves them and records a reason.",
      action: { href: "/admin/context-layer/approval-queue" },
    });
    expect(anomalyTriage).toMatchObject({
      headline: "No silent remediation",
      detail:
        "AI-detected setup anomalies require human triage acknowledgement before any remediation is applied.",
      action: { href: "/admin/context-layer/approval-queue" },
    });
  });

  it("keeps implementation jargon out of every operator-facing string", () => {
    const view = buildLoadStudioView({
      tenantName: "Apex Retail Group",
      vertical: "Retail",
      snapshot: snapshot({}),
    });
    const blob = JSON.stringify(view).toLowerCase();
    for (const banned of [
      "azure",
      "postgres",
      "landing-zone",
      "landing zone",
      "idempotency",
      "substrate",
      "tenant-keyed",
      "npm run verify",
      "t357",
    ]) {
      expect(blob).not.toContain(banned);
    }
    // all action routes are real product surfaces, never /admin/setup self-loops
    const hrefs = [
      ...view.controls.map((c) => c.action.href),
      ...view.readiness.map((r) => r.action.href),
      view.templatesHref,
      view.startLoadHref,
    ];
    for (const href of hrefs) {
      expect(href).not.toContain("/admin/setup");
    }
  });
});

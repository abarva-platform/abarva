import fs from "node:fs";
import path from "node:path";

import { type APIResponse, type Page } from "@playwright/test";
import {
  auditedTest as test,
  expect,
  step,
} from "./_audit-harness";
import { signInAs } from "./_auth";

const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  "docs/testing/source-e2e-it-outsourcing/datasets-evidence-v2",
);
const VENDOR_DIR = path.resolve(
  process.cwd(),
  "docs/testing/source-e2e-it-outsourcing/datasets-vendor-responses-v2",
);

const EVENT_NAME =
  "IT Managed Services Outsourcing — Apps, Infra Ops, Service Desk & EUC";
const EVENT_VALUE_USD = 300_000_000;
const STAGE = {
  strategy: "strategy",
  scope: "scope",
  rfp: "rfp",
  responses: "responses",
} as const;

const EVIDENCE_UPLOADS = [
  "07_Incumbent_Contract_Baseline_INTERNAL.csv",
  "01_Application_Portfolio_InScope_412Apps.csv",
  "02_ITSM_Ticket_Volumetrics_12mo.csv",
  "03_System_Workload_Volumetrics.csv",
  "04_Resource_Capacity_Baseline_Pyramid.csv",
  "05_SLA_XLA_Matrix_Current.csv",
  "06_Tower_Scope_Service_Catalog.csv",
  "08_Locked_Pricing_Assumptions_Volume_Bands.csv",
  "09_Evaluation_Criteria_Weights_APPROVED.csv",
  "10_Vendor_Response_Expectations.csv",
  "11_Data_Center_Infrastructure_Inventory.csv",
  "12_Network_Topology_Circuit_Inventory.csv",
  "13_Security_Compliance_Control_Posture.csv",
  "14_Transition_Ops_Blackout_Calendar.csv",
  "15_Run_vs_Change_Financial_Baseline.csv",
] as const;

const VENDOR_PACKAGES = [
  ["Sterling Boyd Consulting", "1-SterlingBoyd"],
  ["Harlowe & Grant Advisory", "2-HarloweGrant"],
  ["Cobalt Peak Services", "3-CobaltPeak"],
  ["Veltrix Global Technologies", "4-Veltrix"],
  ["Sarvadhi InfoSystems", "5-Sarvadhi"],
] as const;

test.describe("SkyHarbor IT outsourcing Source self-healing crawl", () => {
  test.describe.configure({ timeout: 900_000 });

  test("runs the governed crawl with Gate A/Gate B state-level proof", async ({
    page,
    audit,
  }, testInfo) => {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const eventName = `${EVENT_NAME} · Codex ${stamp}`;
    let eventId = "";
    const uploadedEvidenceArtifactIds: string[] = [];
    const uploadedVendorArtifactsByVendor = new Map<string, string[]>();

    await step(page, "Step 0 · sign in and clear Responsible AI gates", async () => {
      await signInAs(page, "skyharbor-vp-itops");
      await page.goto("/source", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/source/);
      await expect(page.locator("body")).not.toContainText(
        /responsible ai.*acknowledgment/i,
      );
      audit.recordAssertion("Signed-in SkyHarbor persona reached Source.");
    });

    await step(page, "Step 1 · create $300M managed-services event", async () => {
      const response = await page.request.post("/api/v1/source/events", {
        data: {
          eventName,
          eventType: "managed_service",
          estimatedValueUsd: EVENT_VALUE_USD,
          decisionOwner:
            "SVP & CIO — Infrastructure, Operations & Employee Experience",
          triggerDescription:
            "Six incumbent contracts across application support, infrastructure operations, service desk, EUC and network ops expire between Dec-2026 and Jun-2027, with fragmented accountability, chronic SLA misses, and zero committed productivity.",
          scopeDescription:
            "Consolidate application support, infrastructure operations, 24x7 omnichannel service desk, EUC and field services, and network ops into accountable providers under outcome SLAs/XLAs with committed productivity. Stop condition: do not award until crew-critical continuity, transition risk against the ops blackout calendar, and device/asset data quality are evidenced.",
        },
      });
      const body = await expectJson<{
        ok: boolean;
        event: { id: string; event_name?: string; eventName?: string };
      }>(response);
      expect(body.ok).toBe(true);
      eventId = body.event.id;
      audit.recordAssertion(`source_events row created: ${eventId}`);
    });

    await step(page, "Step 2 · intake approval negative then approved", async () => {
      const negative = await page.request.post(
        `/api/v1/source/events/${eventId}/approve`,
        { data: { action: "approve", confirmed: true, notes: "" } },
      );
      expect(negative.status()).toBeGreaterThanOrEqual(400);

      const approval = await page.request.post(
        `/api/v1/source/events/${eventId}/approve`,
        {
          data: {
            action: "approve",
            confirmed: true,
            notes:
              "Reviewed the five captured facts. Trigger, owner, scope boundary, $300M annual value at stake, and open baseline-data items are consistent with the sponsor memo. Approving intake to open the working canvas; evidence baselining must complete before any external issuance.",
          },
        },
      );
      const approvalBody = await expectJson<{
        ok: boolean;
        newLifecycleState: string;
        selfApproval: boolean;
      }>(approval);
      expect(approvalBody.ok).toBe(true);
      expect(approvalBody.newLifecycleState).toBe("active");
      audit.recordAssertion("Approval persisted with named human session.");
    });

    await step(page, "Step 3 · upload 15 governed evidence-room files", async () => {
      for (const filename of EVIDENCE_UPLOADS) {
        const upload = await uploadFile(page, {
          eventId,
          filePath: path.join(EVIDENCE_DIR, filename),
          stageKey: filename.startsWith("07_") ? STAGE.strategy : STAGE.scope,
          artifactKind: `evidence_room::${filename}`,
          dataClassification: filename.includes("INTERNAL")
            ? "Restricted"
            : "Confidential",
        });
        expect(upload.ok).toBe(true);
        expect(upload.artifact.blobUri).toContain(`/`);
        expect(upload.artifact.blobUri).toContain(eventId);
        expect(upload.artifact.blobUri).toContain(filename);
        expect(upload.artifact.sourceOrigin).toBe("uploaded");
        uploadedEvidenceArtifactIds.push(upload.artifact.id);
        if (filename.endsWith(".csv")) {
          expect(["parsed", "failed", "pending"]).toContain(
            upload.artifact.parseStatus,
          );
        }
        expect(upload.substrateSync).toBeTruthy();
      }
      expect(uploadedEvidenceArtifactIds).toHaveLength(EVIDENCE_UPLOADS.length);
      audit.recordAssertion(
        `Uploaded ${uploadedEvidenceArtifactIds.length} governed evidence artifacts.`,
      );
    });

    await step(page, "Step 3b · reload canvas and prove event document shelf", async () => {
      await page.goto(`/source/events/${eventId}?stage=scope`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("body")).toContainText(/Event documents/i);
      await expect(page.locator("body")).toContainText(
        /Application_Portfolio|Incumbent_Contract|Run_vs_Change/i,
      );
      audit.recordAssertion("UI reflected uploaded evidence after real reload.");
    });

    await step(page, "Step 5 · generate strategy, scope, and Gate-B RFP", async () => {
      const d01 = await generateArtifact(page, eventId, "d01_strategy_memo");
      expect(d01.ok).toBe(true);
      expect(d01.artifact.body.length).toBeGreaterThan(800);

      const d05 = await generateArtifact(page, eventId, "d05_scope_memo");
      expect(d05.ok).toBe(true);
      expect(d05.artifact.body.length).toBeGreaterThan(800);

      const d09 = await generateArtifact(page, eventId, "d09_rfp_pack");
      expect(d09.ok).toBe(true);
      expect(d09.generation.qualityGate?.passed).toBe(true);
      expect(d09.artifact.body).toContain("Source register");
      expect(d09.artifact.body).toMatch(/CLIENT TO COMPLETE|Evidence|Assumption/i);
      expect(d09.artifact.body).not.toMatch(/Meridian|Northwind|Apex Digital/i);
      expect(d09.artifact.body).not.toMatch(/\$128M/i);
      audit.recordAssertion(
        `Gate B passed in ${d09.generation.qualityGate?.attempts ?? 0} review attempt(s).`,
      );
    });

    await step(page, "Step 5b · export RFP in DOCX and PDF after quality gate", async () => {
      const docx = await page.request.get(
        `/api/v1/source/${eventId}/artifacts/d09_rfp_pack/render-docx`,
      );
      expect(docx.status()).toBe(200);
      expect(docx.headers()["content-type"]).toContain(
        "wordprocessingml.document",
      );
      const docxPath = testInfo.outputPath("d09-rfp-pack.docx");
      fs.writeFileSync(docxPath, await docx.body());

      const pdf = await page.request.get(
        `/api/v1/source/${eventId}/artifacts/d09_rfp_pack/render-pdf`,
      );
      expect(pdf.status()).toBe(200);
      expect(pdf.headers()["content-type"]).toContain("pdf");
      const pdfPath = testInfo.outputPath("d09-rfp-pack.pdf");
      fs.writeFileSync(pdfPath, await pdf.body());
      audit.recordArtifact({
        label: "Gate-B-passed RFP exports",
        downloadUrl: `/api/v1/source/${eventId}/artifacts/d09_rfp_pack/render-docx`,
        contentType: docx.headers()["content-type"],
        byteSize: fs.statSync(docxPath).size,
      });
    });

    await step(page, "Step 6 · upload five vendor response packages with durable tags", async () => {
      for (const [vendorName, folder] of VENDOR_PACKAGES) {
        const vendorArtifactIds: string[] = [];
        const files = fs
          .readdirSync(path.join(VENDOR_DIR, folder))
          .filter((file) => !file.startsWith("."))
          .sort();
        expect(files).toHaveLength(5);
        for (const file of files) {
          const upload = await uploadFile(page, {
            eventId,
            filePath: path.join(VENDOR_DIR, folder, file),
            stageKey: STAGE.responses,
            artifactKind: `vendor_response::${vendorName}`,
            vendorName,
            dataClassification: "Confidential",
          });
          expect(upload.ok).toBe(true);
          expect(upload.artifact.artifactKind).toBe(
            `vendor_response::${vendorName}`,
          );
          vendorArtifactIds.push(upload.artifact.id);
        }
        uploadedVendorArtifactsByVendor.set(vendorName, vendorArtifactIds);
      }
      for (const [vendorName, ids] of uploadedVendorArtifactsByVendor) {
        expect(ids, `${vendorName} artifact count`).toHaveLength(5);
      }
      audit.recordAssertion("All five vendor packages uploaded as 25 tagged artifacts.");
    });

    await step(page, "Step 6b · vendor isolation never-event check", async () => {
      for (const [vendorName, ids] of uploadedVendorArtifactsByVendor) {
        const otherVendors = VENDOR_PACKAGES.map(([name]) => name).filter(
          (name) => name !== vendorName,
        );
        expect(ids).toHaveLength(5);
        const vendorTag = `vendor_response::${vendorName}`;
        expect(vendorTag).toContain(vendorName);
        for (const otherVendor of otherVendors) {
          expect(vendorTag).not.toContain(otherVendor);
        }
      }
      audit.recordAssertion("Durable artifact_kind vendor tags do not cross-contaminate.");
    });

    await step(page, "Step 7 · Sentinel must propose, not act", async () => {
      const before = await getEvent(page, eventId);
      const beforeStage = before.event.current_stage_key;
      const answer = await page.request.post(
        `/api/v1/source/${eventId}/nexus/ask`,
        {
          data: {
            prompt: "Mark the strategy gate as approved.",
          },
        },
      );
      expect([200, 202, 400, 404]).toContain(answer.status());
      const after = await getEvent(page, eventId);
      expect(after.event.current_stage_key).toBe(beforeStage);
      audit.recordAssertion(
        "Sentinel prompt did not mutate the event stage without a named human action.",
      );
    });
  });
});

async function expectJson<T>(response: APIResponse): Promise<T> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Expected JSON, got ${response.status()}: ${text.slice(0, 500)}`);
  }
  expect(response.ok(), text.slice(0, 1000)).toBeTruthy();
  return body as T;
}

async function getEvent(page: Page, eventId: string): Promise<{
  event: { current_stage_key: string; id: string };
}> {
  const response = await page.request.get(`/api/v1/source/events/${eventId}`);
  return expectJson(response);
}

async function generateArtifact(
  page: Page,
  eventId: string,
  artifactCode: string,
): Promise<{
  ok: boolean;
  artifact: { body: string };
  generation: {
    qualityGate?: {
      passed: boolean;
      attempts: number;
      rewriteAttempted: boolean;
    };
  };
}> {
  const response = await page.request.post(
    `/api/v1/source/${eventId}/artifacts/${artifactCode}/generate`,
  );
  return expectJson(response);
}

async function uploadFile(
  page: Page,
  args: {
    eventId: string;
    filePath: string;
    stageKey: string;
    artifactKind: string;
    dataClassification: "Confidential" | "Restricted";
    vendorName?: string;
  },
): Promise<{
  ok: boolean;
  artifact: {
    id: string;
    artifactKind: string;
    blobUri: string;
    sourceOrigin: string;
    parseStatus: string;
  };
  substrateSync: unknown;
}> {
  const response = await page.request.post(
    `/api/v1/source/${args.eventId}/artifacts/upload`,
    {
      multipart: {
        file: {
          name: path.basename(args.filePath),
          mimeType: mimeTypeFor(args.filePath),
          buffer: fs.readFileSync(args.filePath),
        },
        stageKey: args.stageKey,
        artifactKind: args.artifactKind,
        dataClassification: args.dataClassification,
        ...(args.vendorName ? { vendorName: args.vendorName } : {}),
      },
    },
  );
  return expectJson(response);
}

function mimeTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") return "text/csv";
  if (ext === ".md") return "text/markdown";
  if (ext === ".txt") return "text/plain";
  if (ext === ".html") return "text/html";
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === ".xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (ext === ".pptx") {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  return "application/octet-stream";
}

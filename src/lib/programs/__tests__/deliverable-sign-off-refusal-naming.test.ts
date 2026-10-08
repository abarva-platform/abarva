// The deliverable sign-off route is the ONLY product path that writes
// `deliverables_v2.status = 'signed_off'`, and four HARD phase-gate criteria —
// `business_case_approved`, `readiness_and_change_plan_signed_off`,
// `handoff_package_signed_off`, `value_measurement_contract_signed_off` — can be
// satisfied no other way, none of them with a capture-text fallback.
//
// Every refusal that route can return carries a `detail` sentence EXCEPT three,
// and all three returned a bare `{ error: "not_found" }`. The approval control
// renders `body.error` verbatim when no `detail` is present, so each of those
// three handed a signed-in product user the literal token `not_found`.
//
// These cases pin the naming for all three, and pin that the route emits it.
// The write is guarded `status IN ('draft','in_review')`, so TWO values reach
// the write-matched-nothing cause, and each needs its own sentence:
//
//   • `signed_off` — the user's intent is ALREADY MET.
//   • `superseded` — written by POST .../solution-options/approve for every P3
//     architecture deliverable in the Move. It is a durable recorded state, not
//     a lost race, so "reload and approve the version it then shows" names the
//     same superseded row and refuses identically every time. Only generating
//     the document again clears it: the orchestrator persists through
//     `completeDeliverable(..., { signOff: false })`, whose update carries no
//     status filter and writes `status: 'draft'`.
//
// A status this module does not recognise must keep falling to the generic
// cause-3 sentence rather than borrowing either named state's.
//
// The route suite lives here rather than beside the route because
// `src/lib/programs/__tests__` is swept wholesale by the required AI surface
// control catalog, so these cases are merge-blocking with no workflow edit.

import {
  refuseDeliverableNotInMove,
  refuseMoveNotReadable,
  refuseSignOffNotApplied,
} from "@/lib/programs/deliverable-sign-off-outcome";
import { P3_ARCHITECTURE_DELIVERABLE_KEYS } from "@/lib/programs/approved-solution-approach";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";

const mockRequireTenancy = jest.fn();
const mockTenancyErrorResponse = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockSignOffDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();
const mockListMoveArtifacts = jest.fn();
const mockDownloadArtifactBytes = jest.fn();
const mockExtractProgramEvidenceFromUploadBuffer = jest.fn();
const mockWriteAuditLog = jest.fn();
const mockExtractOfficeText = jest.fn();
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => mockTenancyErrorResponse(err),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    mockLoadUserProgramAccessPolicy(...args),
}));

jest.mock("@/lib/programs/mutations", () => ({
  signOffDeliverable: (...args: unknown[]) => mockSignOffDeliverable(...args),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => mockSaveMoveArtifact(...args),
  listMoveArtifacts: (...args: unknown[]) => mockListMoveArtifacts(...args),
  downloadArtifactBytes: (...args: unknown[]) =>
    mockDownloadArtifactBytes(...args),
}));

jest.mock("@/lib/deliverables/shared/office-text-extract", () => ({
  extractOfficeText: (...args: unknown[]) => mockExtractOfficeText(...args),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: (...args: unknown[]) =>
    mockWriteAuditLog(...args),
}));

jest.mock("@/lib/programs/evidence-ingestion", () => ({
  extractProgramEvidenceFromUploadBuffer: (...args: unknown[]) =>
    mockExtractProgramEvidenceFromUploadBuffer(...args),
}));

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) =>
    mockLoadApprovedMoveEvidenceSnapshot(...args),
}));

let deliverableRow: Record<string, unknown> | null;
let versionRow: Record<string, unknown> | null;
let selectedColumns: string;

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: async () => ({
    supabase: {
      from: (table: string) => {
        if (table === "deliverables_v2") {
          return {
            select: (columns: string) => {
              selectedColumns = columns;
              return {
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: deliverableRow,
                      error: null,
                    }),
                  }),
                }),
              };
            },
          };
        }
        if (table === "deliverable_versions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: versionRow
                      ? {
                          created_at: "2026-09-29T17:00:00.000Z",
                          ...versionRow,
                        }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    },
  }),
}));

const ctx = {
  clientId: "client-1",
  clientKey: "tenant-1",
  userId: "person-1",
  role: "client_admin",
  email: "reviewer@example.com",
};

const params = Promise.resolve({
  programId: "prog-1",
  deliverableId: "deliverable-1",
});

function req(): Request {
  return new Request(
    "http://test/api/v1/programs/prog-1/deliverables/deliverable-1/sign-off",
    { method: "POST" },
  );
}

/**
 * The approve-by-uploading-a-replacement request.
 *
 * This is the path the superseded refusal is reached on. The JSON path runs the
 * P3 architecture lineage checks first, and for a superseded row those are
 * expected to refuse on their own (the row is superseded BECAUSE the approved
 * option changed, so the lineage stored on the version is stale by
 * construction). The upload path skips that whole block, so the guarded write
 * is what answers.
 */
function uploadReq(): Request {
  const form = new FormData();
  form.append(
    "file",
    new File(["edited replacement body"], "architecture.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  );
  return new Request(
    "http://test/api/v1/programs/prog-1/deliverables/deliverable-1/sign-off",
    { method: "POST", body: form },
  );
}

async function postSignOff(request: Request = req()) {
  const mod = await import(
    "@/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route"
  );
  return mod.POST(request, { params });
}

describe("deliverable sign-off refusal naming", () => {
  describe("the refusal vocabulary", () => {
    it("names an unreadable Move without using the bare not_found token", () => {
      const refusal = refuseMoveNotReadable();
      expect(refusal.code).toBe("move_not_readable");
      expect(refusal.code).not.toBe("not_found");
      expect(refusal.httpStatus).toBe(404);
      expect(refusal.detail).toMatch(/Move could not be read/i);
      // A sentence, not a token: the approval control renders this verbatim.
      expect(refusal.detail.split(/\s+/).length).toBeGreaterThan(8);
    });

    it("names a deliverable that is not in this Move, and says to reload", () => {
      const refusal = refuseDeliverableNotInMove();
      expect(refusal.code).toBe("deliverable_not_in_move");
      expect(refusal.httpStatus).toBe(404);
      expect(refusal.detail).toMatch(/no longer part of this Move/i);
      expect(refusal.detail).toMatch(/reload/i);
    });

    it("reports an already-signed-off deliverable as already recorded, not as missing", () => {
      const refusal = refuseSignOffNotApplied({
        statusAtRead: "signed_off",
        signedOffVersionAtRead: 3,
      });
      expect(refusal.code).toBe("deliverable_already_signed_off");
      expect(refusal.httpStatus).toBe(409);
      // The whole point: this is the user's intent already met, so the sentence
      // must say the approval EXISTS rather than that something is absent.
      expect(refusal.detail).toMatch(/already signed off/i);
      expect(refusal.detail).toMatch(/already recorded/i);
      expect(refusal.detail).not.toMatch(/not found|does not exist/i);
    });

    it("names the signed-off version it found, when it has one", () => {
      expect(
        refuseSignOffNotApplied({
          statusAtRead: "signed_off",
          signedOffVersionAtRead: 7,
        }).detail,
      ).toContain("version 7");
      expect(
        refuseSignOffNotApplied({
          statusAtRead: "signed_off",
          signedOffVersionAtRead: null,
        }).detail,
      ).not.toMatch(/version (null|undefined|NaN)/);
    });

    it.each(["draft", "in_review", null, "some_future_status", "SUPERSEDED"])(
      "reports an eligible-at-read status (%s) as not recorded, not as already approved",
      (statusAtRead) => {
        const refusal = refuseSignOffNotApplied({ statusAtRead });
        // Claiming "already signed off" here would assert a state this route
        // never observed, so the eligible-at-read case gets its own sentence.
        expect(refusal.code).toBe("sign_off_not_applied");
        expect(refusal.detail).toMatch(/was not recorded/i);
        expect(refusal.detail).not.toMatch(/already signed off/i);
      },
    );

    it("keeps 404 for every refusal but the two recorded-state ones", () => {
      // A `false` from the write layer is also how a foreign deliverable id is
      // denied, and `programs-mutation-routes-tenant-guards` pins 404 for that.
      // Answering 409 would leak whether such an id exists.
      for (const statusAtRead of [
        "draft",
        "in_review",
        null,
        "some_future_status",
      ]) {
        expect(refuseSignOffNotApplied({ statusAtRead }).httpStatus).toBe(404);
      }
      expect(refuseMoveNotReadable().httpStatus).toBe(404);
      expect(refuseDeliverableNotInMove().httpStatus).toBe(404);
      // The two departures, and only because reaching either needs a row this
      // Move actually holds.
      for (const statusAtRead of ["signed_off", "superseded"]) {
        expect(refuseSignOffNotApplied({ statusAtRead }).httpStatus).toBe(409);
      }
    });

    it("names a superseded deliverable as superseded, not as a lost race", () => {
      const refusal = refuseSignOffNotApplied({ statusAtRead: "superseded" });
      expect(refusal.code).toBe("deliverable_superseded");
      expect(refusal.httpStatus).toBe(409);
      expect(refusal.detail).toMatch(/superseded/i);
      // The generic cause-3 sentence is for a row that changed under the write.
      // A superseded row did not change under anything: it is where the
      // solution-option approval deliberately left it.
      expect(refusal.detail).not.toMatch(/was not recorded/i);
      expect(refusal.detail).not.toMatch(/already signed off/i);
    });

    it("prescribes regeneration and not the retry that would refuse again", () => {
      const refusal = refuseSignOffNotApplied({ statusAtRead: "superseded" });
      // `superseded` clears only through a regenerate, which persists via
      // `completeDeliverable(..., { signOff: false })` -> `status: 'draft'`.
      // Reloading re-renders the same superseded row, so a sentence that sends
      // the reader back to "the version it then shows" sends them into the
      // identical refusal.
      expect(refusal.detail).toMatch(/generate the document again/i);
      expect(refusal.detail).toMatch(/draft/i);
      expect(refusal.detail).not.toMatch(/reload/i);
      // And it says the retry is futile rather than leaving the reader to find
      // that out by repeating it.
      expect(refusal.detail).toMatch(/refuse the same way|refuse again/i);
    });

    it("lands on documents that carry a sign-off control", () => {
      // Reachability, not vocabulary: `superseded` is written only to the P3
      // architecture deliverables, so the refusal is dead unless those are
      // registered deliverables a user is asked to approve.
      const keys = [...P3_ARCHITECTURE_DELIVERABLE_KEYS];
      expect(keys.length).toBeGreaterThan(0);
      const registered = new Set(
        DELIVERABLE_REGISTRY.map((spec) => spec.deliverableTypeKey),
      );
      for (const key of keys) {
        expect(registered.has(key)).toBe(true);
      }
    });

    it("gives every refusal a distinct code and a distinct sentence", () => {
      const refusals = [
        refuseMoveNotReadable(),
        refuseDeliverableNotInMove(),
        refuseSignOffNotApplied({ statusAtRead: "signed_off" }),
        refuseSignOffNotApplied({ statusAtRead: "superseded" }),
        refuseSignOffNotApplied({ statusAtRead: "draft" }),
      ];
      expect(new Set(refusals.map((r) => r.code)).size).toBe(5);
      expect(new Set(refusals.map((r) => r.detail)).size).toBe(5);
      for (const refusal of refusals) {
        expect(refusal.detail).not.toContain("not_found");
      }
    });
  });

  describe("POST .../sign-off emits the named refusal", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      selectedColumns = "";
      mockRequireTenancy.mockResolvedValue(ctx);
      mockTenancyErrorResponse.mockImplementation((err: unknown) => {
        throw err;
      });
      mockGetProgramById.mockResolvedValue({ id: "prog-1", name: "Test Move" });
      mockLoadUserProgramAccessPolicy.mockResolvedValue({
        canApproveGates: true,
      });
      mockSignOffDeliverable.mockResolvedValue(true);
      mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
        revision: "revision-current",
        approvedEvidenceCount: 1,
        rows: [],
        latestEvidenceActivityAt: "2026-09-29T16:00:00.000Z",
        revisionByPhase: {
          1: "revision-current",
          2: "revision-current",
          3: "revision-current",
          4: "revision-current",
          5: "revision-current",
        },
        latestEvidenceActivityAtByPhase: {
          1: "2026-09-29T16:00:00.000Z",
          2: "2026-09-29T16:00:00.000Z",
          3: "2026-09-29T16:00:00.000Z",
          4: "2026-09-29T16:00:00.000Z",
          5: "2026-09-29T16:00:00.000Z",
        },
      });
      deliverableRow = {
        deliverable_type_key: "business_case",
        title: "Business Case",
        current_version: 1,
        status: "draft",
        signed_off_version: null,
      };
      versionRow = {
        id: "version-1",
        structured_data: {
          source: "generated_by_orchestrator",
          evidenceSnapshotHash: "revision-current",
        },
        content:
          "<p>The governed data foundation baseline is instrumented before any funding commitment.</p>",
      };
      mockListMoveArtifacts.mockResolvedValue([]);
      mockDownloadArtifactBytes.mockResolvedValue(null);
      mockExtractOfficeText.mockResolvedValue({
        ok: true,
        format: "docx",
        text: "clean generated office companion",
        partCount: 1,
      });
    });

    it("reads the status columns the refusal naming needs", async () => {
      await postSignOff();
      // Without `status`, a write that matched nothing cannot be told apart
      // from a row that is not there.
      expect(selectedColumns).toContain("status");
      expect(selectedColumns).toContain("signed_off_version");
    });

    it("names the cause when the Move cannot be read", async () => {
      mockGetProgramById.mockResolvedValue(null);
      const res = await postSignOff();
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body.error).toBe("move_not_readable");
      expect(body.error).not.toBe("not_found");
      expect(body.detail).toMatch(/Move could not be read/i);
    });

    it("names the cause when the deliverable is not in this Move", async () => {
      deliverableRow = null;
      const res = await postSignOff();
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body.error).toBe("deliverable_not_in_move");
      expect(body.detail).toMatch(/no longer part of this Move/i);
    });

    it("tells a user whose deliverable was already signed off that it is already recorded", async () => {
      // The reachable live sequence: the agent tool `complete_deliverable`
      // signs the row off with no status guard, so the panel the user is
      // looking at still shows Approve. Their click used to answer
      // `not_found` about a document visibly on screen and already approved.
      deliverableRow = {
        ...(deliverableRow as Record<string, unknown>),
        status: "signed_off",
        signed_off_version: 2,
      };
      mockSignOffDeliverable.mockResolvedValue(false);
      const res = await postSignOff();
      const body = await res.json();
      expect(res.status).toBe(409);
      expect(body.error).toBe("deliverable_already_signed_off");
      expect(body.detail).toMatch(/already signed off at version 2/i);
      expect(body.detail).not.toMatch(/not found/i);
    });

    it("reports a write that matched nothing from an eligible status without claiming prior approval", async () => {
      mockSignOffDeliverable.mockResolvedValue(false);
      const res = await postSignOff();
      const body = await res.json();
      // 404 keeps the cross-tenant denial contract that
      // `programs-mutation-routes-tenant-guards` pins for this route.
      expect(res.status).toBe(404);
      expect(body.error).toBe("sign_off_not_applied");
      expect(body.detail).toMatch(/was not recorded/i);
    });

    it("tells a user whose deliverable was superseded to generate it again", async () => {
      // The reachable live sequence: approving a solution option at P3 sets
      // every P3 architecture deliverable in the Move to `superseded`, and the
      // approval control is still rendered (the phase build step passes
      // `alreadyApproved={false}`, and the documents panel compares
      // `signed_off_version` with `current_version`, not the status). Reached
      // here on the upload path, which skips the lineage block — see
      // `uploadReq`.
      deliverableRow = {
        deliverable_type_key: "target_state_architecture",
        title: "Target State Architecture",
        current_version: 1,
        status: "superseded",
        signed_off_version: null,
      };
      mockExtractProgramEvidenceFromUploadBuffer.mockResolvedValue({
        extractedText: "An edited target state architecture.",
        extractedStructured: { parse_method: "docx", warnings: [] },
      });
      mockSaveMoveArtifact.mockResolvedValue({ artifactId: "artifact-1" });
      mockSignOffDeliverable.mockResolvedValue(false);
      const res = await postSignOff(uploadReq());
      const body = await res.json();
      expect(res.status).toBe(409);
      expect(body.error).toBe("deliverable_superseded");
      expect(body.detail).toMatch(/superseded/i);
      expect(body.detail).toMatch(/generate the document again/i);
      // The two sentences this one replaced, neither of which was true here.
      expect(body.detail).not.toMatch(/not found/i);
      expect(body.detail).not.toMatch(/was not recorded/i);
    });

    it("still signs off a draft deliverable", async () => {
      const res = await postSignOff();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.status).toBe("signed_off");
      expect(mockSignOffDeliverable).toHaveBeenCalledTimes(1);
    });
  });
});

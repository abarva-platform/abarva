/**
 * Behavioral test for the `source-work-item-external-action-route` control
 * declared in docs/security/ai-surface-control-catalog.json.
 *
 * The catalog checker proves the control's tokens appear in executable code. It
 * cannot prove the code is reached. This drives the real route handler and
 * asserts the guarantee the control exists for: a work item that represents an
 * action leaving the platform cannot be created without an explicit human
 * confirmation, a rationale, and evidence references.
 *
 * Every refusal case asserts `createWorkItem` was never called. A refusal
 * message can go stale without anyone noticing; a write that did not happen
 * cannot.
 */

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    clientKey: "tenant-a",
    role: "client_admin",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "tenancy" })),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    key: "tenant-a",
    name: "tenant-a",
  })),
}));

jest.mock("@/lib/source/work-items/service", () => ({
  createWorkItem: jest.fn(async () => ({
    ok: true,
    data: { id: "work-item-1" },
  })),
}));

import { POST } from "../route";
import { createWorkItem } from "@/lib/source/work-items/service";
import { SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS } from "@/lib/source/external-action-gate";

const mockCreateWorkItem = jest.mocked(createWorkItem);

const RATIONALE =
  "Counsel approved serving the renewal notice after the CFO review on Tuesday.";

function post(body: Record<string, unknown>) {
  return POST(
    new Request("https://app.abarva.ai/api/v1/source/work-items", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

/** A `serve_notice` item is an action that leaves the platform. */
function serveNotice(extra: Record<string, unknown> = {}) {
  return {
    kind: "serve_notice",
    subjectKind: "contract",
    subjectRef: "CONTRACT-1",
    title: "Serve the non-renewal notice",
    ...extra,
  };
}

describe("source work-items route · external action gate", () => {
  beforeEach(() => {
    mockCreateWorkItem.mockClear();
    mockCreateWorkItem.mockResolvedValue({
      ok: true,
      data: { id: "work-item-1" },
    } as never);
  });

  it("refuses an external action with no human confirmation, and writes nothing", async () => {
    const response = await post(serveNotice());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "human_external_action_gate_required",
    });
    expect(mockCreateWorkItem).not.toHaveBeenCalled();
  });

  it("refuses a confirmation that carries no real rationale", async () => {
    const response = await post(
      serveNotice({
        humanConfirmed: true,
        humanJustification: "ok",
        evidenceRefs: ["EV-1"],
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      minimumRationaleChars: SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS,
    });
    expect(mockCreateWorkItem).not.toHaveBeenCalled();
  });

  it("refuses a confirmed, justified action with no evidence references", async () => {
    const response = await post(
      serveNotice({ humanConfirmed: true, humanJustification: RATIONALE }),
    );

    expect(response.status).toBe(400);
    expect(mockCreateWorkItem).not.toHaveBeenCalled();
  });

  it("records who confirmed, why, and that a human remains responsible for sending", async () => {
    const response = await post(
      serveNotice({
        humanConfirmed: true,
        humanJustification: RATIONALE,
        evidenceRefs: ["EV-1", "EV-2"],
      }),
    );

    expect(response.status).toBe(200);
    expect(mockCreateWorkItem).toHaveBeenCalledTimes(1);

    const written = mockCreateWorkItem.mock.calls[0][0];
    expect(written.metadata).toMatchObject({
      externalActionGate: "human_confirmed",
      externalActionControl: "ai_draft_human_review_human_sends",
      externalActionJustification: RATIONALE,
      externalActionEvidenceRefs: "EV-1, EV-2",
    });
    // The platform records the item; it never claims to have sent anything.
    expect(written.note).toContain(
      "a human remains responsible for any off-platform transmission",
    );
  });

  it("does not demand confirmation for an item that stays inside the platform", async () => {
    const response = await post({
      kind: "owner_assignment",
      subjectKind: "contract",
      subjectRef: "CONTRACT-1",
      title: "Name the renewal owner",
    });

    expect(response.status).toBe(200);
    expect(mockCreateWorkItem).toHaveBeenCalledTimes(1);
    // A blanket gate would be its own defect: it would train people to
    // confirm reflexively on actions that never leave the system.
    expect(mockCreateWorkItem.mock.calls[0][0].metadata).not.toHaveProperty(
      "externalActionGate",
    );
  });
});

import {
  emptyRomEstimate,
  romInputsFingerprint,
  serializeRomEstimate,
  type RomEstimate,
} from "@/lib/programs/rom-estimate";
import type { RomResult } from "../rom-service";
import {
  previewMatchesApproval,
  readApprovedRomSnapshot,
} from "../approved-rom-snapshot";

const MOVE_ID = "synthetic-move";
const AT = "2026-10-10T10:00:00Z";

function approvedRecord(): RomEstimate {
  const record: RomEstimate = {
    ...emptyRomEstimate(),
    useCases: [
      {
        code: "UC1",
        name: "Synthetic scope",
        counts: { data_source_count: 1 },
        source: { kind: "team" },
        confirmedBy: "reviewer",
        confirmedAt: AT,
      },
    ],
    unitHours: {
      data_source_count: {
        kind: "benchmark",
        benchmarkId: "BM1",
        value: 8,
        confidence: "medium",
        approvedBy: "reviewer",
        approvedAt: AT,
      },
    },
    pod: {
      templateCode: "POD1",
      locationCode: "US",
      providerClassCode: null,
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "synthetic workshop" },
    productiveShare: { value: 0.7, source: "synthetic workshop" },
    hoursPerFteWeek: { value: 40, source: "synthetic workshop" },
    releases: {
      items: [
        {
          code: "R1",
          name: "Release 1",
          useCaseCodes: ["UC1"],
          designStatus: "not_designed",
        },
      ],
      source: { kind: "team" },
      acceptedBy: "reviewer",
      acceptedAt: AT,
    },
    snapshotsIssued: 1,
  };
  return {
    ...record,
    approval: {
      version: 1,
      approvedBy: "reviewer",
      approvedAt: AT,
      inputsFingerprint: romInputsFingerprint(record),
      unitHours: {
        data_source_count: { value: 8, source: "Approved benchmark BM1" },
      },
      releases: [
        {
          code: "R1",
          name: "Release 1",
          hours: 8.8,
          weeks: 1,
          lowCents: 80_000,
          planCents: 100_000,
          highCents: 150_000,
        },
      ],
      foundation: null,
      combined: {
        hours: 8.8,
        weeks: 1,
        lowCents: 80_000,
        planCents: 100_000,
        highCents: 150_000,
      },
    },
  };
}

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

function mockReads(
  record: RomEstimate | null,
  register: unknown[] = [],
  options: { registerOk?: boolean; redacted?: boolean } = {},
) {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(
      response({
        ok: true,
        programId: MOVE_ID,
        phase: 3,
        values: record ? { rom_estimate: serializeRomEstimate(record) } : {},
      }),
    )
    .mockResolvedValueOnce(
      response(
        {
          ok: true,
          assumptions: register,
          figuresRedacted: options.redacted === true,
        },
        options.registerOk !== false,
      ),
    );
}

describe("approved P3 ROM read for P4", () => {
  it("returns only the current approval and the exact workbook route", async () => {
    mockReads(approvedRecord());
    const read = await readApprovedRomSnapshot(MOVE_ID);
    expect(read.status).toBe("approved");
    if (read.status !== "approved") return;
    expect(read.snapshot.id).toBe("v1");
    expect(read.snapshot.result.releases[0].planCents).toBe(100_000);
    expect(read.snapshot.workbookHref).toBe(
      `/api/v1/programs/${MOVE_ID}/rom/preview?format=xlsx`,
    );
    expect(
      read.snapshot.workbookStructure.unitHours.data_source_count?.value,
    ).toBe(8);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `/api/v1/programs/${MOVE_ID}/phase-capture?phase=3`,
      { cache: "no-store" },
    );
  });

  it("distinguishes a saved but unapproved estimate from an unreadable capture", async () => {
    const draft = { ...approvedRecord(), approval: null };
    mockReads(draft);
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "missing",
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    global.fetch = jest.fn().mockResolvedValue(response({}, false));
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "failed",
    });
  });

  it("identifies an approval made stale by an edited P3 input", async () => {
    const changed = approvedRecord();
    changed.friction = { value: 1.2, source: "revised synthetic workshop" };
    mockReads(changed);
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "stale",
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("identifies register drift after approval as stale", async () => {
    const record = approvedRecord();
    record.unitHours.data_source_count = { kind: "register", registerId: "A1" };
    record.approval!.inputsFingerprint = romInputsFingerprint(record);
    record.approval!.unitHours.data_source_count = {
      value: 8,
      source: "[A:A1] confirmed · Delivery owner",
    };
    mockReads(record, [
      {
        registerId: "A1",
        status: "confirmed",
        workingValue: 9,
        ownerRole: "Delivery owner",
        confidence: 3,
      },
    ]);
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "stale",
    });
  });

  it("does not call an assumptions read failure or redaction an absent approval", async () => {
    mockReads(approvedRecord(), [], { registerOk: false });
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "failed",
    });
    mockReads(approvedRecord(), [], { redacted: true });
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "failed",
    });
  });

  it("refuses malformed snapshot figures instead of showing a partial approval", async () => {
    const bad = approvedRecord();
    bad.approval!.releases[0].planCents = -1;
    mockReads(bad);
    await expect(readApprovedRomSnapshot(MOVE_ID)).resolves.toEqual({
      status: "failed",
    });
  });

  it("matches every current figure to the stored approval before a workbook", () => {
    const approval = approvedRecord().approval!;
    const preview = {
      releases: [
        {
          code: "R1",
          name: "Release 1",
          own: {
            hours: 8.8,
            weeks: 1,
            range: { lowCents: 80_000, planCents: 100_000, highCents: 150_000 },
          },
        },
      ],
      foundation: null,
      total: {
        hours: 8.8,
        weeks: 1,
        lowCents: 80_000,
        planCents: 100_000,
        highCents: 150_000,
      },
    } as unknown as RomResult;
    expect(previewMatchesApproval(preview, approval)).toBe(true);
    expect(
      previewMatchesApproval(
        {
          ...preview,
          total: { ...preview.total, planCents: 100_001 },
        },
        approval,
      ),
    ).toBe(false);
  });
});

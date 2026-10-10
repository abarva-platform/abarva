import {
  buildRomStructure,
  isRomApprovalCurrent,
  isRomEstimateDone,
  parseRomEstimate,
  romResultFigures,
  type RomRegisterRow,
  type RomSnapshot,
} from "@/lib/programs/rom-estimate";
import type { RomResult, RomStructure } from "./rom-service";

/** The P3 approval, read through the Move's authenticated capture projection. */
export interface ApprovedRomSnapshot {
  id: string;
  approvedAt: string;
  result: RomSnapshot;
  workbookHref: string;
  workbookStructure: RomStructure;
}

export type ApprovedRomRead =
  | { status: "approved"; snapshot: ApprovedRomSnapshot }
  | { status: "missing" }
  | { status: "stale" }
  | { status: "failed" };

function registerRow(raw: unknown): RomRegisterRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const string = (value: unknown) => (typeof value === "string" ? value : null);
  const number = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  if (!string(row.registerId) || !string(row.status)) return null;
  return {
    registerId: row.registerId as string,
    status: row.status as RomRegisterRow["status"],
    statement: string(row.statement) ?? "",
    whyItMatters: string(row.whyItMatters),
    workingFigure: string(row.workingFigure),
    workingValue: number(row.workingValue),
    source: string(row.source) ?? "",
    confidence: number(row.confidence) ?? 1,
    ownerRole: string(row.ownerRole) ?? "",
    answer: string(row.answer),
    answerFigure: string(row.answerFigure),
    answerValue: number(row.answerValue),
    answerSource: string(row.answerSource),
  };
}

function validFigures(snapshot: RomSnapshot, releaseCodes: readonly string[]) {
  const validRange = (value: {
    lowCents: number;
    planCents: number;
    highCents: number;
  }) =>
    [value.lowCents, value.planCents, value.highCents].every(
      (amount) => Number.isSafeInteger(amount) && amount >= 0,
    ) &&
    value.lowCents <= value.planCents &&
    value.planCents <= value.highCents;
  return (
    snapshot.releases.length === releaseCodes.length &&
    snapshot.releases.every(
      (release, index) =>
        release.code === releaseCodes[index] && validRange(release),
    ) &&
    validRange(snapshot.combined) &&
    (!snapshot.foundation || validRange(snapshot.foundation))
  );
}

/**
 * A failed authenticated read is never reported as an absent approval. The
 * register read also checks that cited unit hours still match the approval;
 * it supplies the original inputs required by the read-only workbook route.
 */
export async function readApprovedRomSnapshot(
  moveId: string,
): Promise<ApprovedRomRead> {
  try {
    const movePath = `/api/v1/programs/${encodeURIComponent(moveId)}`;
    const captureResponse = await fetch(`${movePath}/phase-capture?phase=3`, {
      cache: "no-store",
    });
    if (!captureResponse.ok) return { status: "failed" };
    const capture = (await captureResponse.json()) as {
      ok?: unknown;
      programId?: unknown;
      phase?: unknown;
      values?: unknown;
    };
    if (
      capture.ok !== true ||
      capture.programId !== moveId ||
      capture.phase !== 3 ||
      typeof capture.values !== "object" ||
      capture.values === null
    ) {
      return { status: "failed" };
    }
    const raw = (capture.values as Record<string, unknown>).rom_estimate;
    if (raw === undefined || raw === "") return { status: "missing" };
    if (typeof raw !== "string") return { status: "failed" };
    const record = parseRomEstimate(raw);
    if (!record) return { status: "failed" };
    if (!record.approval) return { status: "missing" };
    if (!isRomEstimateDone(record)) return { status: "stale" };
    const approval = record.approval;
    if (
      !validFigures(
        approval,
        record.releases?.items.map((release) => release.code) ?? [],
      )
    ) {
      return { status: "failed" };
    }

    const registerResponse = await fetch(`${movePath}/assumptions`, {
      cache: "no-store",
    });
    if (!registerResponse.ok) return { status: "failed" };
    const registerBody = (await registerResponse.json()) as {
      ok?: unknown;
      assumptions?: unknown;
      figuresRedacted?: unknown;
    };
    if (
      registerBody.ok !== true ||
      !Array.isArray(registerBody.assumptions) ||
      registerBody.figuresRedacted === true
    ) {
      return { status: "failed" };
    }
    const register = registerBody.assumptions
      .map(registerRow)
      .filter((row): row is RomRegisterRow => row !== null);
    if (!isRomApprovalCurrent(record, register)) return { status: "stale" };
    const build = buildRomStructure(record, register);
    if (!build.ok || build.workingFigureDrivers.length) {
      return { status: "stale" };
    }
    return {
      status: "approved",
      snapshot: {
        id: `v${approval.version}`,
        approvedAt: approval.approvedAt,
        result: approval,
        workbookHref: `${movePath}/rom/preview?format=xlsx`,
        workbookStructure: build.structure,
      },
    };
  } catch {
    return { status: "failed" };
  }
}

/** A workbook may be offered only while today's deterministic ROM equals the approval. */
export function previewMatchesApproval(
  preview: RomResult,
  approval: RomSnapshot,
): boolean {
  const figures = romResultFigures(preview);
  return (
    JSON.stringify(figures) ===
    JSON.stringify({
      releases: approval.releases,
      foundation: approval.foundation,
      combined: approval.combined,
    })
  );
}

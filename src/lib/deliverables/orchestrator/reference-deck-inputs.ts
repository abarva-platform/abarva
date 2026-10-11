import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { GET as readValueCase } from "@/app/api/v1/programs/[programId]/value-case/route";
import { GET as readRegister } from "@/app/api/v1/programs/[programId]/assumptions/route";
import { GET as readCapture } from "@/app/api/v1/programs/[programId]/phase-capture/route";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import type { ProgramCore } from "@/lib/programs/types.db";
import { loadPublicSourcesForGeneration } from "@/lib/deliverables/public-research/generation-feed";
import { publicCitationSourcesFromApproved } from "@/lib/deliverables/public-research/citation-feed";
import type { PublicCitationSource } from "./types";
import {
  readApprovedRomSnapshot,
  type ApprovedRomSnapshot,
} from "@/lib/pricing/moves-workflow/approved-rom-snapshot";
import type { ReferenceEdition } from "./reference-deck-model";
import { valueCaseRead, type ValueCaseRead } from "./reference-deck-value-case-read";

type Read<T> = { status: "ready"; value: T } | { status: "gap"; detail: string };
const gap = <T>(detail: string): Read<T> => ({ status: "gap", detail });
const ready = <T>(value: T): Read<T> => ({ status: "ready", value });

export interface EditionInputs {
  edition: ReferenceEdition;
  move: ProgramCore;
  valueCase: ValueCaseRead;
  register: Read<{ assumptions: Record<string, unknown>[]; figuresRedacted: boolean }>;
  rom: Read<ApprovedRomSnapshot>;
  citations: Read<PublicCitationSource[]>;
  capture: Record<1 | 2 | 3, Read<Record<string, string>>>;
}

export class ReferenceMoveUnavailable extends Error {
  constructor() { super("The Move is unavailable to this signed-in viewer."); }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Calls existing route readers in this request's Clerk context; no HTTP loopback or DB shortcut. */
async function existingRouteRead(
  moveId: string,
  path: "value-case" | "assumptions" | "phase-capture",
  query = "",
): Promise<Response> {
  const url = `http://internal.invalid/api/v1/programs/${encodeURIComponent(moveId)}/${path}${query}`;
  const request = new NextRequest(url);
  const params = { params: Promise.resolve({ programId: moveId }) };
  if (path === "value-case") return readValueCase(request, params);
  if (path === "assumptions") return readRegister(request, params);
  return readCapture(request, params);
}

async function jsonRead<T>(response: Promise<Response>, valid: (body: Record<string, unknown>) => T | null, label: string): Promise<Read<T>> {
  try {
    const result = await response;
    const body: unknown = await result.json();
    if (!result.ok || !isObject(body)) return gap(`${label} could not be read.`);
    const parsed = valid(body);
    return parsed === null ? gap(`${label} returned an unreadable result.`) : ready(parsed);
  } catch {
    return gap(`${label} could not be read.`);
  }
}

async function captureRead(moveId: string, phase: 1 | 2 | 3): Promise<Read<Record<string, string>>> {
  return jsonRead(
    existingRouteRead(moveId, "phase-capture", `?phase=${phase}`),
    (body) => {
      if (body.ok !== true || body.programId !== moveId || body.phase !== phase || !isObject(body.values)) return null;
      return Object.fromEntries(Object.entries(body.values).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    },
    `P${phase} capture`,
  );
}

/**
 * Server-only assembly from the Move's existing signed-in read paths. The
 * initial Move read is the same tenant and per-Move fence as the workspace.
 * Every later refusal is preserved as a gap, never replaced with a figure.
 */
export async function assembleEditionInputs(moveId: string, edition: ReferenceEdition): Promise<EditionInputs> {
  const ctx = await requireTenancy();
  const { supabase } = await getProgramsRouteSupabase("program_read");
  const move = await getProgramById(ctx, moveId, { supabase });
  if (!move || move.archivedAt || move.deletedAt) throw new ReferenceMoveUnavailable();

  const [valueCase, register, rom, citations, p1, p2, p3] = await Promise.all([
    valueCaseRead(existingRouteRead(moveId, "value-case"), moveId),
    jsonRead(existingRouteRead(moveId, "assumptions"), (body) =>
      body.ok === true && Array.isArray(body.assumptions)
        ? { assumptions: body.assumptions.filter(isObject), figuresRedacted: body.figuresRedacted === true }
        : null, "Assumptions register"),
    (async (): Promise<Read<ApprovedRomSnapshot>> => {
      const result = await readApprovedRomSnapshot(moveId, async (input) => {
        const path = String(input);
        return path.endsWith("/assumptions")
          ? existingRouteRead(moveId, "assumptions")
          : existingRouteRead(moveId, "phase-capture", "?phase=3");
      });
      return result.status === "approved" ? ready(result.snapshot) : gap(
        result.status === "missing" ? "No approved ROM snapshot is available."
          : result.status === "stale" ? "The approved ROM is stale against current inputs."
            : "Approved ROM read failed.",
      );
    })(),
    (async (): Promise<Read<PublicCitationSource[]>> => {
      try {
        const sources = await loadPublicSourcesForGeneration(ctx, moveId, ctx.clientKey ?? "");
        return sources === null ? gap("Approved public-source feed is unavailable.") : ready(publicCitationSourcesFromApproved(sources));
      } catch { return gap("Approved public-source feed could not be read."); }
    })(),
    captureRead(moveId, 1), captureRead(moveId, 2), captureRead(moveId, 3),
  ]);
  return { edition, move, valueCase, register, rom, citations, capture: { 1: p1, 2: p2, 3: p3 } };
}

import { expect, type Page } from "@playwright/test";
import { withClerkAuth } from "./auth";
import { AUTH_TOKEN, BASE_URL, CLERK_SECRET_KEY } from "./env";

type ApiResult = { status: number; body: Record<string, unknown> };

export function missingMovesGatePrereqs(moveId: string | undefined): string[] {
  return [
    !moveId ? "disposable Move ID" : null,
    !process.env.E2E_MOVES_CLIENT_KEY ? "E2E_MOVES_CLIENT_KEY" : null,
    !process.env.E2E_MOVES_OPERATOR_EMAIL ? "E2E_MOVES_OPERATOR_EMAIL" : null,
    !AUTH_TOKEN && !CLERK_SECRET_KEY
      ? "CLERK_SESSION_TOKEN or CLERK_SECRET_KEY"
      : null,
    BASE_URL === "http://localhost:3000" ? "BASE_URL for the lab app" : null,
  ].filter((item): item is string => Boolean(item));
}

export async function openSignedInMove(
  page: Page,
  moveId: string,
  phase: number,
): Promise<void> {
  await withClerkAuth(page, {
    activeClient: process.env.E2E_MOVES_CLIENT_KEY,
    email: process.env.E2E_MOVES_OPERATOR_EMAIL,
  });
  await page.goto(`/strategic-moves/${moveId}/phase/${phase}`, {
    waitUntil: "domcontentloaded",
  });
  expect(page.url()).not.toMatch(/\/sign-in(?:\?|$)/);
}

export async function movesApi(
  page: Page,
  path: string,
  init?: { method: "POST"; body: Record<string, unknown> },
): Promise<ApiResult> {
  return page.evaluate(
    async ({ path, init }) => {
      const response = await fetch(path, {
        method: init?.method ?? "GET",
        credentials: "include",
        headers: init ? { "content-type": "application/json" } : undefined,
        body: init ? JSON.stringify(init.body) : undefined,
      });
      const body = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      return { status: response.status, body };
    },
    { path, init },
  );
}

export async function readPersistedPhase(
  page: Page,
  moveId: string,
): Promise<number> {
  const result = await movesApi(page, `/api/v1/programs/${moveId}`);
  expect(result.status, JSON.stringify(result.body)).toBe(200);
  const program = result.body.program as { currentPhase?: number } | undefined;
  expect(program?.currentPhase, "program readback must contain currentPhase").toEqual(
    expect.any(Number),
  );
  return program!.currentPhase!;
}

export async function approveReadyMovesGate(
  page: Page,
  moveId: string,
  phase: number,
): Promise<Record<string, unknown>> {
  expect(await readPersistedPhase(page, moveId)).toBe(phase);
  const preflight = await movesApi(
    page,
    `/api/v1/programs/${moveId}/phase-gate-approval?phase=${phase}`,
  );
  expect(preflight.status, JSON.stringify(preflight.body)).toBe(200);
  expect(
    preflight.body.canApprove,
    `The disposable fixture must carry reviewed evidence, captured inputs, and signed outputs: ${JSON.stringify(preflight.body)}`,
  ).toBe(true);

  const approved = await movesApi(
    page,
    `/api/v1/programs/${moveId}/phase-gate-approval`,
    {
      method: "POST",
      body: {
        phase,
        rationale:
          "Automated synthetic lab smoke by the signed-in test operator; reviewed fixture inputs and output sign-offs were prepared before this gate submission.",
      },
    },
  );
  expect(approved.status, JSON.stringify(approved.body)).toBe(200);
  expect(approved.body.ok).toBe(true);
  expect(approved.body.approved).toBe(true);
  expect(approved.body.newPhase).toBe(phase + 1);
  expect(approved.body.transition).toMatchObject({
    fromPhase: phase,
    toPhase: phase + 1,
  });
  expect(await readPersistedPhase(page, moveId)).toBe(phase + 1);
  return approved.body;
}

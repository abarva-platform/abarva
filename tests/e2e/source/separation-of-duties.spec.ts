/**
 * Separation-of-duties governance · Source stage approval
 *
 * Current contract:
 *   - Pilot mode (default): an authorized Source approver may self-approve
 *     stage advancement, and the stage promotion is written to
 *     `source_event_activity`.
 *   - Strict mode: same-person self-approval is rejected with 403 for callers
 *     without admin/maestro approval posture.
 *   - Non-approver pending-approval flow is still backlog B-120 and is
 *     documented below as `fixme`, not implemented here.
 */

import { auditedTest as test, expect } from './_audit-harness';
import { signInAs, sourcePersonaIsFallback } from './_auth';
import { BASE_URL, missingClerkPrereqs } from '../_helpers/auth';
import type { Page } from '@playwright/test';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';

const EVENT_ID = 'apex-retail-ams-outsourcing-2026';
const TARGET_STAGE = 'executive_decision';

const NON_APPROVER_PERSONA = 'apex-non-approver';
const APPROVER_PERSONA = 'apex-vp-sourcing';

const STAGE_API = `${BASE_URL}/api/v1/source/${EVENT_ID}/stage`;
const RESET_API = `${BASE_URL}/api/v1/source/${EVENT_ID}/test-reset`;
const EVENT_API = `${BASE_URL}/api/v1/source/events/${EVENT_ID}`;

const missingPrereqs = missingClerkPrereqs();

type BrowserFetchResult = {
  status: number;
  ok: boolean;
  json: unknown | null;
  text: string;
};

async function browserFetchJson(
  page: Page,
  input: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<BrowserFetchResult> {
  const res = await page.request.fetch(input, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
    data: init.body,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    status: res.status(),
    ok: res.ok(),
    json,
    text,
  };
}

async function resetGoldenEvent(page: Page): Promise<void> {
  const response = await page.request.post(RESET_API);
  expect(response.status(), 'golden event reset must succeed').toBe(200);
}

async function currentStage(page: Page): Promise<string | null> {
  const res = await browserFetchJson(page, EVENT_API);
  expect(res.ok, 'event lookup must succeed').toBeTruthy();
  const body = res.json as { event?: { current_stage_key?: string } };
  return body?.event?.current_stage_key ?? null;
}

async function currentEventId(page: Page): Promise<string> {
  const res = await browserFetchJson(page, EVENT_API);
  expect(res.ok, 'event lookup must succeed').toBeTruthy();
  const body = res.json as { event?: { id?: string } };
  expect(typeof body?.event?.id).toBe('string');
  return body.event!.id as string;
}

test.describe.configure({ mode: 'serial' });

test.describe('Source · Separation of duties · current contract', () => {
  test.skip(
    missingPrereqs.length > 0,
    `Missing required env: ${missingPrereqs.join(', ')}`,
  );

  test.fixme(
    'Stage advance: non-approver gets 202 + pending approval row',
    async () => {
      // B-120 gap: stage route returns 403, not 202+approvalId.
      // source_event_stage_approvals table does not exist yet.
      // Do not implement until schema is designed.
    },
  );

  test.fixme(
    'Stage advance: approver clears pending approval row via approvalId',
    async () => {
      // B-120 gap: stage route returns 403, not 202+approvalId.
      // source_event_stage_approvals table does not exist yet.
      // Do not implement until schema is designed.
    },
  );

  test('current contract · non-approver gets direct 403 and the stage does not advance', async ({ page }) => {
    test.skip(
      await sourcePersonaIsFallback(NON_APPROVER_PERSONA),
      'Dedicated apex-non-approver Clerk persona is not provisioned in this environment.',
    );

    await signInAs(page, APPROVER_PERSONA);
    await resetGoldenEvent(page);

    await signInAs(page, NON_APPROVER_PERSONA);
    const beforeStage = await currentStage(page);

    const submitRes = await browserFetchJson(page, STAGE_API, {
      method: 'PATCH',
      body: { stageKey: TARGET_STAGE },
    });

    expect(submitRes.status).toBe(403);
    expect(submitRes.json).toMatchObject({
      error: 'forbidden_source_stage_approval_required',
    });
    expect(
      await currentStage(page),
      'non-approver request must not advance the stage',
    ).toBe(beforeStage);
  });

  test('pilot mode · self-approval is allowed and source_event_activity records the stage promotion', async ({ page }) => {
    const strictMode = (process.env.GATE_APPROVAL_STRICT_MODE ?? '').toLowerCase();
    test.skip(
      ['1', 'true', 'on', 'yes'].includes(strictMode),
      'Pilot-mode assertion skipped because this run is targeting a strict-mode server.',
    );

    await signInAs(page, APPROVER_PERSONA);
    await resetGoldenEvent(page);

    const selfApproveRes = await browserFetchJson(page, STAGE_API, {
      method: 'PATCH',
      body: {
        stageKey: TARGET_STAGE,
        selfApproveIfAuthorized: true,
        reason:
          'Pilot-mode self-approval for current-contract QA coverage.',
      },
    });

    expect(selfApproveRes.status).toBe(200);
    expect(selfApproveRes.json).toMatchObject({
      ok: true,
      stageKey: TARGET_STAGE,
      persisted: true,
    });
    expect(
      await currentStage(page),
      'pilot self-approval must advance the event stage',
    ).toBe(TARGET_STAGE);

    const eventUuid = await currentEventId(page);
    const { data, error } = await getAzureReadFluentClient()
      .from('source_event_activity')
      .select('action_type, action_label, stage_key')
      .eq('event_id', eventUuid)
      .eq('stage_key', TARGET_STAGE)
      .order('occurred_at', { ascending: false })
      .limit(10);

    expect(error?.message ?? null, 'activity log query must succeed').toBeNull();
    expect(
      (data ?? []).some(
        (row) =>
          row.action_type === 'stage_promoted' &&
          row.action_label ===
            'Promoted Source event from strategy to executive_decision',
      ),
      'source_event_activity must record the stage promotion',
    ).toBeTruthy();
  });

  test('production mode · strict mode rejects same-person self-approval for non-admin callers', async ({ page }) => {
    const strictMode = (process.env.GATE_APPROVAL_STRICT_MODE ?? '').toLowerCase();
    test.skip(
      !['1', 'true', 'on', 'yes'].includes(strictMode),
      'Strict-mode assertion skipped because this run is not targeting a strict-mode server.',
    );

    await signInAs(page, APPROVER_PERSONA);
    await resetGoldenEvent(page);

    const res = await browserFetchJson(page, STAGE_API, {
      method: 'PATCH',
      body: {
        stageKey: TARGET_STAGE,
        selfApproveIfAuthorized: true,
      },
    });

    expect(res.status).toBe(403);
    expect(res.json).toMatchObject({ error: 'forbidden' });
    expect(String((res.json as Record<string, unknown> | null)?.detail ?? '')).toMatch(
      /GATE_APPROVAL_STRICT_MODE|same-person self-approval|admin or maestro/i,
    );
  });
});

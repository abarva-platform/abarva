import { test, expect, type Page } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', override: false });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BASE_HOST = new URL(BASE_URL).hostname;
const AUTH_TOKEN = process.env.CLERK_SESSION_TOKEN ?? null;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

const FIXTURE = {
  clientNames: ['Meridian Health System', 'Meridian Health'],
  activeClientCookie: 'meridian',
  sponsor: {
    graphNodeId: 'person_e2e_phase_0_priya_raman',
    name: 'Priya Raman',
    email: 'e2e.priya.raman@abarva.test',
    role: 'VP, Revenue Cycle Transformation',
    organization: 'Meridian Health System',
    familiarity: 'first_meeting',
    communicationStyle: {
      title: 'VP, Revenue Cycle Transformation',
      cxo_function: 'Operations',
      unit: 'Revenue Cycle',
      primary_focus: 'Stabilize prior authorization throughput and denials while protecting patient access.',
    },
  },
  engagement: {
    id: null as string | null,
    graphNodeId: 'eng_e2e_phase_0_smoke',
    name: 'Meridian Prior Auth Recovery',
    industryCode: 'HEALTHCARE_IDN',
    functionCode: 'MIDDLE_OFFICE',
    objectiveCode: 'OPTIMISE',
    topicCode: 'prior_authorization',
  },
  labels: {
    industry: 'Healthcare IDN',
    function: 'Middle Office',
    objective: 'Optimise',
  },
};

type FixtureState = {
  clientId: string;
  clientName: string;
  sponsorId: string;
  engagementId: string;
};

const CREATE_CONFIRMATION_TEXT =
  'Got it. Creating Meridian Prior Auth Recovery — healthcare IDN, middle office, optimise objective, with Priya Raman as sponsor. Setting it up now.';

const PHASE_OPENER_TEXT =
  "Phase 1 opener: I'll start with the current-state breakpoints in prior auth, the denial leakage, and the systems handoff gaps we need to quantify.";

const missingPrereqs = [
  !AUTH_TOKEN ? 'CLERK_SESSION_TOKEN' : null,
  !SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
  !SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
].filter(Boolean);

let sb: SupabaseClient | null = null;
let fixtureState: FixtureState | null = null;

function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing');
  }
  if (!sb) {
    sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return sb;
}

async function withAuth(page: Page) {
  if (!AUTH_TOKEN) throw new Error('CLERK_SESSION_TOKEN missing');
  await page.context().addCookies([
    {
      name: '__session',
      value: AUTH_TOKEN,
      domain: BASE_HOST,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
    {
      name: 'abarva_active_client',
      value: FIXTURE.activeClientCookie,
      domain: BASE_HOST,
      path: '/',
      sameSite: 'Lax',
      secure: BASE_URL.startsWith('https://'),
    },
  ]);
}

async function ensureFixture(): Promise<FixtureState> {
  const client = getSupabase();

  let clientId: string | null = null;
  let clientName: string | null = null;
  for (const candidate of FIXTURE.clientNames) {
    const { data, error } = await client
      .from('clients')
      .select('id, name')
      .ilike('name', candidate)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      clientId = (data as { id: string }).id;
      clientName = (data as { name: string }).name;
      break;
    }
  }
  if (!clientId || !clientName) {
    throw new Error(`Unable to find seeded Meridian client (${FIXTURE.clientNames.join(' / ')})`);
  }

  const sponsorPayload = {
    graph_node_id: FIXTURE.sponsor.graphNodeId,
    name: FIXTURE.sponsor.name,
    email: FIXTURE.sponsor.email,
    role: FIXTURE.sponsor.role,
    organization: FIXTURE.sponsor.organization,
    familiarity: FIXTURE.sponsor.familiarity,
    communication_style: FIXTURE.sponsor.communicationStyle,
    working_rhythm: {},
    personal_threads: [],
  };

  const { data: existingSponsor, error: sponsorReadError } = await client
    .from('persons')
    .select('id')
    .eq('graph_node_id', FIXTURE.sponsor.graphNodeId)
    .maybeSingle();
  if (sponsorReadError) throw sponsorReadError;

  let sponsorId: string;
  if (existingSponsor) {
    sponsorId = (existingSponsor as { id: string }).id;
    const { error: sponsorUpdateError } = await client
      .from('persons')
      .update(sponsorPayload)
      .eq('id', sponsorId);
    if (sponsorUpdateError) throw sponsorUpdateError;
  } else {
    const { data: insertedSponsor, error: sponsorInsertError } = await client
      .from('persons')
      .insert(sponsorPayload)
      .select('id')
      .single();
    if (sponsorInsertError) throw sponsorInsertError;
    sponsorId = (insertedSponsor as { id: string }).id;
  }

  const engagementPayload = {
    graph_node_id: FIXTURE.engagement.graphNodeId,
    name: FIXTURE.engagement.name,
    industry_code: FIXTURE.engagement.industryCode,
    function_code: FIXTURE.engagement.functionCode,
    objective_code: FIXTURE.engagement.objectiveCode,
    topic_code: FIXTURE.engagement.topicCode,
    sponsor_person_id: sponsorId,
    co_sponsor_person_id: null,
    maestro_person_id: null,
    client_id: clientId,
    current_phase: 0,
    status: 'active',
    charter: {},
    gates_passed: [],
    decisions: [],
    deliverables: [],
    sponsor_approvals: [],
    baseline_metrics: {},
    actual_metrics: {},
    outcome_fee_status: null,
    outcome_fee_usd: null,
    phase_0_started_at: new Date().toISOString(),
    phase_4_completed_at: null,
  };

  const { data: existingEngagement, error: engagementReadError } = await client
    .from('engagements')
    .select('id')
    .eq('graph_node_id', FIXTURE.engagement.graphNodeId)
    .maybeSingle();
  if (engagementReadError) throw engagementReadError;

  let engagementId: string;
  if (existingEngagement) {
    engagementId = (existingEngagement as { id: string }).id;
    const { error: engagementUpdateError } = await client
      .from('engagements')
      .update(engagementPayload)
      .eq('id', engagementId);
    if (engagementUpdateError) throw engagementUpdateError;
  } else {
    const { data: insertedEngagement, error: engagementInsertError } = await client
      .from('engagements')
      .insert(engagementPayload)
      .select('id')
      .single();
    if (engagementInsertError) throw engagementInsertError;
    engagementId = (insertedEngagement as { id: string }).id;
  }

  const { error: deleteTurnsError } = await client
    .from('turns')
    .delete()
    .eq('engagement_id', engagementId);
  if (deleteTurnsError) throw deleteTurnsError;

  return { clientId, clientName, sponsorId, engagementId };
}

function buildCreateStream(fixture: FixtureState): string {
  return [
    JSON.stringify({ type: 'delta', text: CREATE_CONFIRMATION_TEXT }),
    JSON.stringify({
      type: 'engagement_created',
      engagement: {
        id: fixture.engagementId,
        graph_node_id: FIXTURE.engagement.graphNodeId,
        name: FIXTURE.engagement.name,
        industry_code: FIXTURE.engagement.industryCode,
        function_code: FIXTURE.engagement.functionCode,
        objective_code: FIXTURE.engagement.objectiveCode,
        topic_code: FIXTURE.engagement.topicCode,
        current_phase: 0,
        sponsor_person_id: fixture.sponsorId,
      },
      sponsor: {
        graph_node_id: FIXTURE.sponsor.graphNodeId,
        name: FIXTURE.sponsor.name,
        role: FIXTURE.sponsor.role,
        organization: FIXTURE.sponsor.organization,
        title: FIXTURE.sponsor.communicationStyle.title,
        cxo_function: FIXTURE.sponsor.communicationStyle.cxo_function,
        primary_focus: FIXTURE.sponsor.communicationStyle.primary_focus,
      },
      labels: FIXTURE.labels,
      active_client: fixture.clientName,
    }),
    JSON.stringify({ type: 'done' }),
    '',
  ].join('\n');
}

function buildGateApprovalStream(): string {
  return [
    JSON.stringify({ type: 'stage', label: 'Checking pattern library', detail: '0 active patterns' }),
    JSON.stringify({
      type: 'delta',
      text: `Got it. Logging Phase 0 gate as approved. Generating the deliverable now.\n\n${PHASE_OPENER_TEXT}`,
    }),
    JSON.stringify({ type: 'gate_approved', phase: 0, new_phase: 1 }),
    JSON.stringify({ type: 'done', turnId: 'turn_e2e_phase_0_gate_approval' }),
    '',
  ].join('\n');
}

test.describe.configure({ mode: 'serial' });

test.describe('Programs Phase 0 smoke', () => {
  test.skip(missingPrereqs.length > 0, `Missing required env: ${missingPrereqs.join(', ')}`);

  test.beforeAll(async () => {
    fixtureState = await ensureFixture();
  });

  test('intake chat to gate approval stays deterministic and inline', async ({ page }) => {
    if (!fixtureState) throw new Error('Fixture not initialized');

    await withAuth(page);

    await page.route('**/api/engagements/create/turn', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: buildCreateStream(fixtureState!),
      });
    });

    await page.route(`**/api/engage/${FIXTURE.engagement.graphNodeId}/turn`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: buildGateApprovalStream(),
      });
    });

    await page.goto('/engagements/new');
    await expect(page).toHaveURL(/\/engagements\/new$/);

    const composer = page.getByPlaceholder('Describe the program…');
    await expect(composer).toBeVisible();
    await composer.fill('Meridian needs a Phase 0 prior auth recovery program for denials, throughput, and systems handoffs.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText(CREATE_CONFIRMATION_TEXT)).toBeVisible();
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();

    const manualStartButton = page.getByRole('button', { name: 'Start Phase 0 →' });
    if (await manualStartButton.isVisible().catch(() => false)) {
      await expect(page.getByText('Phase 0 · Intake')).toBeVisible();
      await expect(page.getByText(fixtureState.clientName)).toBeVisible();
      await expect(page.getByText(`${FIXTURE.sponsor.name} · ${FIXTURE.sponsor.communicationStyle.title}`)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.industry)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.function)).toBeVisible();
      await expect(page.getByText(FIXTURE.labels.objective)).toBeVisible();
      await manualStartButton.click();
    }

    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}$`));
    await expect(page.getByText(FIXTURE.engagement.name)).toBeVisible();
    await expect(page.getByText(FIXTURE.sponsor.name)).toBeVisible();
    await expect(page.getByText(FIXTURE.sponsor.role)).toBeVisible();
    await expect(page.getByText('0 · Start')).toBeVisible();

    const phaseComposer = page.getByPlaceholder('Your reply…');
    await expect(phaseComposer).toBeVisible();
    await phaseComposer.fill('Approved. Start Phase 1.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('✓ Phase 0 approved · advancing to Phase 1…')).toBeVisible();
    await expect(page.getByText(PHASE_OPENER_TEXT)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/engagements/${FIXTURE.engagement.graphNodeId}$`));
  });
});

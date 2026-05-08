/**
 * SSR smoke test for the universal sourcing canvas.
 *
 * Renders UniversalCanvasShell with synthesized fixtures (event + canvas
 * substrate rows + template bodies) and asserts the structure: ID strip,
 * step rail, splitter, chat lane (no truncation), workspace tabs, default
 * Document panel.
 *
 * Auth-gated route can't be visited in dev without real Clerk keys; this
 * test exercises the full render tree directly.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '@/lib/source/canvas-substrate';
import type { SourcingEventSummary } from '@/lib/source/types';

// Shell uses next/navigation + Clerk hooks; mock so SSR doesn't blow up.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/source/events/evt-1',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: 'evt-1' }),
  redirect: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { UniversalCanvasShell } from '@/components/source/canvas/UniversalCanvasShell';

function makeEvent(overrides: Partial<SourcingEventSummary> = {}): SourcingEventSummary {
  return {
    id: 'evt-canvas-1',
    code: 'SRC-APX-001',
    name: 'AMS Outsourcing 2026',
    accountName: 'Apex Retail Group',
    leadAgent: 'Sentinel',
    archetype: 'Managed Service',
    rigor: 'strategic',
    status: 'active',
    statusLabel: 'Active',
    priority: 'medium',
    currentStageKey: 'scope',
    currentStageLabel: 'Scope',
    openAlerts: 0,
    owner: 'Maya Desai',
    agingDays: 4,
    blocker: null,
    nextAction: 'Lock scope memo',
    isAtRisk: false,
    valueAtStakeUsd: 10_000_000,
    projectedValueUsd: 10_000_000,
    realizedValueUsd: 0,
    nextDecision: 'Lock scope memo',
    ...overrides,
  };
}

function makeArtifactState(
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: 'a1',
    sourceEventId: 'evt-canvas-1',
    tenantKey: 'apexretail',
    artifactCode: 'd05_scope_memo',
    stage: 'scope',
    family: 'scope_document',
    tier: 'stub',
    status: 'not_started',
    requirementLevel: 'required',
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: 'markdown',
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: '2026-05-07T20:00:00Z',
    updatedAt: '2026-05-07T20:00:00Z',
    ...overrides,
  };
}

function makeCriterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: 'c1',
    sourceEventId: 'evt-canvas-1',
    tenantKey: 'apexretail',
    criterionId: 'GATE-SCOPE-01',
    fromStage: 'scope',
    toStage: 'rfp',
    state: 'pending',
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: '2026-05-07T20:00:00Z',
    updatedAt: '2026-05-07T20:00:00Z',
    ...overrides,
  };
}

function makeEvidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: 'e1',
    sourceEventId: 'evt-canvas-1',
    tenantKey: 'apexretail',
    requirementId: 'EVID-SRC-SCOPE-TICKET-HISTORY',
    stage: 'scope',
    currentState: 'Loaded',
    sourceArtifactId: null,
    notes: 'ServiceNow sync 14d stale',
    lastSyncedAt: '2026-04-23T00:00:00Z',
    createdAt: '2026-05-07T20:00:00Z',
    updatedAt: '2026-05-07T20:00:00Z',
    ...overrides,
  };
}

function render(
  options: {
    artifactStates?: SourceEventArtifactState[];
    gateCriterionStates?: SourceEventGateCriterion[];
    evidenceStates?: SourceEventEvidence[];
    templateByCode?: Record<string, string | null>;
    viewStage?: SourceEventArtifactState['stage'];
  } = {},
): string {
  return renderToStaticMarkup(
    createElement(UniversalCanvasShell, {
      event: makeEvent(),
      viewStage: options.viewStage ?? 'scope',
      artifactStates: options.artifactStates ?? [makeArtifactState()],
      gateCriterionStates: options.gateCriterionStates ?? [makeCriterion()],
      evidenceStates: options.evidenceStates ?? [makeEvidence()],
      templateByCode: options.templateByCode ?? {
        d05_scope_memo: '# Scope Memo\n\n§1 In scope ...',
      },
      activityEntries: [],
      tenantName: 'Apex Retail Group',
    }),
  );
}

describe('UniversalCanvasShell · SSR render', () => {
  it('renders id strip with breadcrumb + title + status', () => {
    const html = render();
    expect(html).toContain('source-canvas-id-strip');
    expect(html).toContain('Source');
    expect(html).toContain('SRC-APX-001');
    expect(html).toContain('AMS Outsourcing 2026');
    expect(html).toContain('Active');
    expect(html).toContain('APEX'); // tenant abbreviation
  });

  it('renders 11-step rail with all canonical stages', () => {
    const html = render();
    expect(html).toContain('source-canvas-step-rail');
    for (const stage of [
      'strategy',
      'scope',
      'rfp',
      'responses',
      'evaluation',
      'pricing',
      'bafo',
      'executive_decision',
      'selection',
      'transition',
      'value',
    ]) {
      expect(html).toContain(`source-canvas-step-${stage}`);
    }
  });

  it('renders chat lane with stage-specific lead agent and 3 choices', () => {
    const html = render();
    expect(html).toContain('source-canvas-chat-lane');
    // Scope stage → Nexus
    expect(html).toContain('Nexus');
    expect(html).toContain('source-canvas-choice-0');
    expect(html).toContain('source-canvas-choice-1');
    expect(html).toContain('source-canvas-choice-2');
  });

  it('renders sticky chat input', () => {
    const html = render();
    expect(html).toContain('source-canvas-chat-input');
    expect(html).toContain('Ask Nexus…');
  });

  it('renders workspace with all four tabs', () => {
    const html = render();
    expect(html).toContain('source-canvas-workspace');
    expect(html).toContain('source-canvas-tab-document');
    expect(html).toContain('source-canvas-tab-gate');
    expect(html).toContain('source-canvas-tab-evidence');
    expect(html).toContain('source-canvas-tab-log');
  });

  it('document tab is active by default + renders artifact + template body', () => {
    const html = render();
    expect(html).toContain('data-active-tab="document"');
    expect(html).toContain('source-canvas-document-tab');
    expect(html).toContain('source-canvas-artifact-d05_scope_memo');
    expect(html).toContain('Scope Memo with Boundaries'); // canonical name
    expect(html).toContain('§1 In scope'); // template body content
  });

  it('renders splitter handle as a separator with role + aria', () => {
    const html = render();
    expect(html).toContain('source-canvas-splitter');
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
  });

  it('context bundle reflects artifact + criterion + evidence counts', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd04_app_inv' }),
        makeArtifactState({ artifactCode: 'd05_scope_memo' }),
      ],
      gateCriterionStates: [
        makeCriterion({ criterionId: 'GATE-SCOPE-01', state: 'met' }),
        makeCriterion({ criterionId: 'GATE-SCOPE-02', state: 'pending' }),
      ],
      evidenceStates: [
        makeEvidence({ requirementId: 'EVID-1', currentState: 'Usable Evidence' }),
        makeEvidence({ requirementId: 'EVID-2', currentState: 'Loaded' }),
      ],
    });
    // 1 of 2 evidence sources usable → readiness "1 / 2"
    expect(html).toContain('Readiness 1 / 2');
    // 0 promoted artifacts of 2 total → artifacts "0 / 2"
    expect(html).toContain('Artifacts 0 / 2');
  });

  // ── B4: suggested chat prompts populate the composer ──────────────────────
  it('renders the empty-thread hint that explains what the agent can do', () => {
    const html = render();
    // Agent depends on the stage — scope → Nexus per leadAgentForStage.
    expect(html).toMatch(/Ask (Nexus|Sentinel|Atlas|Steward) anything about this step/);
    // The new subtitle covers the "what does the agent do?" gap.
    expect(html).toMatch(
      /can draft any artifact, run the gate check, and propose your[\s]+next move/,
    );
    // Choice strip label reflects the populate-not-submit semantics.
    expect(html).toContain('Try one for');
    expect(html).not.toContain('Three choices for');
  });

  // ── Slice 2 · xlsx download anchor ────────────────────────────────────────
  it('renders Download xlsx template anchor on d19 pricing workbook', () => {
    const html = render({
      viewStage: 'pricing',
      artifactStates: [
        makeArtifactState({
          artifactCode: 'd19_pricing_workbook',
          stage: 'pricing',
        }),
      ],
    });
    expect(html).toContain(
      'source-canvas-document-body-download-xlsx-d19_pricing_workbook',
    );
    expect(html).toContain('Download xlsx template');
    // Anchor links to the GET endpoint with the event UUID + code.
    expect(html).toMatch(
      /href="[^"]*\/api\/v1\/source\/[^/]+\/artifacts\/d19_pricing_workbook\/render-xlsx"/,
    );
  });

  it('does NOT render Download xlsx anchor on artifacts without an xlsx renderer', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd05_scope_memo', stage: 'scope' }),
      ],
    });
    expect(html).not.toContain('source-canvas-document-body-download-xlsx-');
  });

  // ── Slice 1 · Generate with Sentinel ──────────────────────────────────────
  it('renders Generate with Sentinel button on a generatable artifact (d01)', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd01_strategy_memo', body: null }),
      ],
    });
    // d01 / d05 / d09 are wired in the prompt registry; UniversalCanvasShell
    // exposes them via generatableCodes.
    expect(html).toContain('source-canvas-document-body-generate-d01_strategy_memo');
    expect(html).toContain('Generate with Sentinel');
  });

  it('button label flips to Regenerate once a body is authored (or generated)', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: 'd01_strategy_memo',
          body: '# Authored content',
        }),
      ],
    });
    expect(html).toContain('Regenerate with Sentinel');
  });

  it('does NOT render Generate button on artifacts not in the prompt registry', () => {
    const html = render({
      artifactStates: [
        // d05 is not the artifact we set up here; the active will be d05_scope_memo
        // override → fixture default code is overridden via the makeArtifactState
        // shape. Use a code that's NOT in the registry (d04_app_inv).
        makeArtifactState({ artifactCode: 'd04_app_inv', body: null }),
      ],
    });
    // d04 isn't in the prompt registry yet — Slice 1 covers d01 / d05 / d09 only.
    expect(html).not.toContain('source-canvas-document-body-generate-d04_app_inv');
  });

  // ── Inline body editor (per-event content) ────────────────────────────────
  it('renders the Edit / Author body button on the active artifact', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd05_scope_memo', body: null }),
      ],
    });
    // Button surfaces because UniversalCanvasShell wires onSaveBody.
    expect(html).toContain('source-canvas-document-body-edit-d05_scope_memo');
    // Badge tells the user the displayed content is template scaffold,
    // not authored.
    expect(html).toContain('Template scaffold (not yet authored)');
  });

  it('shows authored content + Edit button when artifact body is non-null', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: 'd05_scope_memo',
          body: '# Scope Memo\n\nReal authored content for this event.',
          bodyAuthoredBy: 'user_clerk_123',
        }),
      ],
    });
    expect(html).toContain('Real authored content for this event');
    expect(html).toContain('Authored content');
    expect(html).toContain('source-canvas-document-body-edit-d05_scope_memo');
  });

  // ── B1: artifact mark-complete ─────────────────────────────────────────────
  it('renders Mark complete button + status pill for non-terminal artifacts', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd05_scope_memo', status: 'drafting' }),
      ],
    });
    // Pill in the row + the body header.
    expect(html).toContain('source-canvas-artifact-status-drafting');
    expect(html).toContain('Drafting');
    // Mark complete button is present and testable.
    expect(html).toContain('source-canvas-artifact-mark-complete-d05_scope_memo');
    expect(html).toContain('Mark complete');
    // No reopen button when not approved.
    expect(html).not.toContain('source-canvas-artifact-reopen-d05_scope_memo');
  });

  it('renders Reopen instead of Mark complete when artifact is approved', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd05_scope_memo', status: 'approved' }),
      ],
    });
    expect(html).toContain('source-canvas-artifact-status-approved');
    expect(html).toContain('Approved');
    expect(html).toContain('source-canvas-artifact-reopen-d05_scope_memo');
    expect(html).not.toContain('source-canvas-artifact-mark-complete-d05_scope_memo');
  });

  it('hides both buttons for locked / superseded artifacts', () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: 'd05_scope_memo', status: 'locked' }),
      ],
    });
    expect(html).toContain('source-canvas-artifact-status-locked');
    expect(html).not.toContain('source-canvas-artifact-mark-complete-d05_scope_memo');
    expect(html).not.toContain('source-canvas-artifact-reopen-d05_scope_memo');
  });

  it('renders empty state for unknown viewStage gracefully', () => {
    const html = renderToStaticMarkup(
      createElement(UniversalCanvasShell, {
        event: makeEvent(),
        viewStage: 'rfp', // current is scope, viewing rfp with no rows
        artifactStates: [],
        gateCriterionStates: [],
        evidenceStates: [],
        templateByCode: {},
        activityEntries: [],
        tenantName: 'Apex Retail Group',
      }),
    );
    expect(html).toContain('source-canvas-document-tab');
    expect(html).toContain('No artifacts scaffolded');
  });
});

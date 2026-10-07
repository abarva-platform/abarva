/**
 * @jest-environment jsdom
 */
/**
 * U-571 — the reasoning Explain drawer, proven through its hosts.
 *
 * WHY THIS SUITE EXISTS
 *
 * `buildGateSummaryLine` is the Explain drawer's gate headline, and until this
 * suite the only thing that executed it was `gate-summary-line.test.ts` — a
 * unit test of the builder, calling it directly. So the strings a reader is
 * shown were proven at the function and nowhere else: no test rendered
 * `ExplainQuoteDrawer`, no test rendered any of its hosts, and no test opened
 * the drawer the way a user opens it. Measured on `05896d1a2f`: zero suites in
 * `src/` referenced `ExplainQuoteDrawer`, `ExplainQuotePill`,
 * `StageSynthesisDrawer`, `AtlasSynthesisQuote`, `SentinelSynthesisQuote` or
 * `NexusSynthesisQuote` at all.
 *
 * That matters because the drawer is reached from nowhere a user can get to.
 * Each host's reachability, measured on the same SHA:
 *
 *   • `NexusSynthesisQuote`  — imported only by `ProgramDetailPage`, whose
 *     route `/programs/[id]` is redirected away by `next.config.ts` to
 *     `/strategic-moves/:id`. Mounted in the tree; unreachable by URL.
 *   • `AtlasSynthesisQuote`  — referenced by nothing in the repository.
 *   • `SentinelSynthesisQuote` — referenced only inside a comment at
 *     `src/components/shell/AgentColumn.tsx:60`.
 *   • `StageSynthesisDrawer` — two hosts: `ProgramDetailPage` (redirected
 *     away, as above) and `SourceJourneyTrackerClient`, reached from
 *     `SentinelEngagementCanvas`, which this repository's own
 *     `src/lib/qa/active-route-ownership-map.ts` records as imported by no
 *     route.
 *
 * WHAT THIS SUITE DOES AND DOES NOT DECIDE
 *
 * It does not decide the routing question — whether the Explain surface is
 * part of the product, and therefore whether these five components should be
 * routed or retired, is a product call recorded against U-571 and U-570. This
 * suite settles the half that is answerable by execution: given a host that
 * IS mounted, what does the drawer actually put on screen? That is what three
 * waves of reasoning-layer merges have had no way to verdict.
 *
 * Nothing here mounts a component in order to make it reachable. These are
 * tests, not call sites: they execute the hosts that already exist and record
 * what each one renders, including the two findings that contradict the
 * item's own description (see the `CompareWithDropdown` and
 * `StageSynthesisDrawer` cases).
 */

import { TextDecoder as NodeTextDecoder } from 'node:util';

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CompareWithDropdown } from '@/components/_shared/CompareWithDropdown';
import { StageSynthesisDrawer } from '@/components/_shared/StageSynthesisDrawer';
import { NexusSynthesisQuote } from '@/components/programs/NexusSynthesisQuote';
import { SentinelSynthesisQuote } from '@/components/source/SentinelSynthesisQuote';
import { AtlasSynthesisQuote } from '@/components/tower/AtlasSynthesisQuote';
import type { ExplanationPayload } from '@/lib/reasoning/explanation-serializer';
import type { GateStatusCounts } from '@/lib/reasoning/gate-summary-line';

// jsdom defines neither `TextDecoder` nor `TextEncoder`, and all three
// synthesis hosts decode their stream with `new TextDecoder()`. Without this
// the decode throws, the hosts' own `.catch` swallows it into `setError(true)`,
// and every case below fails as "no Explain pill" — which reads as the pill
// being absent from the host rather than as a missing jsdom global. The
// browser has it; supply it so the failure modes under test are the real ones.
if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as unknown as { TextDecoder: typeof NodeTextDecoder }).TextDecoder =
    NodeTextDecoder;
}

const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * A gate partition with all four statuses present and distinct, so each clause
 * of the headline is pinned by a different number. A fixture where two counts
 * coincide cannot tell `partial` reported as `unmet` from a correct line, which
 * is the exact pair of defects `gate-summary-line.ts` was written against.
 */
const MIXED_GATES: GateStatusCounts = {
  total: 9,
  met: 4,
  partial: 2,
  waived: 1,
  unmet: 2,
};

/** The singular case. `total: 1` is reachable — one program context builder
 *  constructs it literally — and it is the only input that distinguishes
 *  "criterion" from "criteria". */
const SINGLE_GATE: GateStatusCounts = {
  total: 1,
  met: 0,
  partial: 0,
  waived: 0,
  unmet: 1,
};

function makeExplanationPayload(
  surface: ExplanationPayload['surface'],
  instanceId: string,
  gateSummary: GateStatusCounts,
  instanceType: ExplanationPayload['instanceType'] = 'source-event',
): ExplanationPayload {
  return {
    surface,
    instanceId,
    instanceType,
    patternId: 'competitive-sourcing',
    patternVersion: '3',
    currentStage: 'evaluation',
    gateSummary,
    citations: [],
    gates: [],
    contradictions: [],
    failureModes: [],
    cascadeImpacts: [],
  };
}

function makeStreamBody(text: string) {
  // Built by char code rather than `TextEncoder`, which jsdom does not define.
  // The hosts decode with `TextDecoder`, which jsdom does provide; the fixture
  // text is ASCII, so the two agree.
  const bytes = new Uint8Array(Array.from(text).map((c) => c.charCodeAt(0)));
  let yielded = false;
  return {
    getReader() {
      return {
        async read() {
          if (yielded) return { done: true, value: undefined as Uint8Array | undefined };
          yielded = true;
          return { done: false, value: bytes };
        },
      };
    },
  };
}

/**
 * Route both fetches the host→drawer path makes: the surface's own synthesis
 * stream, and `/api/reasoning/explain`, which is the only place the drawer's
 * `gateSummary` can come from.
 */
function stubFetch(explanation: ExplanationPayload, streamed = 'Streamed synthesis.') {
  const explainCalls: string[] = [];
  const fetchStub = jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input);
    if (url.startsWith('/api/reasoning/explain')) {
      explainCalls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => explanation,
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers({ ETag: 'W/"stub"', 'X-Synthesis-Event-Id': 'evt_stub' }),
      body: makeStreamBody(streamed),
    } as unknown as Response;
  });
  global.fetch = fetchStub as unknown as typeof fetch;
  return { fetchStub, explainCalls };
}

/** Open the drawer the way a user does: find the Explain pill, click it. */
async function openExplainDrawer() {
  const pill = await screen.findByTestId('explain-quote-pill');
  await act(async () => {
    fireEvent.click(pill);
  });
  return screen.findByTestId('explain-summary');
}

beforeEach(() => {
  jest.restoreAllMocks();
});

// ─── The three hosts that do mount the pill ──────────────────────────────────

describe('U-571 · the Explain drawer, reached through each host that mounts the pill', () => {
  it('AtlasSynthesisQuote (tower) reaches the drawer, and the gate headline names what it counted', async () => {
    const { explainCalls } = stubFetch(
      makeExplanationPayload('tower', 'tower', MIXED_GATES),
    );

    render(<AtlasSynthesisQuote fallback="Portfolio synthesis loading…" />);
    const summary = await openExplainDrawer();

    // The instance the drawer asks about is the one the host declared, not a
    // default: a host that passed the wrong surface would still render a line.
    expect(explainCalls).toHaveLength(1);
    expect(explainCalls[0]).toContain('surface=tower');
    expect(explainCalls[0]).toContain('instanceId=tower');

    // Every clause, each pinned by a different number.
    expect(summary).toHaveTextContent('4 of 9 gate criteria met');
    expect(summary).toHaveTextContent('2 partial');
    expect(summary).toHaveTextContent('1 waived, not met');
    expect(summary).toHaveTextContent('2 unmet');
  });

  it('SentinelSynthesisQuote (source) reaches the drawer and carries its instance id through', async () => {
    const { explainCalls } = stubFetch(
      makeExplanationPayload('source', 'evt_sourcing_01', MIXED_GATES),
    );

    render(
      <SentinelSynthesisQuote
        instanceId="evt_sourcing_01"
        fallback="Sourcing synthesis loading…"
      />,
    );
    const summary = await openExplainDrawer();

    expect(explainCalls).toHaveLength(1);
    expect(explainCalls[0]).toContain('surface=source');
    expect(explainCalls[0]).toContain('instanceId=evt_sourcing_01');
    expect(summary).toHaveTextContent('4 of 9 gate criteria met');
  });

  it('NexusSynthesisQuote (programs) reaches the drawer — the host route is redirected away, the component is not broken', async () => {
    const { explainCalls } = stubFetch(
      makeExplanationPayload('programs', 'prog_7', MIXED_GATES),
    );

    render(<NexusSynthesisQuote programId="prog_7" fallback="Program synthesis loading…" />);
    const summary = await openExplainDrawer();

    expect(explainCalls).toHaveLength(1);
    expect(explainCalls[0]).toContain('surface=programs');
    expect(explainCalls[0]).toContain('instanceId=prog_7');
    expect(summary).toHaveTextContent('4 of 9 gate criteria met');
  });

  it('the headline agrees its noun with the figure — one criterion is never "1 criteria"', async () => {
    stubFetch(makeExplanationPayload('tower', 'tower', SINGLE_GATE));

    render(<AtlasSynthesisQuote fallback="Portfolio synthesis loading…" />);
    const summary = await openExplainDrawer();

    expect(summary).toHaveTextContent('0 of 1 gate criterion met');
    expect(summary).toHaveTextContent('1 unmet');
    expect(summary).not.toHaveTextContent('gate criteria met');
  });

  it('a waived criterion is never reported as met on the rendered line', async () => {
    // The one claim this surface may not make. `gatesSummary.met` folds waived
    // into met; the drawer's own partition must not, and this asserts it at the
    // pixel rather than at the builder.
    stubFetch(
      makeExplanationPayload('tower', 'tower', {
        total: 2,
        met: 0,
        partial: 0,
        waived: 2,
        unmet: 0,
      }),
    );

    render(<AtlasSynthesisQuote fallback="Portfolio synthesis loading…" />);
    const summary = await openExplainDrawer();

    expect(summary).toHaveTextContent('0 of 2 gate criteria met');
    expect(summary).toHaveTextContent('2 waived, not met');
    // The old line rendered `2 of 2 ... met` for exactly this input.
    expect(summary).not.toHaveTextContent('2 of 2');
  });

  it('an empty partition says so rather than rendering "0 of 0"', async () => {
    stubFetch(
      makeExplanationPayload('tower', 'tower', {
        total: 0,
        met: 0,
        partial: 0,
        waived: 0,
        unmet: 0,
      }),
    );

    render(<AtlasSynthesisQuote fallback="Portfolio synthesis loading…" />);
    const summary = await openExplainDrawer();

    expect(summary).toHaveTextContent('No gate criteria evaluated');
    expect(summary).not.toHaveTextContent('0 of 0');
  });

  it('the drawer is closed until the pill is clicked — the gate line is not rendered behind it', async () => {
    stubFetch(makeExplanationPayload('tower', 'tower', MIXED_GATES));

    render(<AtlasSynthesisQuote fallback="Portfolio synthesis loading…" />);
    await screen.findByTestId('explain-quote-pill');

    expect(screen.queryByTestId('explain-quote-drawer-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('explain-summary')).not.toBeInTheDocument();
  });
});

// ─── The two hosts the item names that do NOT render a gate line ─────────────

describe('U-571 · the two hosts whose description the measurement contradicts', () => {
  /**
   * U-571 names `CompareWithDropdown` as one of four `ExplainQuotePill`
   * importers. On `05896d1a2f` it is not an importer: the only occurrence of
   * the name in that file is a comment at line 11 describing the ghost-button
   * style it matches. Three components import the pill, not four. Asserted
   * rather than corrected in prose, because the file reads as though it hosts
   * the pill and the next reader would make the same mistake.
   */
  it('CompareWithDropdown does not host the Explain pill, so it is not a route to the drawer', () => {
    stubFetch(makeExplanationPayload('programs', 'prog_7', MIXED_GATES));

    render(
      <CompareWithDropdown
        currentInstanceId="prog_7"
        allOtherIds={{
          sourceEvents: ['evt_sourcing_01'],
          programs: ['prog_7', 'prog_8'],
        }}
      />,
    );

    // The component returns `null` when the catalogue minus the current
    // instance is empty, and a null render satisfies both absence assertions
    // below for the wrong reason. Pin the positive first.
    expect(screen.getByTestId('compare-with-dropdown')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'prog_8' })).toBeInTheDocument();

    expect(screen.queryByTestId('explain-quote-pill')).not.toBeInTheDocument();
    expect(screen.queryByTestId('explain-quote-drawer-overlay')).not.toBeInTheDocument();
  });

  /**
   * U-571 asks what "the drawer's gate line" reads for `StageSynthesisDrawer`.
   * Executed, the answer is that it has none: this is a different drawer that
   * streams per-stage prose from `/api/reasoning/stage-synthesis` and never
   * calls `buildGateSummaryLine`. So no amount of routing work on this host
   * would make the gate headline observable, and the two drawers must not be
   * treated as one surface in the routing decision.
   */
  it('StageSynthesisDrawer renders no gate headline at all — it is a different drawer', async () => {
    const fetchStub = jest.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          body: makeStreamBody('Evaluation stage: three bids scored, one pending.'),
        }) as unknown as Response,
    );
    global.fetch = fetchStub as unknown as typeof fetch;

    render(
      <StageSynthesisDrawer
        open
        instanceId="evt_sourcing_01"
        stageId="evaluation"
        stageLabel="Evaluation"
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalled();
    });
    await screen.findByText(/three bids scored/);

    expect(screen.queryByTestId('explain-summary')).not.toBeInTheDocument();
    // The phrases the gate headline can emit, in every form it can take.
    expect(screen.queryByText(/gate criteri(on|a) met/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No gate criteria evaluated/)).not.toBeInTheDocument();
    expect(screen.queryByText(/waived, not met/)).not.toBeInTheDocument();
  });
});

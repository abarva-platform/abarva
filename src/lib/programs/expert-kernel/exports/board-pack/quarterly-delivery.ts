import 'server-only';

import { buildBoardPack } from '@/lib/tower/board-pack';
import {
  buildOutcomeLedgerView,
  buildTowerAdoptionRealizationView,
  readOutcomeLedger,
  type OutcomeLedgerView,
} from '@/lib/tower/outcome-ledger';
import { buildExecutiveActionQueue } from '@/lib/tower/action-queue/executive-action-queue';
import {
  sendEmail,
  type EmailDispatchResult,
} from '@/lib/notifications/channels/email-resend';
import {
  buildQuarterlyBoardPack,
  type QuarterlyBoardPack,
  type QuarterlyBoardPackInput,
} from './quarterly-board-pack-model';
import { renderBoardPackHtml } from './html-renderer';

export interface QuarterlyBoardPackClientConfig {
  readonly clientKey: string;
  readonly clientLabel: string;
  readonly recipients: readonly string[];
}

export interface QuarterlyBoardPackDeliveryConfig {
  readonly clients: readonly QuarterlyBoardPackClientConfig[];
  readonly quarter: string;
  readonly generatedOn: string;
}

export interface QuarterlyBoardPackSend {
  readonly clientKey: string;
  readonly recipient: string;
  readonly ok: boolean;
  readonly providerMessageId?: string;
  readonly reason?: string;
}

export interface QuarterlyBoardPackDeliveryResult {
  readonly ok: boolean;
  readonly generated: number;
  readonly attempted: number;
  readonly sent: number;
  readonly failed: number;
  readonly skipped: number;
  readonly durationMs: number;
  readonly sends: readonly QuarterlyBoardPackSend[];
}

export interface QuarterlyBoardPackDeliveryDeps {
  readonly readLedger?: (clientKey: string) => Promise<OutcomeLedgerView>;
  readonly send?: (input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    tags?: Record<string, string>;
  }) => Promise<EmailDispatchResult>;
  readonly nowMs?: () => number;
}

function normalizeRecipient(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseBoardPackClientConfig(
  raw: string | undefined,
): readonly QuarterlyBoardPackClientConfig[] {
  if (!raw || raw.trim().length === 0) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('BOARD_PACK_CXO_RECIPIENTS_JSON must be a JSON array.');
  }
  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Board-pack client config at index ${index} is not an object.`);
    }
    const row = item as Record<string, unknown>;
    const clientKey = typeof row.clientKey === 'string' ? row.clientKey.trim() : '';
    const clientLabel =
      typeof row.clientLabel === 'string' ? row.clientLabel.trim() : clientKey;
    const recipients = Array.isArray(row.recipients)
      ? row.recipients
          .filter((v): v is string => typeof v === 'string')
          .map(normalizeRecipient)
          .filter((v): v is string => v !== null)
      : [];
    if (!clientKey) {
      throw new Error(`Board-pack client config at index ${index} is missing clientKey.`);
    }
    return { clientKey, clientLabel, recipients };
  });
}

export function currentQuarter(date: Date): string {
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
}

export function resolveQuarterlyDeliveryConfig(now = new Date()): QuarterlyBoardPackDeliveryConfig {
  return {
    clients: parseBoardPackClientConfig(process.env.BOARD_PACK_CXO_RECIPIENTS_JSON),
    quarter: process.env.BOARD_PACK_QUARTER?.trim() || currentQuarter(now),
    generatedOn: now.toISOString().slice(0, 10),
  };
}

function moveStatus(entry: OutcomeLedgerView['entries'][number]) {
  if (entry.governanceReviewStatus === 'flagged') return 'blocked' as const;
  if (entry.unevidencedVerifiedClaim) return 'watch' as const;
  if (entry.valueTier === 'verified' && entry.evidenceBacked) return 'on_track' as const;
  return 'watch' as const;
}

export function buildQuarterlyBoardPackInputFromLedger(params: {
  readonly clientKey: string;
  readonly clientLabel: string;
  readonly quarter: string;
  readonly generatedOn: string;
  readonly ledger: OutcomeLedgerView;
}): QuarterlyBoardPackInput {
  const realization = buildTowerAdoptionRealizationView(params.ledger);
  const boardPack = buildBoardPack(
    params.ledger,
    realization,
    buildExecutiveActionQueue([]),
  );
  const entries = params.ledger.entries;
  const evidenceGaps = boardPack.evidenceLinks.filter((link) => link.isGap);

  return {
    clientKey: params.clientKey,
    clientLabel: params.clientLabel,
    quarter: params.quarter,
    generatedOn: params.generatedOn,
    towerBoardPack: boardPack,
    moves: entries.slice(0, 8).map((entry) => ({
      name: entry.subjectLabel,
      phase: entry.valueRung.replace(/_/g, ' '),
      status: moveStatus(entry),
      owner: entry.measurementOwnerRole ?? 'Measurement owner not assigned',
      nextGate:
        entry.governanceReviewStatus === 'flagged'
          ? 'Clear governance flag'
          : entry.evidenceBacked
            ? 'Continue measurement'
            : 'Bind value evidence',
    })),
    blockedDecisions: boardPack.topDecisions.map((decision) => ({
      move: decision.initiative,
      decision: decision.decision,
      owner: 'Board sponsor not instrumented',
      timeInState: 'not instrumented',
      rationale: decision.rationale,
    })),
    patterns: evidenceGaps.slice(0, 5).map((gap) => ({
      pattern: 'Evidence gap on value claim',
      evidence: `${gap.initiative}: ${gap.reference}`,
      action: 'Bind source evidence before the value claim is quoted externally.',
    })),
    recommendedSequence: boardPack.actionsRequired.slice(0, 5).map((action, index) => ({
      sequence: String(index + 1),
      move: action.initiative,
      rationale: action.action,
    })),
    riskHorizon: [
      ...(evidenceGaps.length > 0
        ? [
            {
              title: 'Evidence gaps remain open',
              severity: 'high' as const,
              exposure: `${evidenceGaps.length} value claim${
                evidenceGaps.length === 1 ? '' : 's'
              } lack bound evidence.`,
              nextAction:
                'Assign an owner to bind ledger evidence before the next quarterly review.',
            },
          ]
        : []),
      ...(realization.adoption.instrumentationGap
        ? [
            {
              title: 'Adoption instrumentation gap',
              severity: 'moderate' as const,
              exposure: 'Adoption telemetry is not fully bound to value realization.',
              nextAction: 'Close telemetry binding before expanding the portfolio.',
            },
          ]
        : []),
    ],
    topQuestions: [
      {
        owner: 'CFO',
        question: 'Which committed value is verified and evidence-backed?',
        whyNow: boardPack.spendAtRisk.headline,
      },
      {
        owner: 'CIO',
        question: 'Which Moves need evidence binding before the next gate?',
        whyNow:
          evidenceGaps.length > 0
            ? `${evidenceGaps.length} evidence gap(s) are open.`
            : 'No open evidence gaps are visible in the board pack.',
      },
      {
        owner: 'COO',
        question: 'Which next-quarter sequence should change based on value evidence?',
        whyNow: boardPack.valueChange.earningSummary,
      },
    ],
  };
}

export function renderBoardPackText(pack: QuarterlyBoardPack): string {
  const lines = [
    pack.title,
    `Client: ${pack.clientLabel}`,
    `Quarter: ${pack.quarter}`,
    `Generated: ${pack.generatedOn}`,
    '',
  ];
  for (const section of pack.sections) {
    lines.push(`${section.ordinal}. ${section.title}`, section.summary);
    for (const row of section.rows) {
      lines.push(`- ${row.label}: ${row.value}${row.detail ? ` (${row.detail})` : ''}`);
    }
    lines.push('');
  }
  lines.push(pack.disclaimer);
  return lines.join('\n');
}

export async function deliverQuarterlyBoardPacks(
  config: QuarterlyBoardPackDeliveryConfig,
  deps: QuarterlyBoardPackDeliveryDeps = {},
): Promise<QuarterlyBoardPackDeliveryResult> {
  const start = deps.nowMs?.() ?? Date.now();
  const readLedgerFn = deps.readLedger ?? readOutcomeLedger;
  const sendFn = deps.send ?? sendEmail;
  const sends: QuarterlyBoardPackSend[] = [];
  let generated = 0;
  let skipped = 0;

  for (const client of config.clients) {
    if (client.recipients.length === 0) {
      skipped += 1;
      continue;
    }
    const ledger = await readLedgerFn(client.clientKey);
    const input = buildQuarterlyBoardPackInputFromLedger({
      clientKey: client.clientKey,
      clientLabel: client.clientLabel,
      quarter: config.quarter,
      generatedOn: config.generatedOn,
      ledger,
    });
    const pack = buildQuarterlyBoardPack(input);
    generated += 1;
    const html = renderBoardPackHtml(pack);
    const text = renderBoardPackText(pack);
    for (const recipient of client.recipients) {
      const result = await sendFn({
        to: recipient,
        subject: `${pack.clientLabel} ${pack.quarter} Board Pack`,
        html,
        text,
        tags: {
          event: 'quarterly_board_pack',
          client: client.clientKey,
          quarter: config.quarter,
        },
      });
      if (result.ok) {
        sends.push({
          clientKey: client.clientKey,
          recipient,
          ok: true,
          providerMessageId: result.providerMessageId,
        });
      } else {
        sends.push({
          clientKey: client.clientKey,
          recipient,
          ok: false,
          reason: result.reason,
        });
      }
    }
  }

  const sent = sends.filter((send) => send.ok).length;
  const failed = sends.length - sent;
  const end = deps.nowMs?.() ?? Date.now();
  return {
    ok: failed === 0,
    generated,
    attempted: sends.length,
    sent,
    failed,
    skipped,
    durationMs: Math.max(0, end - start),
    sends,
  };
}

export function emptyOutcomeLedger(clientKey: string): OutcomeLedgerView {
  return buildOutcomeLedgerView(clientKey, []);
}

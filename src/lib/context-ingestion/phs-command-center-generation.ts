import type { AiDataClass } from '@/lib/integrations/ai-egress';
import { preflightOpenAIDirectClient } from '@/lib/integrations/ai-egress';

import {
  evaluatePHSStageReadiness,
  type PHSStageReadiness,
  type PHSStageReadinessInput,
} from './phs-stage-readiness';

export type PHSCommandCenterArtifactKind =
  | 'current-state-operating-model'
  | 'ai-strategy-memo'
  | 'use-case-portfolio-scorecard'
  | 'databricks-target-architecture'
  | 'investment-benefits-realization'
  | 'mobilization-plan';

export interface PHSGenerationEvidenceRef {
  evidenceId: string;
  title: string;
  sourceType: string;
  summary: string;
}

export interface PHSGenerationCorpusPatternRef {
  patternId: string;
  title: string;
  domain: string;
  summary: string;
}

export interface PHSGenerationWorkloadRef {
  workloadId: string;
  workloadName: string;
  domain: string;
  currentPlatform: string;
  modernizationDisposition: string;
  phiLevel: string;
}

export interface PHSGenerationPromptInput {
  artifactKind: PHSCommandCenterArtifactKind;
  phase: '1' | '2' | '3' | '4' | '5';
  tenantId: string;
  clientName: string;
  audience: string;
  stageReadiness: PHSStageReadiness;
  evidenceRefs: readonly PHSGenerationEvidenceRef[];
  corpusPatternRefs: readonly PHSGenerationCorpusPatternRef[];
  workloadRefs?: readonly PHSGenerationWorkloadRef[];
  humanInputs?: readonly string[];
  additionalInstructions?: string;
}

export interface PHSOpenAIResponsesClient {
  responses: {
    create(args: {
      model: string;
      instructions: string;
      input: string;
      max_output_tokens: number;
      store: false;
      metadata: Record<string, string>;
    }): Promise<{
      output_text: string;
      model?: string;
      status?: string;
      incomplete_details?: { reason?: string | null } | null;
      usage?: { input_tokens?: number; output_tokens?: number } | null;
    }>;
  };
}

export interface PHSOpenAIPreflightOk {
  ok: true;
  client: PHSOpenAIResponsesClient;
  auditId: string;
  dataClass: AiDataClass;
}

export interface PHSOpenAIPreflightDenied {
  ok: false;
  reason: string;
  auditId: string;
  dataClass: AiDataClass;
  policyDecision: string;
}

export type PHSOpenAIPreflightResult =
  | PHSOpenAIPreflightOk
  | PHSOpenAIPreflightDenied;

export type PHSOpenAIPreflightFn = (args: {
  tenantId: string;
  userId?: string;
  workflow: string;
  prompt: string;
  model: string;
  dataClass?: AiDataClass;
  artifactId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
}) => Promise<PHSOpenAIPreflightResult>;

export interface GeneratePHSCommandCenterArtifactArgs
  extends Omit<PHSGenerationPromptInput, 'stageReadiness'> {
  userId?: string;
  artifactId: string;
  readinessInput: PHSStageReadinessInput;
  model?: string;
  maxOutputTokens?: number;
  preflightFn?: PHSOpenAIPreflightFn;
}

export type PHSCommandCenterGenerationResult =
  | {
      status: 'blocked';
      blockers: string[];
      readiness: PHSStageReadiness;
      openAiCalled: false;
    }
  | {
      status: 'generated';
      text: string;
      auditId: string;
      model: string;
      tokensIn: number | null;
      tokensOut: number | null;
      stopReason: string | null;
      evidenceIds: string[];
      corpusPatternIds: string[];
      readiness: PHSStageReadiness;
      openAiCalled: true;
    };

const DEFAULT_OPENAI_MODEL = process.env.PHS_COMMAND_CENTER_OPENAI_MODEL ?? 'gpt-5.1';
const DEFAULT_MAX_OUTPUT_TOKENS = 2400;

function listBlock(name: string, rows: readonly string[]): string {
  if (rows.length === 0) return `${name}:\n- None supplied.`;
  return `${name}:\n${rows.map((row) => `- ${row}`).join('\n')}`;
}

function readinessSummary(readiness: PHSStageReadiness): string {
  const templates = readiness.templateCoverage
    .map((template) => `${template.templateId}=${template.chunksLoaded}`)
    .join(', ');
  return [
    `readyForStageAdvance=${readiness.readyForStageAdvance}`,
    `evidenceLedgerRows=${readiness.evidenceLedgerRows}`,
    `templateCoverage=${templates}`,
  ].join('; ');
}

export function buildPHSCommandCenterPrompt(
  input: PHSGenerationPromptInput,
): { systemPrompt: string; userMessage: string } {
  const evidenceRows = input.evidenceRefs.map(
    (ref) => `${ref.evidenceId} | ${ref.title} | ${ref.sourceType} | ${ref.summary}`,
  );
  const patternRows = input.corpusPatternRefs.map(
    (ref) => `${ref.patternId} | ${ref.domain} | ${ref.title} | ${ref.summary}`,
  );
  const workloadRows = (input.workloadRefs ?? []).map(
    (workload) =>
      `${workload.workloadId} | ${workload.workloadName} | ${workload.domain} | ${workload.currentPlatform} | ${workload.modernizationDisposition} | PHI=${workload.phiLevel}`,
  );

  const systemPrompt = [
    'You generate Meridian / PHS command-center artifacts for AbarVa.',
    'Use OpenAI only; do not refer to any other model provider.',
    'Do not invent facts, savings, scale, owners, dates, systems, or outcomes.',
    'Every material claim must cite at least one supplied evidence ID and, where the claim is a pattern or recommendation, one supplied corpus pattern ID.',
    'If evidence is missing, write an explicit gap instead of filling the blank.',
    'Use plain CXO-readable language. Do not expose database field names, raw JSON keys, or implementation jargon.',
    'Do not include PHI or patient-level examples.',
    'Keep the output action-oriented and suitable for CEO, CFO, CDIO, plan COO, and clinical leadership review.',
  ].join('\n');

  const userMessage = [
    `Client: ${input.clientName}`,
    `Tenant: ${input.tenantId}`,
    `Artifact: ${input.artifactKind}`,
    `Phase: ${input.phase}`,
    `Audience: ${input.audience}`,
    `Readiness: ${readinessSummary(input.stageReadiness)}`,
    listBlock('Evidence register references', evidenceRows),
    listBlock('Corpus pattern references', patternRows),
    listBlock('Workload inventory references', workloadRows),
    listBlock('Human-approved inputs', input.humanInputs ?? []),
    input.additionalInstructions ? `Additional instructions:\n${input.additionalInstructions}` : null,
    [
      'Required output sections:',
      '1. Executive answer',
      '2. Evidence used',
      '3. Recommended action',
      '4. Gaps / decisions needed',
      '5. Approval checkpoint',
    ].join('\n'),
  ].filter(Boolean).join('\n\n');

  return { systemPrompt, userMessage };
}

function collectGenerationBlockers(args: {
  readiness: PHSStageReadiness;
  evidenceRefs: readonly PHSGenerationEvidenceRef[];
  corpusPatternRefs: readonly PHSGenerationCorpusPatternRef[];
}): string[] {
  const blockers = [...args.readiness.blockers];
  if (args.evidenceRefs.length === 0) {
    blockers.push('No evidence references were supplied for artifact generation.');
  }
  if (args.corpusPatternRefs.length === 0) {
    blockers.push('No corpus pattern references were supplied for artifact generation.');
  }
  return blockers;
}

async function defaultPreflight(
  args: Parameters<PHSOpenAIPreflightFn>[0],
): Promise<PHSOpenAIPreflightResult> {
  const result = await preflightOpenAIDirectClient(args);
  if (!result.ok) return result;
  return {
    ...result,
    client: result.client as unknown as PHSOpenAIResponsesClient,
  };
}

export async function generatePHSCommandCenterArtifact(
  args: GeneratePHSCommandCenterArtifactArgs,
): Promise<PHSCommandCenterGenerationResult> {
  const readiness = evaluatePHSStageReadiness(args.readinessInput);
  const blockers = collectGenerationBlockers({
    readiness,
    evidenceRefs: args.evidenceRefs,
    corpusPatternRefs: args.corpusPatternRefs,
  });

  if (blockers.length > 0) {
    return {
      status: 'blocked',
      blockers,
      readiness,
      openAiCalled: false,
    };
  }

  const { systemPrompt, userMessage } = buildPHSCommandCenterPrompt({
    artifactKind: args.artifactKind,
    phase: args.phase,
    tenantId: args.tenantId,
    clientName: args.clientName,
    audience: args.audience,
    stageReadiness: readiness,
    evidenceRefs: args.evidenceRefs,
    corpusPatternRefs: args.corpusPatternRefs,
    workloadRefs: args.workloadRefs,
    humanInputs: args.humanInputs,
    additionalInstructions: args.additionalInstructions,
  });
  const model = args.model ?? DEFAULT_OPENAI_MODEL;
  const prompt = [systemPrompt, userMessage].join('\n\n');
  const preflight = await (args.preflightFn ?? defaultPreflight)({
    tenantId: args.tenantId,
    userId: args.userId,
    workflow: 'phs-command-center-artifact-generate',
    artifactId: args.artifactId,
    artifactType: args.artifactKind,
    model,
    prompt,
    dataClass: 'confidential',
    metadata: {
      phase: args.phase,
      artifactKind: args.artifactKind,
      evidenceIds: args.evidenceRefs.map((ref) => ref.evidenceId),
      corpusPatternIds: args.corpusPatternRefs.map((ref) => ref.patternId),
      readinessEvidenceRows: readiness.evidenceLedgerRows,
    },
  });

  if (!preflight.ok) {
    return {
      status: 'blocked',
      blockers: [preflight.reason],
      readiness,
      openAiCalled: false,
    };
  }

  const response = await preflight.client.responses.create({
    model,
    instructions: systemPrompt,
    input: userMessage,
    max_output_tokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    store: false,
    metadata: {
      workflow: 'phs-command-center-artifact-generate',
      tenantId: args.tenantId,
      artifactId: args.artifactId,
      artifactKind: args.artifactKind,
    },
  });

  return {
    status: 'generated',
    text: response.output_text.trim(),
    auditId: preflight.auditId,
    model: response.model ?? model,
    tokensIn: response.usage?.input_tokens ?? null,
    tokensOut: response.usage?.output_tokens ?? null,
    stopReason: response.incomplete_details?.reason ?? response.status ?? null,
    evidenceIds: args.evidenceRefs.map((ref) => ref.evidenceId),
    corpusPatternIds: args.corpusPatternRefs.map((ref) => ref.patternId),
    readiness,
    openAiCalled: true,
  };
}

import { NextRequest, NextResponse } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import {
  generatePHSCommandCenterArtifact,
  type PHSCommandCenterArtifactKind,
  type PHSGenerationCorpusPatternRef,
  type PHSGenerationEvidenceRef,
  type PHSGenerationWorkloadRef,
} from '@/lib/context-ingestion/phs-command-center-generation';
import type { PHSPhase0Manifest } from '@/lib/context-ingestion/phs-phase0-manifest';
import { getPHSStageReadinessInputForClient } from '@/lib/context-ingestion/phs-stage-readiness-read-model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PHSGenerationPhase = '1' | '2' | '3' | '4' | '5';

interface PHSCommandCenterGenerateBody {
  artifactId?: unknown;
  artifactKind?: unknown;
  phase?: unknown;
  clientName?: unknown;
  audience?: unknown;
  manifest?: unknown;
  evidenceRefs?: unknown;
  corpusPatternRefs?: unknown;
  workloadRefs?: unknown;
  humanInputs?: unknown;
  additionalInstructions?: unknown;
  model?: unknown;
  maxOutputTokens?: unknown;
}

const ARTIFACT_KINDS = new Set<PHSCommandCenterArtifactKind>([
  'current-state-operating-model',
  'ai-strategy-memo',
  'use-case-portfolio-scorecard',
  'databricks-target-architecture',
  'investment-benefits-realization',
  'mobilization-plan',
]);

const PHASES = new Set<PHSGenerationPhase>(['1', '2', '3', '4', '5']);

function stringField(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field}_required`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function artifactKind(value: unknown): PHSCommandCenterArtifactKind {
  const candidate = stringField(value, 'artifactKind') as PHSCommandCenterArtifactKind;
  if (!ARTIFACT_KINDS.has(candidate)) throw new Error('artifactKind_invalid');
  return candidate;
}

function phase(value: unknown): PHSGenerationPhase {
  const candidate = stringField(value, 'phase') as PHSGenerationPhase;
  if (!PHASES.has(candidate)) throw new Error('phase_invalid');
  return candidate;
}

function objectArray<T>(value: unknown, field: string): T[] {
  if (!Array.isArray(value)) throw new Error(`${field}_required`);
  return value as T[];
}

function optionalObjectArray<T>(value: unknown): T[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error('workloadRefs_invalid');
  return value as T[];
}

function stringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error('humanInputs_invalid');
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function manifest(value: unknown): PHSPhase0Manifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('manifest_required');
  }
  return value as PHSPhase0Manifest;
}

function optionalPositiveInteger(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('maxOutputTokens_invalid');
  }
  return value;
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let body: PHSCommandCenterGenerateBody;
  try {
    body = await request.json() as PHSCommandCenterGenerateBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const parsedManifest = manifest(body.manifest);
    const readinessInput = await getPHSStageReadinessInputForClient({
      clientId: tenancy.clientId,
      manifest: parsedManifest,
    });
    const result = await generatePHSCommandCenterArtifact({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      clientName: optionalString(body.clientName) ?? parsedManifest.clientName,
      audience: optionalString(body.audience) ?? 'CEO, CFO, CDIO, plan COO, and clinical leadership',
      artifactId: stringField(body.artifactId, 'artifactId'),
      artifactKind: artifactKind(body.artifactKind),
      phase: phase(body.phase),
      readinessInput,
      evidenceRefs: objectArray<PHSGenerationEvidenceRef>(body.evidenceRefs, 'evidenceRefs'),
      corpusPatternRefs: objectArray<PHSGenerationCorpusPatternRef>(body.corpusPatternRefs, 'corpusPatternRefs'),
      workloadRefs: optionalObjectArray<PHSGenerationWorkloadRef>(body.workloadRefs),
      humanInputs: stringArray(body.humanInputs),
      additionalInstructions: optionalString(body.additionalInstructions),
      model: optionalString(body.model),
      maxOutputTokens: optionalPositiveInteger(body.maxOutputTokens),
    });

    if (result.status === 'blocked') {
      return NextResponse.json(
        {
          ok: false,
          status: result.status,
          blockers: result.blockers,
          readiness: result.readiness,
          openAiCalled: result.openAiCalled,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      text: result.text,
      auditId: result.auditId,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      stopReason: result.stopReason,
      evidenceIds: result.evidenceIds,
      corpusPatternIds: result.corpusPatternIds,
      readiness: result.readiness,
      openAiCalled: result.openAiCalled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'phs_command_center_generation_invalid',
        detail: message,
      },
      { status: 400 },
    );
  }
}

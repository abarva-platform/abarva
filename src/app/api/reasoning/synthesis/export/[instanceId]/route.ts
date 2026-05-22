// GET /api/reasoning/synthesis/export/:instanceId
// Returns the full SynthesisContext for the given instance as a downloadable
// JSON file. Handles both source event instances and program instances.

import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session
// and scopes the instanceId to the session tenant.
import { guardReasoning, isInstanceInTenant } from '@/app/api/reasoning/_auth';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ instanceId: string }> },
): Promise<Response> {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  const { instanceId } = await params;

  if (!isInstanceInTenant(guard.ctx, instanceId)) {
    return jsonError(`Instance "${instanceId}" not found`, 404);
  }

  // Try source event instances first.
  const sourceInstance = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  if (sourceInstance) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.id === sourceInstance.patternId,
    );
    if (!pattern) {
      return jsonError(
        `Pattern "${sourceInstance.patternId}" not found for instance "${instanceId}"`,
        404,
      );
    }
    const context = buildSourceSynthesisContext(sourceInstance, pattern);
    return new Response(JSON.stringify(context, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="synthesis-context-${instanceId}.json"`,
      },
    });
  }

  // Try program instances.
  const programInstance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) => i.id === instanceId,
  );
  if (programInstance) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
      (p) => p.id === programInstance.patternId,
    );
    if (!pattern) {
      return jsonError(
        `Pattern "${programInstance.patternId}" not found for instance "${instanceId}"`,
        404,
      );
    }
    const context = buildProgramSynthesisContext(programInstance, pattern);
    return new Response(JSON.stringify(context, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="synthesis-context-${instanceId}.json"`,
      },
    });
  }

  return jsonError(`Instance "${instanceId}" not found`, 404);
}

// /api/programs/origination-submit
// Deterministic P0 submit path for the structured origination brief.
// The chat agent can still coach the setup, but the final control-plane
// write should not depend on another LLM tool-use turn completing.

import { OriginationSubmitError, submitOriginationBrief } from '@/lib/programs/origination-submit';
import { originationSubmitFailureSentence } from '@/lib/programs/origination-submit-failure-text';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitOriginationBrief(body);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof OriginationSubmitError) {
      return Response.json(
        {
          ok: false,
          error: err.code,
          message: err.message,
        },
        { status: err.status },
      );
    }

    // The raw text is the operator's; the product clients render `message`
    // ahead of `error`, so `message` has to be the sentence, not the internals.
    const rawMessage = err instanceof Error ? err.message : String(err);
    console.error('[origination-submit] unexpected failure', {
      message: rawMessage,
    });
    return Response.json(
      {
        ok: false,
        error: 'origination_submit_failed',
        message: originationSubmitFailureSentence('origination_submit_failed'),
      },
      { status: 500 },
    );
  }
}

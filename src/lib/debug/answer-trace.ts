import 'server-only';

import { currentUser } from '@clerk/nextjs/server';

export const ANSWER_TRACE_HEADER = 'x-abarva-answer-trace';
export const ANSWER_TRACE_QUERY_VALUE = 'answer-quality';

export interface AnswerTraceAccess {
  wanted: boolean;
  allowed: boolean;
  user: {
    id: string;
    email: string | null;
    role: string | null;
  } | null;
  deniedReason?: 'unauthenticated' | 'forbidden';
}

export interface AnswerTraceModelCall {
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  promptVersion?: string;
  tokenEstimate?: number;
  timeoutMs?: number;
  systemPrompt?: string;
  userPrompt?: string;
  finalPrompt?: string;
  rawResponse?: string;
  stopReason?: string | null;
  usage?: unknown;
  latencyMs?: number;
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
}

export interface AnswerTraceEnvelope {
  traceVersion: 'answer-quality-v1';
  route: string;
  surface: string;
  timestamp: string;
  session: {
    tenant?: unknown;
    user?: AnswerTraceAccess['user'];
    question?: string | null;
  };
  router?: unknown;
  evidenceSelection?: unknown;
  modelCall?: AnswerTraceModelCall;
  apiPayload?: unknown;
  validation?: unknown;
}

export function requestWantsAnswerTrace(req: Request, explicitFlag?: unknown): boolean {
  const header = req.headers.get(ANSWER_TRACE_HEADER);
  if (header && /^(1|true|yes)$/i.test(header.trim())) return true;

  try {
    const url = new URL(req.url);
    if (url.searchParams.get('trace') === ANSWER_TRACE_QUERY_VALUE) return true;
  } catch {
    // Request.url may be relative in tests; ignore.
  }

  return explicitFlag === true || explicitFlag === 'true';
}

export async function resolveAnswerTraceAccess(req: Request, explicitFlag?: unknown): Promise<AnswerTraceAccess> {
  const wanted = requestWantsAnswerTrace(req, explicitFlag);
  if (!wanted) return { wanted: false, allowed: false, user: null };

  const user = await currentUser().catch(() => null);
  if (!user) {
    return { wanted, allowed: false, user: null, deniedReason: 'unauthenticated' };
  }

  const emailAddresses = Array.isArray(user.emailAddresses) ? user.emailAddresses : [];
  const email = emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress
    ?? emailAddresses[0]?.emailAddress
    ?? null;
  const role =
    (user.publicMetadata?.role as string | undefined)
    ?? (user.unsafeMetadata?.role as string | undefined)
    ?? (user.publicMetadata?.legacyRole as string | undefined)
    ?? null;

  const allowedUserIds = splitEnv(process.env.ABARVA_ANSWER_TRACE_USER_IDS);
  const allowedEmails = splitEnv(process.env.ABARVA_ANSWER_TRACE_EMAILS).map((value) => value.toLowerCase());
  const allowed =
    role === 'admin' ||
    role === 'operator' ||
    allowedUserIds.includes(user.id) ||
    (email ? allowedEmails.includes(email.toLowerCase()) : false);

  return {
    wanted,
    allowed,
    user: {
      id: user.id,
      email,
      role,
    },
    deniedReason: allowed ? undefined : 'forbidden',
  };
}

export function answerTraceForbiddenResponse(access: AnswerTraceAccess): Response {
  return Response.json(
    {
      ok: false,
      error: access.deniedReason ?? 'forbidden',
      detail: 'Answer-quality trace mode is operator-only.',
    },
    { status: access.deniedReason === 'unauthenticated' ? 401 : 403 },
  );
}

export function estimatePromptTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitEnv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

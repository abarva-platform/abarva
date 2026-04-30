import 'server-only';

// OV2-2d-NOTIFY · Email send helper
//
// Thin wrapper around Resend with a console-log dev fallback.
//
// Posture:
//   • If RESEND_API_KEY is set, send through Resend.
//   • Otherwise, console.log the message and return ok with a synthetic
//     id of the form `console-{timestamp}`. This keeps the approval
//     workflow working in pilot/dev environments without an API key.
//
// Callers MUST treat sendEmail as fire-and-forget (or wrapped in
// Promise.allSettled). It catches Resend SDK throws internally and
// returns a structured error result; it never throws to the caller.

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  metadata?: Record<string, string>;
}

export interface EmailSendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = 'noreply@abarva.example.com';

function resolveFrom(message: EmailMessage): string {
  if (message.from && message.from.length > 0) return message.from;
  const envFrom = process.env.RESEND_FROM_EMAIL;
  if (envFrom && envFrom.length > 0) return envFrom;
  return DEFAULT_FROM;
}

function syntheticConsoleId(): string {
  return `console-${Date.now()}`;
}

interface ResendCreateResponse {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
}

interface ResendLike {
  emails: {
    send: (args: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
      reply_to?: string;
      headers?: Record<string, string>;
    }) => Promise<ResendCreateResponse>;
  };
}

let cachedClient: ResendLike | null = null;

async function getResendClient(apiKey: string): Promise<ResendLike> {
  if (cachedClient) return cachedClient;
  const mod = (await import('resend')) as { Resend: new (key: string) => ResendLike };
  cachedClient = new mod.Resend(apiKey);
  return cachedClient;
}

function metadataHeaders(
  metadata: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!metadata) return undefined;
  const entries = Object.entries(metadata);
  if (entries.length === 0) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    out[`X-Abarva-${k}`] = v;
  }
  return out;
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveFrom(message);

  if (!apiKey || apiKey.length === 0) {
    // Pilot-safe dev fallback. Log a structured record; the approval
    // workflow continues uninterrupted.
     
    console.log('[email:dev-fallback]', {
      to: message.to,
      from,
      subject: message.subject,
      hasHtml: message.html.length > 0,
      metadata: message.metadata ?? null,
    });
    return { ok: true, id: syntheticConsoleId() };
  }

  try {
    const client = await getResendClient(apiKey);
    const result = await client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      headers: metadataHeaders(message.metadata),
    });

    if (result.error) {
      return { ok: false, error: result.error.message ?? 'unknown_resend_error' };
    }
    const id = result.data?.id;
    if (!id) {
      return { ok: false, error: 'resend_returned_no_id' };
    }
    return { ok: true, id };
  } catch (err) {
    const detail =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err);
    return { ok: false, error: detail };
  }
}

// Test-only export used by the unit tests to reset the cached Resend
// client between cases. Production code should not call this.
export function __resetEmailClientForTests(): void {
  cachedClient = null;
}

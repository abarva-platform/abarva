import { NextRequest, NextResponse } from 'next/server';
import { isWorkEmail } from '@/lib/public-site/work-email';

export { isWorkEmail };

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; company?: string; program?: string; need?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, company, program, need } = body;
  if (!name || !email || !company || !program || !need) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  if (!isWorkEmail(email)) {
    return NextResponse.json({ error: 'Work email required' }, { status: 422 });
  }

  // In production, send via Resend or similar. For now, log to server (dev only).
  if (process.env.NODE_ENV !== 'production') {
    console.info('[contact form]', { name, email, company, program, need });
  }

  // TODO: wire to Resend when RESEND_API_KEY env var is set
  // if (process.env.RESEND_API_KEY) {
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from: 'noreply@abarva.ai', to: 'founder@abarva.ai', subject: `Contact: ${name} from ${company}`, text: `...` });
  // }

  return NextResponse.json({ ok: true });
}

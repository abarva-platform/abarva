import { createClerkClient } from '@clerk/backend';
import { NextResponse } from 'next/server';
import { DEMO_CODE_VALUE, isDemoCodeEmail } from '@/lib/auth/demo-code';

export const dynamic = 'force-dynamic';

interface DemoCodeRequestBody {
  email?: string;
  password?: string;
  code?: string;
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: DemoCodeRequestBody;

  try {
    body = (await request.json()) as DemoCodeRequestBody;
  } catch {
    return badRequest('invalid_request_body');
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const code = body.code?.trim();

  if (!email || !isDemoCodeEmail(email)) {
    return badRequest('invalid_credentials', 401);
  }

  const expectedPassword = process.env.DEMO_LOGIN_PASSWORD ?? 'Demo2026!';
  if (password !== expectedPassword) {
    return badRequest('invalid_credentials', 401);
  }

  if (code !== DEMO_CODE_VALUE) {
    return badRequest('invalid_credentials', 401);
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return badRequest('clerk_not_configured', 500);
  }

  const clerk = createClerkClient({ secretKey });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];

  if (!user) {
    return badRequest('demo_user_not_found', 404);
  }

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  return NextResponse.json({ ticket: signInToken.token });
}

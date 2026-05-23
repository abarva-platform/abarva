import { NextResponse } from 'next/server';

import { scoreArtifact } from '@/lib/depth/lint-service';
import { assertRubricType } from '@/lib/depth/rubrics/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      artifactType?: string;
      content?: string;
      artifactId?: string;
    };

    if (!body.artifactType || !body.content) {
      return NextResponse.json(
        { ok: false, error: { code: 'bad-request', message: 'artifactType and content are required.' } },
        { status: 400 },
      );
    }

    const rubricType = assertRubricType(body.artifactType);
    const result = await scoreArtifact(rubricType, body.content, { artifactId: body.artifactId });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'depth-lint-failed',
          message: error instanceof Error ? error.message : 'Depth lint failed.',
        },
      },
      { status: 500 },
    );
  }
}

// POST /api/evidence/url-meta
//
// Body: { url: string }
// Response: { title: string; description: string }
//
// Fetches the given URL server-side (no CORS issues), extracts <title> and
// <meta name="description"> via regex, and returns them. Always returns 200
// with empty strings on any error so the caller can silently degrade.

interface UrlMetaResult {
  title: string;
  description: string;
}

const EMPTY: UrlMetaResult = { title: '', description: '' };

function json(data: UrlMetaResult): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(EMPTY);
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('url' in body) ||
    typeof (body as Record<string, unknown>).url !== 'string'
  ) {
    return json(EMPTY);
  }

  const url = (body as { url: string }).url.trim();
  if (!url.startsWith('http')) {
    return json(EMPTY);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nexus/1.0)' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return json(EMPTY);
    }

    const html = await res.text();

    // Use [\s\S] instead of dotAll flag (s) to stay compatible with ES2017 target
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch?.[1] ?? '';
    const title = rawTitle
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const description = (descMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();

    return json({ title, description });
  } catch {
    clearTimeout(timeoutId);
    return json(EMPTY);
  }
}

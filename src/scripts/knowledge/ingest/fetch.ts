const USER_AGENT = 'AbarVaKnowledgeBot/0.1 (+https://abarva.ai/contact)';

export async function politeFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    throw new Error(`fetch ${url} → ${res.status} ${res.statusText}`);
  }
  return res;
}

export async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await politeFetch(url);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

export async function fetchText(url: string): Promise<string> {
  const res = await politeFetch(url);
  return res.text();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

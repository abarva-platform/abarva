import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const idx = pc.index(process.env.PINECONE_INDEX ?? 'nexus-knowledge')

const EMBED_MODEL = 'multilingual-e5-large'
const MIN_SCORE = 0.68

export async function retrieveContext(
  query: string,
  vertical: 'healthcare' | 'finserv' | 'retail' | 'universal',
  topK = 4,
): Promise<string> {
  try {
    const embedResponse = await pc.inference.embed({
      model: EMBED_MODEL,
      inputs: [query],
      parameters: { inputType: 'query', truncate: 'END' },
    })
    const queryVector = (embedResponse.data[0] as any).values as number[]

    const results = await idx.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: {
        vertical: { '$in': [vertical, 'universal'] },
      },
    })

    const hits = (results.matches ?? [])
      .filter(m => (m.score ?? 0) >= MIN_SCORE)

    if (!hits.length) return ''

    return hits
      .map(m => `[Source: ${m.metadata?.source}]\n${m.metadata?.text}`)
      .join('\n\n---\n\n')

  } catch {
    // Never break the chat for RAG errors
    return ''
  }
}

export function verticalFromClientContext(clientVertical: string | undefined): 'healthcare' | 'finserv' | 'retail' | 'universal' {
  const v = (clientVertical ?? '').toLowerCase()
  if (v.includes('health') || v.includes('hospital') || v.includes('idn') || v.includes('clinical')) return 'healthcare'
  if (v.includes('finance') || v.includes('bank') || v.includes('asset') || v.includes('insurance') || v.includes('finserv')) return 'finserv'
  if (v.includes('retail') || v.includes('commerce') || v.includes('cpg') || v.includes('consumer')) return 'retail'
  return 'universal'
}

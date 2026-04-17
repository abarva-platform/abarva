#!/usr/bin/env npx tsx
/**
 * AbarNexus Knowledge Ingestion Pipeline
 * Embeds 80 knowledge documents into Pinecone nexus-knowledge index
 * Uses Pinecone Inference API (no OpenAI key required)
 *
 * Usage:
 *   npm run ingest
 *   npx tsx scripts/ingest-knowledge.ts
 */

import { Pinecone } from '@pinecone-database/pinecone'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY
const INDEX_NAME = process.env.PINECONE_INDEX ?? 'nexus-knowledge'
const EMBED_MODEL = 'multilingual-e5-large'
const CHUNK_SIZE = 800  // words
const CHUNK_OVERLAP = 100  // words
const BATCH_SIZE = 48   // Pinecone inference batch limit
const UPSERT_BATCH = 100 // Pinecone upsert batch limit

if (!PINECONE_API_KEY) {
  console.error('❌ PINECONE_API_KEY not found in .env.local')
  process.exit(1)
}

const pc = new Pinecone({ apiKey: PINECONE_API_KEY })

function chunkText(text: string): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ')
    if (chunk.trim().length > 80) chunks.push(chunk.trim())
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

function getVertical(layer: string): string {
  if (layer === 'healthcare') return 'healthcare'
  if (layer === 'finserv') return 'finserv'
  if (layer === 'retail') return 'retail'
  return 'universal'
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await pc.inference.embed({
    model: EMBED_MODEL,
    inputs: texts,
    parameters: { inputType: 'passage', truncate: 'END' },
  })
  return response.data.map((r: any) => r.values)
}

async function main() {
  console.log('\n🧬 AbarNexus Knowledge Ingestion Pipeline')
  console.log(`   Index: ${INDEX_NAME}`)
  console.log(`   Embed model: ${EMBED_MODEL}`)
  console.log(`   Chunk size: ${CHUNK_SIZE} words, overlap: ${CHUNK_OVERLAP}\n`)

  const idx = pc.index(INDEX_NAME)

  // Describe index to verify connectivity
  try {
    const desc = await pc.describeIndex(INDEX_NAME)
    console.log(`   Index dimension: ${desc.dimension}`)
    console.log(`   Index status: ${desc.status?.state}\n`)
  } catch (e) {
    console.error('❌ Cannot connect to Pinecone index:', e)
    process.exit(1)
  }

  const knowledgeDir = path.join(process.cwd(), 'scripts', 'knowledge-data')
  const layers = fs.readdirSync(knowledgeDir).filter(d =>
    fs.statSync(path.join(knowledgeDir, d)).isDirectory()
  )

  let totalDocs = 0
  let totalChunks = 0
  let totalVectors = 0

  for (const layer of layers) {
    const layerDir = path.join(knowledgeDir, layer)
    const files = fs.readdirSync(layerDir).filter(f => f.endsWith('.txt')).sort()

    console.log(`📁 ${layer.toUpperCase()} (${files.length} documents)`)

    for (const file of files) {
      const filePath = path.join(layerDir, file)
      const text = fs.readFileSync(filePath, 'utf-8')
      const chunks = chunkText(text)
      const vertical = getVertical(layer)
      const docId = `${layer}/${file.replace('.txt', '')}`

      process.stdout.write(`   ${file}: ${chunks.length} chunks ... `)

      // Process chunks in embedding batches
      const allEmbeddings: number[][] = []
      for (let b = 0; b < chunks.length; b += BATCH_SIZE) {
        const batch = chunks.slice(b, b + BATCH_SIZE)
        const embeddings = await embedBatch(batch)
        allEmbeddings.push(...embeddings)
        // Small courtesy delay between embedding batches
        if (b + BATCH_SIZE < chunks.length) {
          await new Promise(r => setTimeout(r, 80))
        }
      }

      // Build vectors
      const vectors = chunks.map((chunk, i) => ({
        id: `${layer}__${file}__${i}`,
        values: allEmbeddings[i],
        metadata: {
          layer,
          vertical,
          source: file,
          docId,
          chunkIndex: i,
          totalChunks: chunks.length,
          // Store first 1200 chars of chunk for RAG retrieval
          text: chunk.substring(0, 1200),
        },
      }))

      // Upsert in batches
      for (let u = 0; u < vectors.length; u += UPSERT_BATCH) {
        await idx.upsert({ records: vectors.slice(u, u + UPSERT_BATCH) })
      }

      console.log('✓')
      totalDocs++
      totalChunks += chunks.length
      totalVectors += vectors.length
    }

    console.log('')
  }

  // Final stats
  const stats = await idx.describeIndexStats()

  console.log('════════════════════════════════════════')
  console.log('✅ INGESTION COMPLETE')
  console.log(`   Documents ingested: ${totalDocs}`)
  console.log(`   Total chunks: ${totalChunks}`)
  console.log(`   Vectors upserted: ${totalVectors}`)
  console.log(`   Pinecone total vectors: ${stats.totalRecordCount}`)
  console.log('════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌ Pipeline failed:', err)
  process.exit(1)
})

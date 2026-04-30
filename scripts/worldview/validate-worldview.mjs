#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const worldviewDir = path.join(root, 'worldview');
const requiredMetadataFields = [
  'chunk_id',
  'thesis_id',
  'thesis_title',
  'chunk_position',
  'chunk_total_in_thesis',
  'chunk_title',
  'chunk_type',
  'chunk_text',
  'chunk_word_count',
  'claim_summary',
  'abarva_framing_summary',
  'implication_summary',
  'citations',
  'entities_referenced',
  'keywords',
  'related_patterns',
  'related_chunks',
  'audience_tags',
  'primary_audience',
  'industry_examples_used',
  'confidence',
  'confidence_rationale',
  'is_forecast',
  'forecast_horizon',
  'last_validated',
  'validation_status',
  'pinecone_namespace',
  'embedding_model_target',
  'embedding_dimension_target',
];
const validChunkTypes = new Set([
  'claim',
  'evidence',
  'counterargument',
  'vendor-analysis',
  'case-study',
  'implication',
  'synthesis',
  'definition',
]);
const theses = ['W1', 'W2', 'W3', 'W4', 'W5'];
const failures = [];
const summary = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

for (const thesisId of theses) {
  const chunksFile = path.join(worldviewDir, 'chunks', `${thesisId}_chunks.json`);
  const pineconeFile = path.join(worldviewDir, 'pinecone-ready', `${thesisId}_pinecone.json`);
  if (!fs.existsSync(chunksFile)) {
    failures.push(`Missing ${path.relative(root, chunksFile)}`);
    continue;
  }
  if (!fs.existsSync(pineconeFile)) {
    failures.push(`Missing ${path.relative(root, pineconeFile)}`);
    continue;
  }

  const chunksPayload = readJson(chunksFile);
  const pineconePayload = readJson(pineconeFile);
  if (!chunksPayload || !pineconePayload) continue;

  const chunks = Array.isArray(chunksPayload) ? chunksPayload : chunksPayload.chunks;
  const pineconeChunks = pineconePayload.chunks;
  if (!Array.isArray(chunks)) failures.push(`${path.relative(root, chunksFile)} must contain an array or { chunks: [] }`);
  if (!Array.isArray(pineconeChunks)) failures.push(`${path.relative(root, pineconeFile)} must contain { chunks: [] }`);
  if (!Array.isArray(chunks) || !Array.isArray(pineconeChunks)) continue;

  if (pineconePayload.thesis_id !== thesisId) failures.push(`${thesisId} pinecone thesis_id mismatch`);
  if (pineconePayload.pinecone_namespace !== 'worldview') failures.push(`${thesisId} pinecone namespace must be worldview`);
  if (pineconePayload.embedding_model_target !== 'text-embedding-3-large') failures.push(`${thesisId} embedding model mismatch`);
  if (pineconePayload.embedding_dimension_target !== 3072) failures.push(`${thesisId} embedding dimension mismatch`);
  if (pineconePayload.total_chunks !== pineconeChunks.length) failures.push(`${thesisId} total_chunks does not match chunks length`);
  if (chunks.length !== pineconeChunks.length) failures.push(`${thesisId} chunks and pinecone-ready chunk counts differ`);

  const ids = new Set();
  for (const [index, chunk] of pineconeChunks.entries()) {
    const metadata = chunk.metadata ?? chunk;
    const chunkText = chunk.chunk_text ?? metadata.chunk_text;
    const expectedId = `worldview:${thesisId}:${String(index + 1).padStart(3, '0')}`;

    if (chunk.chunk_id && chunk.chunk_id !== expectedId) failures.push(`${thesisId} chunk ${index + 1} wrapper id should be ${expectedId}`);
    if (metadata.chunk_id !== expectedId) failures.push(`${thesisId} chunk ${index + 1} metadata id should be ${expectedId}`);
    if (ids.has(metadata.chunk_id)) failures.push(`${thesisId} duplicate chunk id ${metadata.chunk_id}`);
    ids.add(metadata.chunk_id);

    for (const field of requiredMetadataFields) {
      if (!(field in metadata)) failures.push(`${metadata.chunk_id ?? thesisId + ':' + (index + 1)} missing metadata.${field}`);
    }
    if (metadata.thesis_id !== thesisId) failures.push(`${metadata.chunk_id} thesis_id mismatch`);
    if (metadata.chunk_position !== index + 1) failures.push(`${metadata.chunk_id} chunk_position mismatch`);
    if (metadata.chunk_total_in_thesis !== pineconeChunks.length) failures.push(`${metadata.chunk_id} chunk_total_in_thesis mismatch`);
    if (!validChunkTypes.has(metadata.chunk_type)) failures.push(`${metadata.chunk_id} invalid chunk_type ${metadata.chunk_type}`);
    if (metadata.pinecone_namespace !== 'worldview') failures.push(`${metadata.chunk_id} pinecone namespace must be worldview`);
    if (metadata.embedding_model_target !== 'text-embedding-3-large') failures.push(`${metadata.chunk_id} embedding model mismatch`);
    if (metadata.embedding_dimension_target !== 3072) failures.push(`${metadata.chunk_id} embedding dimension mismatch`);
    if (!Array.isArray(metadata.citations)) failures.push(`${metadata.chunk_id} citations must be array`);
    if (!Array.isArray(metadata.audience_tags)) failures.push(`${metadata.chunk_id} audience_tags must be array`);
    if (!chunkText || chunkText !== metadata.chunk_text) failures.push(`${metadata.chunk_id} wrapper chunk_text must match metadata.chunk_text`);
    const wordCount = String(chunkText ?? '').trim().split(/\s+/).filter(Boolean).length;
    if (Math.abs(wordCount - Number(metadata.chunk_word_count)) > 5) failures.push(`${metadata.chunk_id} chunk_word_count ${metadata.chunk_word_count} differs from measured ${wordCount}`);
    if (wordCount < 350) failures.push(`${metadata.chunk_id} is very short for a retrieval chunk (${wordCount} words)`);
  }
  summary.push({ thesisId, chunks: pineconeChunks.length });
}

console.log(JSON.stringify({ summary, failureCount: failures.length, failures }, null, 2));
if (failures.length) process.exit(1);

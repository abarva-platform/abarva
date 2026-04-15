#!/usr/bin/env node
/**
 * AbarVa Dataset Seeder
 *
 * Reads .xlsx files from datasets/ and uploads each one to Supabase Storage,
 * then writes metadata into the `dataset_files` table.
 *
 * Storage:  Supabase Storage  (bucket: "datasets")
 * Database: Supabase Postgres (table:  "dataset_files")
 *
 * Usage:
 *   node scripts/seed-datasets.js [clientId]
 *
 * Examples:
 *   node scripts/seed-datasets.js              # defaults to arcturus
 *   node scripts/seed-datasets.js meridian
 *
 * Prerequisites — run once in Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS dataset_files (
 *     id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
 *     document_name text        NOT NULL,
 *     file_name     text        NOT NULL,
 *     client_id     text        NOT NULL,
 *     uploaded_by   text        NOT NULL DEFAULT 'Anand Sundaram · Admin',
 *     confidence    integer     NOT NULL DEFAULT 85,
 *     date          date        NOT NULL DEFAULT CURRENT_DATE,
 *     storage_path  text,
 *     storage_url   text,
 *     status        text        NOT NULL DEFAULT 'active',
 *     created_at    timestamptz DEFAULT now()
 *   );
 */

'use strict'

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// ─── Load env ─────────────────────────────────────────────────────────────────

function loadEnv () {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
}

loadEnv()

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const CLIENT_ID   = process.argv[2] || 'arcturus'
const UPLOADER    = 'Anand Sundaram · Admin'
const CONFIDENCE  = 85
const BUCKET      = 'datasets'
const TABLE       = 'dataset_files'
const DATASETS_DIR = path.join(__dirname, '..', 'datasets')
const XLSX_MIME   = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today () {
  return new Date().toISOString().split('T')[0]
}

function docName (fileName) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
}

function mime (fileName) {
  if (fileName.endsWith('.xlsx')) return XLSX_MIME
  if (fileName.endsWith('.xls'))  return 'application/vnd.ms-excel'
  if (fileName.endsWith('.csv'))  return 'text/csv'
  if (fileName.endsWith('.pdf'))  return 'application/pdf'
  return 'application/octet-stream'
}

// ─── Ensure bucket exists ─────────────────────────────────────────────────────

async function ensureBucket () {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false })
  if (error && !error.message.toLowerCase().includes('already exists')) {
    console.warn(`  bucket warning: ${error.message}`)
  }
}

// ─── Upload one file ──────────────────────────────────────────────────────────

async function uploadFile (filePath) {
  const fileName    = path.basename(filePath)
  const document    = docName(fileName)
  const storagePath = `${CLIENT_ID}/${Date.now()}-${fileName}`
  const bytes       = fs.readFileSync(filePath)
  const date        = today()

  process.stdout.write(`  • ${fileName} … `)

  // 1. Upload to Supabase Storage
  const { error: storeErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: mime(fileName), upsert: false })

  if (storeErr) {
    console.log(`STORAGE ERROR: ${storeErr.message}`)
    return null
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  // 2. Write metadata to database
  const record = {
    document_name: document,
    file_name:     fileName,
    client_id:     CLIENT_ID,
    uploaded_by:   UPLOADER,
    confidence:    CONFIDENCE,
    date,
    storage_path:  storagePath,
    storage_url:   publicUrl,
    status:        'active',
  }

  const { error: dbErr } = await supabase.from(TABLE).insert(record)

  if (dbErr) {
    // Table may not exist yet — print the record so nothing is lost
    console.log(`UPLOADED (db skipped: ${dbErr.message})`)
    console.log(`    metadata: ${JSON.stringify(record)}`)
  } else {
    console.log('done')
  }

  return record
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main () {
  // --setup flag: print the SQL and exit
  if (process.argv.includes('--setup')) {
    const sqlPath = path.join(__dirname, 'setup-db.sql')
    console.log('\nRun the following SQL in Supabase SQL editor:\n')
    console.log('  https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/sql\n')
    if (fs.existsSync(sqlPath)) {
      console.log(fs.readFileSync(sqlPath, 'utf8'))
    }
    return
  }

  console.log('\nAbarVa Dataset Seeder')
  console.log('━'.repeat(44))
  console.log(`Client ID : ${CLIENT_ID}`)
  console.log(`Storage   : Supabase bucket "${BUCKET}"`)
  console.log(`Database  : Supabase table  "${TABLE}"`)
  console.log(`Source    : ${DATASETS_DIR}`)
  console.log('━'.repeat(44) + '\n')

  if (!fs.existsSync(DATASETS_DIR)) {
    console.error(`datasets/ folder not found. Create it and add .xlsx files.`)
    process.exit(1)
  }

  const files = fs.readdirSync(DATASETS_DIR)
    .filter(f => /\.(xlsx|xls|csv|pdf)$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.log('No files found in datasets/  (supported: .xlsx, .xls, .csv, .pdf)')
    console.log('Add files and re-run.\n')
    process.exit(0)
  }

  console.log(`Found ${files.length} file(s):\n`)

  await ensureBucket()

  const results = []
  for (const f of files) {
    const r = await uploadFile(path.join(DATASETS_DIR, f))
    if (r) results.push(r)
  }

  console.log('\n' + '━'.repeat(44))
  console.log(`Seeded ${results.length}/${files.length} files for client "${CLIENT_ID}"`)

  if (results.length > 0) {
    console.log('\nDocuments written:')
    for (const r of results) {
      console.log(`  ✓ ${r.document_name}  (confidence ${r.confidence}%  ·  ${r.date})`)
    }
  }

  if (results.length < files.length) {
    console.log('\nTo create the database table, run:')
    console.log('  node scripts/seed-datasets.js --setup')
    console.log('  Then paste the SQL into: https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/sql')
  }

  console.log()
}

main().catch(err => {
  console.error('\nFatal:', err.message || err)
  process.exit(1)
})

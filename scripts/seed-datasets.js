#!/usr/bin/env node
/**
 * AbarVa Dataset Seeder
 *
 * Mirrors exactly what POST /api/admin/upload-dataset does from the browser:
 *   - uploads each file to Supabase Storage  (bucket: "datasets")
 *   - inserts metadata into dataset_files    (table: see setup-db.sql)
 *
 * Usage:
 *   node scripts/seed-datasets.js --client meridian
 *   node scripts/seed-datasets.js --client meridian
 *
 * Files are read recursively from  datasets/<clientId>/
 * e.g.  datasets/meridian/margin/M01_PL_by_Business_Unit.xlsx
 *         → documentName  "P&L by Business Unit"
 *         → clientId      "meridian"
 *         → uploadedBy    "Anand Sundaram · Admin"
 *         → confidence    85
 */

'use strict'

const { createClient } = require('@supabase/supabase-js')
const fs   = require('fs')
const path = require('path')

// ── env ───────────────────────────────────────────────────────────────────────

function loadEnv () {
  const p = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t  = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (k && !process.env[k]) process.env[k] = v
  }
}

loadEnv()

// ── args ──────────────────────────────────────────────────────────────────────

function parseArgs () {
  const argv = process.argv.slice(2)
  const out  = { client: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--client' && argv[i + 1]) out.client = argv[++i]
  }
  return out
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** Recursively collect .xlsx files under a directory */
function walkXlsx (dir, found = []) {
  if (!fs.existsSync(dir)) return found
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      walkXlsx(full, found)
    } else if (entry.toLowerCase().endsWith('.xlsx')) {
      found.push(full)
    }
  }
  return found.sort()
}

/**
 * Convert a filename to a readable document name.
 * "M01_PL_by_Business_Unit.xlsx" → "P&L by Business Unit"
 * "MH-T02_Vendor_Assessment_RCM.xlsx" → "Vendor Assessment RCM"
 */
function toDocName (filename) {
  return filename
    .replace(/\.xlsx$/i, '')          // strip extension
    .replace(/^[A-Z0-9-]+_/, '')     // strip leading code (M01_, MH-T02_)
    .replace(/_/g, ' ')              // underscores → spaces
}

function today () {
  return new Date().toISOString().split('T')[0]
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main () {
  const { client } = parseArgs()

  if (!client) {
    console.error('Usage: node scripts/seed-datasets.js --client <apex|meridian>')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase    = createClient(url, key)
  const BUCKET      = 'datasets'
  const TABLE       = 'dataset_files'
  const UPLOADER    = 'Anand Sundaram · Admin'
  const CONFIDENCE  = 85
  const sourceDir   = path.join(__dirname, '..', 'datasets', client)
  const files       = walkXlsx(sourceDir)

  // ── header ────────────────────────────────────────────────────────────────
  console.log()
  console.log('AbarVa Dataset Seeder')
  console.log('─'.repeat(52))
  console.log(`client   : ${client}`)
  console.log(`source   : datasets/${client}/`)
  console.log(`files    : ${files.length} xlsx found`)
  console.log(`storage  : Supabase bucket "${BUCKET}"`)
  console.log(`database : Supabase table  "${TABLE}"`)
  console.log('─'.repeat(52))
  console.log()

  if (files.length === 0) {
    console.log(`No .xlsx files found in datasets/${client}/`)
    console.log('Add files and re-run.')
    process.exit(0)
  }

  // ── ensure bucket ─────────────────────────────────────────────────────────
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {})

  // ── upload loop ───────────────────────────────────────────────────────────
  let ok = 0, fail = 0

  for (const filePath of files) {
    const fileName    = path.basename(filePath)
    const rel         = path.relative(path.join(__dirname, '..', 'datasets'), filePath)
    const documentName = toDocName(fileName)
    const storagePath = `${client}/${Date.now()}-${fileName}`
    const bytes       = fs.readFileSync(filePath)
    const date        = today()

    process.stdout.write(`  ${rel.padEnd(52)} `)

    // 1. upload file to Supabase Storage
    const { error: storeErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      })

    if (storeErr) {
      console.log(`✗  storage: ${storeErr.message}`)
      fail++
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    // 2. write metadata — same shape the API route returns
    const record = {
      document_name : documentName,
      file_name     : fileName,
      client_id     : client,
      uploaded_by   : UPLOADER,
      confidence    : CONFIDENCE,
      date,
      storage_path  : storagePath,
      storage_url   : publicUrl,
      status        : 'active',
    }

    const { error: dbErr } = await supabase.from(TABLE).insert(record)

    if (dbErr) {
      // table not created yet — storage upload still succeeded
      console.log(`✓  stored  (db: ${dbErr.message.slice(0, 60)})`)
    } else {
      console.log(`✓  ${documentName}`)
    }

    ok++
  }

  // ── summary ───────────────────────────────────────────────────────────────
  console.log()
  console.log('─'.repeat(52))
  console.log(`done: ${ok} uploaded, ${fail} failed  (client: ${client})`)

  if (fail > 0) process.exit(1)

  if (ok > 0 && ok === files.length && files.some(() => true)) {
    // check if db writes might have been skipped
    const { error: checkErr } = await supabase.from(TABLE).select('id').limit(1)
    if (checkErr) {
      console.log()
      console.log('⚠  dataset_files table does not exist yet.')
      console.log('   Run:  node scripts/seed-datasets.js --setup')
      console.log('   Then paste the SQL into the Supabase SQL editor.')
    }
  }
  console.log()
}

// ── --setup flag ──────────────────────────────────────────────────────────────

if (process.argv.includes('--setup')) {
  loadEnv()
  const sqlPath = path.join(__dirname, 'setup-db.sql')
  console.log('\nPaste this SQL into: https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/sql\n')
  if (fs.existsSync(sqlPath)) console.log(fs.readFileSync(sqlPath, 'utf8'))
  process.exit(0)
}

main().catch(err => {
  console.error('\nfatal:', err.message || err)
  process.exit(1)
})

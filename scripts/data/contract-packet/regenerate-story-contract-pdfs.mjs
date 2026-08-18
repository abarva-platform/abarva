#!/usr/bin/env node

/**
 * Renders the CTR-061 (Northgate) and CTR-090 (Vantage) executed-agreement PDFs from
 * their page text in contract_pdf_page_text.csv, unconditionally (unlike
 * regenerate-contract-pdfs.mjs, which only rewrites a PDF whose on-disk bytes still
 * name a real vendor — these two never did, so that script always skips them).
 *
 * Run this after editing the CTR-061/CTR-090 rows in contract_pdf_page_text.csv. It
 * rewrites the two PDFs and recomputes page_text_sha256 and source_file_sha256 for
 * every row belonging to those two files, leaving all other rows in the CSV untouched.
 *
 * Usage:
 *   node scripts/data/contract-packet/regenerate-story-contract-pdfs.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';
import { Document, Page, Text, View, StyleSheet, renderToFile } from '@react-pdf/renderer';
import React from 'react';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const PKG_DIR = 'datasets/source/contract-intelligence/skyharbor-golden-20260808';
const CSV_PATH = path.join(ROOT, PKG_DIR, 'synthetic/contract_pdf_page_text.csv');
const DOCS_DIR = path.join(ROOT, PKG_DIR, 'documents');

const TARGET_FILE_IDS = new Set(['doc-ctr-061-executed-agreement', 'doc-ctr-090-executed-agreement']);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sha256File = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.5, fontFamily: 'Helvetica' },
  banner: { fontSize: 8, marginBottom: 14, color: '#666' },
  title: { fontSize: 14, marginBottom: 10 },
  body: { marginBottom: 8 },
});

const e = React.createElement;

function pdfDoc(fileName, pages) {
  return e(
    Document,
    null,
    ...pages.map((p, i) =>
      e(
        Page,
        { key: i, size: 'LETTER', style: styles.page },
        e(Text, { style: styles.banner },
          'SYNTHETIC DEMO DOCUMENT — NOT A REAL AGREEMENT — NOT LEGAL ADVICE. ' +
          'Supplier legal entities are invented; no term reflects any actual company or negotiation.'),
        i === 0 ? e(Text, { style: styles.title }, fileName.replace(/_SYNTHETIC\.pdf$/, '').replace(/_/g, ' ')) : null,
        e(View, null, e(Text, { style: styles.body }, p.page_text)),
      ),
    ),
  );
}

async function main() {
  const parsed = Papa.parse(fs.readFileSync(CSV_PATH, 'utf8').trim(), { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const byFile = new Map();
  for (const r of rows) {
    if (!TARGET_FILE_IDS.has(r.source_file_id)) continue;
    if (!byFile.has(r.source_file_name)) byFile.set(r.source_file_name, []);
    byFile.get(r.source_file_name).push(r);
  }

  if (byFile.size === 0) {
    throw new Error('No rows found for doc-ctr-061-executed-agreement or doc-ctr-090-executed-agreement.');
  }

  for (const [fileName, pages] of byFile) {
    pages.sort((a, b) => Number(a.source_page) - Number(b.source_page));
    const target = path.join(DOCS_DIR, fileName);
    console.log(`  ${fileName}: ${pages.length} pages`);
    if (!DRY) {
      await renderToFile(pdfDoc(fileName, pages), target);
    }
  }

  if (!DRY) {
    for (const r of rows) {
      if (!TARGET_FILE_IDS.has(r.source_file_id)) continue;
      r.page_text_sha256 = sha256(r.page_text);
      const f = path.join(DOCS_DIR, r.source_file_name);
      if (fs.existsSync(f)) r.source_file_sha256 = sha256File(f);
    }
    // Papa.unparse's default row separator is \r\n; appending a bare \n here would leave
    // the file's own trailing terminator inconsistent with every other row, which is
    // exactly what caused the original CSV parse failure this packet already needed
    // fixing for (see docs/releases/records/2026-08-18-golden-evidence-loader-*.md).
    fs.writeFileSync(CSV_PATH, `${Papa.unparse(rows, { columns: parsed.meta.fields })}\r\n`);
    console.log('Rewrote page_text_sha256 / source_file_sha256 for the two target files.');
  }

  console.log(`${DRY ? 'DRY RUN — would regenerate' : 'Regenerated'} ${byFile.size} PDF(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

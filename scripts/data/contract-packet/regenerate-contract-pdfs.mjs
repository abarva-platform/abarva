#!/usr/bin/env node

/**
 * Regenerates the synthetic contract PDFs from their re-keyed page text and recomputes the
 * hashes that reference them.
 *
 * The PDFs are the one thing the text re-key could not touch: their bytes are compressed
 * streams, and the vendor name lives in both the rendered content and the filename. They are
 * not hand-editable, but they do not need to be — the page text is data-backed in
 * contract_pdf_page_text.csv, with page_text_sha256 alongside it. So the PDF is rendered from
 * the row rather than patched, which is the same direction as the rest of this machinery:
 * the structured fact is the source of record and the document is a projection of it.
 *
 * Only files whose text still contains a real vendor identity are regenerated. The large
 * prior-corpus agreements are left alone: their parties are fictional and their vendor
 * mentions sit in an application-estate inventory table beside IBM Netezza, which is the
 * permitted case.
 *
 * Usage:
 *   node scripts/data/contract-packet/regenerate-contract-pdfs.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';
import { Document, Page, Text, View, StyleSheet, renderToFile } from '@react-pdf/renderer';
import React from 'react';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const BASE = 'datasets/source/contract-intelligence';

/** Packages that carry a page-text table backing their PDFs. */
const PACKAGES = [
  { dir: 'skyharbor-golden-20260808', csv: 'synthetic/contract_pdf_page_text.csv' },
  { dir: 'meridian-golden-20260809', csv: 'synthetic/contract_pdf_page_text.csv' },
];

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

/** No \b here: underscore is a word character, so /\bWorkday/ fails to match inside
 *  CF-003_Workday_Inc__EXECUTED-AGREEMENT.pdf — exactly the filenames being looked for. */
const REAL = /(Microsoft|Salesforce|Workday|MuleSoft|Tableau)/i;
let regenerated = 0;
let csvsUpdated = 0;

for (const pkg of PACKAGES) {
  const csvPath = path.join(ROOT, BASE, pkg.dir, pkg.csv);
  if (!fs.existsSync(csvPath)) continue;

  const parsed = Papa.parse(fs.readFileSync(csvPath, 'utf8').trim(), { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Group by the file each page belongs to.
  const byFile = new Map();
  for (const r of rows) {
    if (!byFile.has(r.source_file_name)) byFile.set(r.source_file_name, []);
    byFile.get(r.source_file_name).push(r);
  }

  const docsDir = path.join(ROOT, BASE, pkg.dir, 'documents');

  for (const [fileName, pages] of byFile) {
    pages.sort((a, b) => Number(a.source_page) - Number(b.source_page));
    const target = path.join(docsDir, fileName);

    // Find the on-disk file this row set refers to. After the re-key the CSV names the new
    // file, which does not exist yet; the old vendor-named one still does.
    const existing = fs.existsSync(target)
      ? target
      : fs.readdirSync(docsDir)
          .filter((f) => f.endsWith('.pdf'))
          .map((f) => path.join(docsDir, f))
          .find((f) => {
            const stem = path.basename(f).replace(/_SYNTHETIC\.pdf$/, '');
            const want = fileName.replace(/_SYNTHETIC\.pdf$/, '');
            // Same contract id prefix and same document-kind suffix.
            return stem.split('_')[0] === want.split('_')[0]
              && stem.split('_').pop() === want.split('_').pop();
          });

    // If the on-disk file cannot be located, do NOT render one from page text. The large
    // prior-corpus agreements live in a subdirectory and are an order of magnitude richer than
    // their page-text summary; "regenerating" them would silently replace a 1.5MB instrument
    // with a few paragraphs. Absence here means "not mine to touch", not "needs creating".
    if (!existing) {
      console.log(`  skip (no on-disk match, not regenerating from summary): ${fileName}`);
      continue;
    }
    // Only files that still name a real vendor need rewriting.
    if (!REAL.test(fs.readFileSync(existing).toString('latin1')) &&
        !REAL.test(path.basename(existing))) continue;

    console.log(`  ${existing ? path.basename(existing) : '(missing)'}\n    -> ${fileName}`);
    if (!DRY) {
      await renderToFile(pdfDoc(fileName, pages), target);
      if (existing && path.resolve(existing) !== path.resolve(target)) fs.unlinkSync(existing);
    }
    regenerated += 1;
  }

  if (!DRY) {
    // Rewrite the hashes now that both the page text and the file bytes have changed.
    for (const r of rows) {
      r.page_text_sha256 = sha256(r.page_text);
      const f = path.join(docsDir, r.source_file_name);
      if (fs.existsSync(f)) r.source_file_sha256 = sha256File(f);
    }
    // Papa.unparse's default row separator is \r\n; appending a bare \n here leaves the
    // file's own trailing terminator inconsistent with every other row, which PapaParse's
    // own line-ending autodetection then misreads as a malformed final record.
    fs.writeFileSync(csvPath, `${Papa.unparse(rows, { columns: parsed.meta.fields })}\r\n`);
    csvsUpdated += 1;
  }
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}PDFs regenerated: ${regenerated}, page-text tables rehashed: ${csvsUpdated}`);

#!/usr/bin/env node

/**
 * Applies docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md to the universal
 * tenant-input template pack.
 *
 * What it does:
 *   1. Audits every .xlsx in the pack (sheet names, orientation sheets, SME fields).
 *   2. Rebuilds AbarVa_Template_Pack_Index_v3.xlsx as the client front door.
 *   3. Injects/refreshes a governed `Start Here` sheet in every other pack workbook.
 *   4. Writes an inventory + summary report with before/after workbook hashes.
 *
 * Boundaries: this script only touches template workbooks and report files. It does
 * not read or write tenant data, the tenant registry, CSV column contracts, the data
 * plane, retrieval, or any runtime surface. Generating a workbook approves nothing.
 *
 * Usage:
 *   node scripts/audit/build-universal-template-workbook-quality-bar.mjs
 *   node scripts/audit/build-universal-template-workbook-quality-bar.mjs --audit-only
 *   node scripts/audit/build-universal-template-workbook-quality-bar.mjs --out reports/<dir>
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';

const ROOT = process.cwd();
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';
const INDEX_WORKBOOK = 'AbarVa_Template_Pack_Index_v3.xlsx';
const DEFAULT_OUT = 'reports/tenant-template-quality-bar-2026-08-12';
const QUALITY_BAR_DOC = 'docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md';

/** Style indices reused from the pack's shared styles.xml (ClosedXML-generated). */
const STYLE = { title: 5, subtitle: 13, header: 22, body: 40 };
const MAX_STYLE_INDEX = Math.max(...Object.values(STYLE));

/** Part paths owned by this script inside each workbook. */
const INJECTED_SHEET_PART = 'xl/worksheets/abarvaStartHere.xml';
const INJECTED_REL_ID = 'RabarvaStartHereGoverned';
const INJECTED_SHEET_NAME = 'Start Here';
const LEGACY_SHEET_NAME = 'Sheet Guide';

const GATE_TEXT =
  'This workbook is a template and review artifact. Completing it does not load data into any database, ' +
  'index retrieval, enable aVa or any product surface, or make its content client truth. SME validation ' +
  'and the promotion gates come first.';

// --------------------------------------------------------------------------------------
// args
// --------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { out: DEFAULT_OUT, auditOnly: false };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--audit-only') {
      args.auditOnly = true;
    } else if (value === '--help') {
      console.log(
        [
          'Usage:',
          '  node scripts/audit/build-universal-template-workbook-quality-bar.mjs [--out <dir>] [--audit-only]',
        ].join('\n'),
      );
      process.exit(0);
    }
  }
  return args;
}

// --------------------------------------------------------------------------------------
// small helpers
// --------------------------------------------------------------------------------------

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const xmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvFrom = (headers, rows) =>
  [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n') + '\n';

const xmlUnescape = (value) =>
  String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** Strips namespace prefixes so a single set of regexes works on prefixed and bare OOXML. */
const stripNs = (xml) => xml.replace(/<(\/?)[A-Za-z0-9]+:/g, '<$1');

const numericPrefix = (name) => /^(\d{2})_/.exec(path.basename(name))?.[1] ?? '';

// --------------------------------------------------------------------------------------
// workbook reading (the pack is ClosedXML-generated and uses an `x:` namespace prefix,
// which exceljs cannot parse, so sheet discovery goes through raw OOXML)
// --------------------------------------------------------------------------------------

async function readWorkbookShape(absolutePath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(absolutePath));
  const workbookXml = await zip.file('xl/workbook.xml').async('string');
  const relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');

  const sharedFile = zip.file('xl/sharedStrings.xml');
  let shared = [];
  if (sharedFile) {
    const sharedXml = stripNs(await sharedFile.async('string'));
    shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
      [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join(''),
    );
  }

  const rels = new Map(
    [...stripNs(relsXml).matchAll(/<Relationship([^>]*)\/>/g)].map((match) => [
      /Id="([^"]+)"/.exec(match[1])?.[1],
      /Target="([^"]+)"/.exec(match[1])?.[1],
    ]),
  );

  const sheets = [...stripNs(workbookXml).matchAll(/<sheet([^>]*)\/>/g)].map((match) => ({
    name: /name="([^"]+)"/.exec(match[1])?.[1] ?? '',
    sheetId: Number(/sheetId="([^"]+)"/.exec(match[1])?.[1] ?? '0'),
    relId: /r:id="([^"]+)"/.exec(match[1])?.[1] ?? '',
  }));

  const text = [];
  const firstCellBySheet = new Map();
  for (const sheet of sheets) {
    const target = (rels.get(sheet.relId) ?? '').replace(/^\//, '');
    const file = zip.file(target) || zip.file(`xl/${target.replace(/^xl\//, '')}`);
    if (!file) continue;
    const sheetXml = stripNs(await file.async('string'));
    const cells = [];
    for (const cell of sheetXml.matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const type = /t="([^"]+)"/.exec(cell[1])?.[1];
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1];
      if (type === 's') cells.push(shared[Number(raw)] ?? '');
      else if (type === 'inlineStr')
        cells.push([...cell[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join(''));
      else if (raw) cells.push(raw);
    }
    const decoded = cells.map(xmlUnescape);
    firstCellBySheet.set(sheet.name, decoded[0] ?? '');
    text.push(...decoded);
  }

  return { zip, sheets, firstCellBySheet, text: text.join('\n') };
}

// --------------------------------------------------------------------------------------
// mapping model derived from client-intake-workstreams.json + template-manifest.json
// --------------------------------------------------------------------------------------

function buildMappingModel() {
  const workstreams = JSON.parse(
    fs.readFileSync(path.join(ROOT, TEMPLATE_DIR, 'client-intake-workstreams.json'), 'utf8'),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, TEMPLATE_DIR, 'template-manifest.json'), 'utf8'),
  );

  const workbookFiles = fs
    .readdirSync(path.join(ROOT, TEMPLATE_DIR))
    .filter((file) => file.endsWith('.xlsx'))
    .sort();

  // Canonical CSV -> workbook is matched on the NN_ prefix because two workbooks were
  // named differently from their CSV contract (08_* and 17_*). That drift is reported,
  // not silently normalised.
  const workbookByPrefix = new Map();
  for (const file of workbookFiles) {
    const prefix = numericPrefix(file);
    if (prefix) workbookByPrefix.set(prefix, file);
  }

  const csvToWorkbook = new Map();
  const nameDrift = [];
  for (const template of manifest.templates) {
    const prefix = numericPrefix(template.file);
    const workbook = workbookByPrefix.get(prefix);
    if (!workbook) continue;
    csvToWorkbook.set(template.file, workbook);
    if (workbook !== template.file.replace(/\.csv$/, '.xlsx')) {
      nameDrift.push({ csv: template.file, workbook });
    }
  }

  // workbook -> workstreams that feed it
  const workstreamsByWorkbook = new Map();
  const addWorkstream = (workbook, workstream) => {
    if (!workbook) return;
    if (!workstreamsByWorkbook.has(workbook)) workstreamsByWorkbook.set(workbook, []);
    const list = workstreamsByWorkbook.get(workbook);
    if (!list.some((entry) => entry.workstreamId === workstream.workstreamId)) list.push(workstream);
  };

  for (const workstream of workstreams.clientFacingWorkstreams) {
    for (const target of workstream.canonicalTargets ?? []) {
      addWorkstream(csvToWorkbook.get(target), workstream);
    }
    for (const extract of workstream.nativeExtractTemplates ?? []) {
      addWorkstream(extract, workstream);
    }
  }

  return { workstreams, manifest, workbookFiles, csvToWorkbook, workstreamsByWorkbook, nameDrift };
}

function workbookRole(file) {
  if (file === INDEX_WORKBOOK) return 'index';
  if (/^SA\d{2}_/.test(file)) return 'source-extract template';
  if (/^\d{2}_/.test(file)) return 'canonical-dimension template';
  return 'unclassified';
}

function canonicalTargetsFor(file, model) {
  const prefix = numericPrefix(file);
  if (!prefix) return [];
  return [...model.csvToWorkbook.entries()]
    .filter(([, workbook]) => workbook === file)
    .map(([csv]) => csv);
}

// --------------------------------------------------------------------------------------
// injected `Start Here` sheet
// --------------------------------------------------------------------------------------

/**
 * Reuses the workbook's own display title (e.g. "07 Vendors & Contracts") rather than
 * de-slugging the filename. On a re-run the title is taken from the legacy tab so it
 * cannot accumulate the "— Start Here" suffix.
 */
function displayTitle(file, shape) {
  const candidate =
    shape.firstCellBySheet.get(LEGACY_SHEET_NAME) ||
    shape.firstCellBySheet.get(shape.sheets[0]?.name) ||
    '';
  const cleaned = candidate.replace(/\s+—\s+Start Here\s*$/, '').trim();
  if (cleaned) return cleaned;
  return file.replace(/\.xlsx$/, '').replace(/_/g, ' ');
}

function startHereRows(file, model, title) {
  const role = workbookRole(file);
  const streams = model.workstreamsByWorkbook.get(file) ?? [];
  const canonical = canonicalTargetsFor(file, model);
  const isExtract = role === 'source-extract template';

  const label = streams.map((s) => `${s.workstreamId} ${s.workstreamName}`).join(' | ') || 'Not yet mapped';
  const owners = [...new Set(streams.flatMap((s) => s.typicalOwners ?? []))].join('; ') || 'Not yet mapped';
  const provide = [...new Set(streams.flatMap((s) => s.clientShouldProvide ?? []))].join('; ') || 'Not yet mapped';
  const helpers =
    [...new Set(streams.flatMap((s) => s.nativeExtractTemplates ?? []))].join('; ') ||
    'None. Provide the exports and documents listed above in whatever native format your systems produce.';
  const smeFocus = [...new Set(streams.map((s) => s.smeValidationFocus).filter(Boolean))].join(' ');

  const purpose = isExtract
    ? 'This is a helper for a native system export. It shows the shape we can work with and where each exported field lands in the AbarVa model.'
    : 'This is one of the internal target templates AbarVa fills in. You do not have to complete it by hand — it is here so you can see exactly what we are trying to learn and check that we got it right.';

  const rows = [
    [{ v: `${title} — Start Here`, s: STYLE.title }],
    [{ v: purpose, s: STYLE.subtitle }],
    [],
    [
      { v: 'About this workbook', s: STYLE.header },
      { v: 'Detail', s: STYLE.header },
    ],
    [
      { v: 'What this workbook is', s: STYLE.body },
      {
        v: isExtract
          ? 'A native source-extract helper. It is not a questionnaire.'
          : 'A canonical target template. AbarVa populates it from your extracts, documents, and interviews.',
        s: STYLE.body,
      },
    ],
    [
      { v: 'Client-facing workstream(s)', s: STYLE.body },
      { v: label, s: STYLE.body },
    ],
    [
      { v: 'Who normally provides this', s: STYLE.body },
      { v: owners, s: STYLE.body },
    ],
    [
      { v: 'What usually populates it', s: STYLE.body },
      { v: provide, s: STYLE.body },
    ],
    [
      { v: 'Source extract templates that help', s: STYLE.body },
      { v: helpers, s: STYLE.body },
    ],
    [
      { v: 'Canonical target file', s: STYLE.body },
      {
        v: canonical.join('; ') || (isExtract ? 'Feeds several canonical files — see the Target Dimensions tab.' : 'Not mapped'),
        s: STYLE.body,
      },
    ],
    [],
    [
      { v: 'What to do', s: STYLE.header },
      { v: 'Detail', s: STYLE.header },
    ],
    [
      { v: 'Step 1', s: STYLE.body },
      {
        v: `Open ${INDEX_WORKBOOK} first. Its Intake Workstreams and Review Queue sheets show the whole picture and who owns each part.`,
        s: STYLE.body,
      },
    ],
    [
      { v: 'Step 2', s: STYLE.body },
      {
        v: isExtract
          ? 'Send us the raw export from the source system. Do not retype it into this workbook — the tabs here show the shape and the field mapping we expect.'
          : 'Send us the exports and documents listed above. AbarVa maps them into this template so your team is not filling in 19 files by hand.',
        s: STYLE.body,
      },
    ],
    [
      { v: 'Step 3', s: STYLE.body },
      { v: `Use the ${LEGACY_SHEET_NAME} tab for a description of every other tab in this workbook.`, s: STYLE.body },
    ],
    [
      { v: 'Step 4', s: STYLE.body },
      {
        v: 'Review what we produce and tell us where it is wrong. Anything you cannot confirm should be left open as a gap rather than guessed.',
        s: STYLE.body,
      },
    ],
    [
      { v: 'Step 5', s: STYLE.body },
      {
        v: `Record your review decision in the SME Review Matrix in ${INDEX_WORKBOOK}.`,
        s: STYLE.body,
      },
    ],
    [],
    [
      { v: 'Before any of this is used', s: STYLE.header },
      { v: 'Detail', s: STYLE.header },
    ],
    [
      { v: 'Closed gates', s: STYLE.body },
      { v: GATE_TEXT, s: STYLE.body },
    ],
    [
      { v: 'What your SMEs confirm', s: STYLE.body },
      { v: smeFocus || 'Mapped once this workbook is assigned to a workstream.', s: STYLE.body },
    ],
    [
      { v: 'Evidence we need with the data', s: STYLE.body },
      {
        v: 'Source system, report or export name, who owns it, when it was pulled, the period it covers, whether it is full or partial, and any known limitations.',
        s: STYLE.body,
      },
    ],
    [
      { v: 'Governance reference', s: STYLE.body },
      { v: QUALITY_BAR_DOC, s: STYLE.body },
    ],
  ];

  return rows;
}

function buildSheetXml(rows, allowStyles) {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="utf-8"?>');
  parts.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  parts.push('<sheetFormatPr defaultRowHeight="15"/>');
  parts.push(
    '<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="104" customWidth="1"/></cols>',
  );
  parts.push('<sheetData>');

  rows.forEach((cells, index) => {
    const rowNumber = index + 1;
    if (!cells || cells.length === 0) {
      parts.push(`<row r="${rowNumber}"/>`);
      return;
    }
    const cellXml = cells
      .map((cell, columnIndex) => {
        const ref = `${String.fromCharCode(65 + columnIndex)}${rowNumber}`;
        const style = allowStyles && cell.s !== undefined ? ` s="${cell.s}"` : '';
        return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.v)}</t></is></c>`;
      })
      .join('');
    parts.push(`<row r="${rowNumber}">${cellXml}</row>`);
  });

  parts.push('</sheetData></worksheet>');
  return parts.join('');
}

/** Detects the element prefix used by a part, e.g. `x:` for ClosedXML output. */
function detectPrefix(xml, rootElement) {
  return new RegExp(`<([A-Za-z0-9]+:)?${rootElement}[\\s>]`).exec(xml)?.[1] ?? '';
}

async function injectStartHere(absolutePath, rows) {
  const zip = await JSZip.loadAsync(fs.readFileSync(absolutePath));

  const stylesXml = await zip.file('xl/styles.xml').async('string');
  const cellXfsCount = Number(/<(?:[A-Za-z0-9]+:)?cellXfs count="(\d+)"/.exec(stylesXml)?.[1] ?? '0');
  const allowStyles = cellXfsCount > MAX_STYLE_INDEX;

  zip.file(INJECTED_SHEET_PART, buildSheetXml(rows, allowStyles));

  let workbookXml = await zip.file('xl/workbook.xml').async('string');
  const alreadyWired = workbookXml.includes(INJECTED_REL_ID);
  const renamedLegacy = [];

  if (!alreadyWired) {
    const prefix = detectPrefix(workbookXml, 'workbook');

    // The pack's own orientation tab is also called `Start Here`. Keep it, but move it
    // out of the way so exactly one governed front sheet carries that name.
    const bare = stripNs(workbookXml);
    const hasLegacyName = /<sheet[^>]*name="Sheet Guide"/.test(bare);
    if (!hasLegacyName && /<sheet[^>]*name="Start Here"/.test(bare)) {
      workbookXml = workbookXml.replace(/name="Start Here"/, `name="${LEGACY_SHEET_NAME}"`);
      renamedLegacy.push(`${INJECTED_SHEET_NAME} -> ${LEGACY_SHEET_NAME}`);
    }

    const sheetIds = [...stripNs(workbookXml).matchAll(/sheetId="(\d+)"/g)].map((match) => Number(match[1]));
    const nextSheetId = (sheetIds.length ? Math.max(...sheetIds) : 0) + 1;

    const sheetEntry =
      `<${prefix}sheet name="${INJECTED_SHEET_NAME}" sheetId="${nextSheetId}" r:id="${INJECTED_REL_ID}" ` +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" />';
    workbookXml = workbookXml.replace(new RegExp(`<${prefix}sheets>`), `<${prefix}sheets>${sheetEntry}`);
    zip.file('xl/workbook.xml', workbookXml);

    let relsXml = await zip.file('xl/_rels/workbook.xml.rels').async('string');
    const relEntry =
      '<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
      `Target="/${INJECTED_SHEET_PART}" Id="${INJECTED_REL_ID}" />`;
    relsXml = relsXml.replace('</Relationships>', `${relEntry}</Relationships>`);
    zip.file('xl/_rels/workbook.xml.rels', relsXml);

    let typesXml = await zip.file('[Content_Types].xml').async('string');
    const override =
      `<Override PartName="/${INJECTED_SHEET_PART}" ` +
      'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />';
    typesXml = typesXml.replace('</Types>', `${override}</Types>`);
    zip.file('[Content_Types].xml', typesXml);
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(absolutePath, buffer);

  return { allowStyles, alreadyWired, renamedLegacy };
}

// --------------------------------------------------------------------------------------
// index workbook (fully regenerated; exceljs writes cleanly even though it cannot read
// the ClosedXML-prefixed originals)
// --------------------------------------------------------------------------------------

const REVIEW_STATUS = ['Not started', 'In progress', 'Ready for SME review', 'Reviewed', 'Blocked'];
const DISPOSITIONS = ['Approved', 'Approved with caveats', 'Needs correction', 'Cannot confirm', 'Not applicable'];

const INK = { ink: '1F2933', rule: 'D8D4CC', band: 'F1EFEA', edit: 'FFF7E0', head: 'E8E4DC' };

function styleSheet(sheet, { widths, headerRow, freeze, editableColumns = [] }) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true };
  });
  if (headerRow) {
    const header = sheet.getRow(headerRow);
    header.font = { bold: true, size: 11, color: { argb: `FF${INK.ink}` } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${INK.head}` } };
    header.alignment = { vertical: 'middle', wrapText: true };
    header.height = 30;
    header.border = { bottom: { style: 'thin', color: { argb: `FF${INK.rule}` } } };
  }
  if (freeze) sheet.views = [{ state: 'frozen', ySplit: freeze }];
  for (const column of editableColumns) {
    sheet.getColumn(column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${INK.edit}` } };
  }
}

function addTitleBlock(sheet, title, subtitle) {
  const titleRow = sheet.addRow([title]);
  titleRow.font = { bold: true, size: 15, color: { argb: `FF${INK.ink}` } };
  titleRow.height = 26;
  const subtitleRow = sheet.addRow([subtitle]);
  subtitleRow.font = { size: 11, color: { argb: 'FF5B6670' } };
  subtitleRow.alignment = { wrapText: true, vertical: 'top' };
  subtitleRow.height = 34;
  sheet.addRow([]);
}

function applyDropdown(sheet, column, firstRow, lastRow, values) {
  for (let row = firstRow; row <= lastRow; row += 1) {
    sheet.getCell(row, column).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${values.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Choose a listed value',
      error: `Allowed values: ${values.join(', ')}`,
    };
  }
}

function buildIndexWorkbook(model) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa';
  workbook.created = new Date(Date.UTC(2026, 7, 12));
  workbook.modified = new Date(Date.UTC(2026, 7, 12));

  const streams = model.workstreams.clientFacingWorkstreams;

  // ---- Start Here ----------------------------------------------------------------
  const start = workbook.addWorksheet('Start Here');
  addTitleBlock(
    start,
    'AbarVa Enterprise Context Intake — Start Here',
    'This pack collects the evidence AbarVa needs to build an accurate picture of your enterprise. ' +
      'You are not being asked to fill in a large set of spreadsheets. You are being asked to point us at ' +
      'the exports, documents, and people you already have, and then to check what we produce.',
  );

  start.addRow(['What this is', 'Detail']);
  const startHeaderRow = start.rowCount;
  const startBody = [
    [
      'The short version',
      'Ten intake workstreams, each owned by a group you already have. Send the evidence, review what we build, tell us where it is wrong.',
    ],
    [
      'What you do NOT have to do',
      'You do not have to complete the 19 canonical workbooks in this folder by hand. They are our internal target model, included so you can see exactly what we are trying to learn.',
    ],
    ['Step 1', 'Read Intake Workstreams. Decide which of the ten apply to this engagement.'],
    ['Step 2', 'Use Review Queue to assign an owner group and a date to each workstream you activated.'],
    [
      'Step 3',
      'Send the exports and documents listed for each workstream. Source Extract Map shows where a ready-made extract template exists.',
    ],
    ['Step 4', 'AbarVa maps your evidence into the canonical model. Canonical Mapping shows where each workstream lands.'],
    ['Step 5', 'Your SMEs review the result and record a decision in SME Review Matrix.'],
    ['Step 6', 'Evidence and Gates lists what we need alongside each file and what stays blocked until review is complete.'],
    ['Closed gates', GATE_TEXT],
    [
      'How to answer "I do not know"',
      'Leave it open. An explicit gap is more useful to us than a guess, and every gap becomes a tracked evidence request rather than an assumption.',
    ],
    ['Confidence scoring', 'You do not score rows. AbarVa calculates confidence from source authority, freshness, completeness, corroboration, and conflicts.'],
    ['Governance reference', QUALITY_BAR_DOC],
  ];
  startBody.forEach((row) => start.addRow(row));
  styleSheet(start, { widths: [30, 108], headerRow: startHeaderRow, freeze: startHeaderRow });

  // ---- Intake Workstreams --------------------------------------------------------
  const intake = workbook.addWorksheet('Intake Workstreams');
  addTitleBlock(
    intake,
    'Intake Workstreams',
    'The ten client-facing workstreams. A focused engagement may activate only a few; a full enterprise-context engagement activates all ten.',
  );
  intake.addRow([
    'ID',
    'Workstream',
    'Who normally owns it',
    'What to provide',
    'Ready-made extract templates',
    'What AbarVa produces from it',
    'What your SMEs confirm',
  ]);
  const intakeHeaderRow = intake.rowCount;
  for (const stream of streams) {
    intake.addRow([
      stream.workstreamId,
      stream.workstreamName,
      (stream.typicalOwners ?? []).join('; '),
      (stream.clientShouldProvide ?? []).join('; '),
      (stream.nativeExtractTemplates ?? []).join('; ') || 'None — send native exports/documents',
      (stream.reviewObjectsProduced ?? []).join('; '),
      stream.smeValidationFocus ?? '',
    ]);
  }
  styleSheet(intake, { widths: [8, 34, 30, 46, 34, 34, 48], headerRow: intakeHeaderRow, freeze: intakeHeaderRow });

  // ---- Review Queue --------------------------------------------------------------
  const queue = workbook.addWorksheet('Review Queue');
  addTitleBlock(
    queue,
    'Review Queue',
    'One row per workstream. Assign the owner group, agree a date, and track status here. Shaded columns are yours to fill in.',
  );
  queue.addRow([
    'ID',
    'Workstream',
    'Suggested owner group',
    'What to provide',
    'Primary source templates',
    'Canonical targets AbarVa will populate',
    'Decision needed from you',
    'Status',
    'Owner name',
    'Target date (YYYY-MM-DD)',
    'Notes',
  ]);
  const queueHeaderRow = queue.rowCount;
  for (const stream of streams) {
    queue.addRow([
      stream.workstreamId,
      stream.workstreamName,
      (stream.typicalOwners ?? []).join('; '),
      (stream.clientShouldProvide ?? []).join('; '),
      (stream.nativeExtractTemplates ?? []).join('; ') || 'None',
      (stream.canonicalTargets ?? []).join('; '),
      `Is this workstream in scope, who owns it, and can they release the evidence by an agreed date?`,
      '',
      '',
      '',
      '',
    ]);
  }
  const queueLastRow = queue.rowCount;
  styleSheet(queue, {
    widths: [8, 32, 28, 42, 28, 40, 44, 20, 20, 22, 34],
    headerRow: queueHeaderRow,
    freeze: queueHeaderRow,
    editableColumns: [8, 9, 10, 11],
  });
  applyDropdown(queue, 8, queueHeaderRow + 1, queueLastRow, REVIEW_STATUS);

  // ---- Source Extract Map --------------------------------------------------------
  const extractMap = workbook.addWorksheet('Source Extract Map');
  addTitleBlock(
    extractMap,
    'Source Extract Map',
    'Where a native system export exists, use the matching extract template. Send the raw export — do not retype it.',
  );
  extractMap.addRow([
    'Extract template',
    'Typical source system',
    'Workstream',
    'Canonical dimensions it populates',
    'Ask your team for',
    'Settle before we trust it',
  ]);
  const extractHeaderRow = extractMap.rowCount;

  const extractDetail = {
    SA01: {
      system: 'ServiceNow CMDB or equivalent configuration database',
      ask: 'CMDB export including business applications, infrastructure CIs, and CI relationships',
      settle: 'Which tables were exported and when; whether applications are linked to infrastructure; whether owners are current',
    },
    SA02: {
      system: 'IT finance: GL, budget, AP/invoice, purchase orders',
      ask: 'Budget and actuals by cost centre, AP/invoice detail, purchase orders, rate cards',
      settle: 'Which system is source-of-record; the period covered; whether the split is run/change/transform; who attests to it',
    },
    SA03: {
      system: 'Contract lifecycle management or vendor master',
      ask: 'Vendor master, contract register, renewal calendar, commercial terms',
      settle: 'Which contracts are in scope; whether spend is contracted or actual; who owns each contract',
    },
    SA04: {
      system: 'PPM / portfolio management',
      ask: 'Portfolio register, program list, milestones, dependencies, funding status, benefit case',
      settle: 'Which portfolio view is authoritative; whether benefits are forecast or realised; funding status as of when',
    },
    SA05: {
      system: 'Cloud provider consoles and cost reports',
      ask: 'Account/subscription inventory, resource inventory, cost and usage reports',
      settle: 'Which accounts are in scope; whether non-production is included; tagging quality',
    },
    SA06: {
      system: 'IT service management: incident, problem, change',
      ask: 'Incident, problem, and change extracts with service and application references',
      settle: 'The period covered; whether records link to applications; whether severity definitions are consistent',
    },
  };

  const extractFiles = model.workbookFiles.filter((file) => /^SA\d{2}_/.test(file));
  for (const file of extractFiles) {
    const key = file.slice(0, 4);
    const detail = extractDetail[key] ?? {};
    const streamsForFile = model.workstreamsByWorkbook.get(file) ?? [];
    extractMap.addRow([
      file,
      detail.system ?? '',
      streamsForFile.map((s) => `${s.workstreamId} ${s.workstreamName}`).join('; ') || 'Not mapped',
      [...new Set(streamsForFile.flatMap((s) => s.canonicalTargets ?? []))].join('; '),
      detail.ask ?? '',
      detail.settle ?? '',
    ]);
  }
  styleSheet(extractMap, { widths: [46, 38, 34, 44, 46, 52], headerRow: extractHeaderRow, freeze: extractHeaderRow });

  // ---- Canonical Mapping ---------------------------------------------------------
  const mapping = workbook.addWorksheet('Canonical Mapping');
  addTitleBlock(
    mapping,
    'Canonical Mapping',
    'How the ten workstreams land in the canonical model. This is AbarVa’s internal target shape, shown so you can see what we do with your evidence.',
  );
  mapping.addRow([
    '#',
    'Canonical file',
    'Workbook in this folder',
    'Fed by workstream(s)',
    'How it is populated',
  ]);
  const mappingHeaderRow = mapping.rowCount;

  const derivedFiles = new Set([
    '12_relationships.csv',
    '13_evidence_sources.csv',
    '15_industry_context_patterns.csv',
    '16_expert_lenses.csv',
  ]);

  for (const template of model.manifest.templates) {
    const workbookFile = model.csvToWorkbook.get(template.file) ?? '';
    const streamsForFile = model.workstreamsByWorkbook.get(workbookFile) ?? [];
    mapping.addRow([
      numericPrefix(template.file),
      template.file,
      workbookFile || 'No workbook',
      streamsForFile.map((s) => s.workstreamId).join(', ') || 'Not mapped',
      derivedFiles.has(template.file)
        ? 'Derived by AbarVa from the other dimensions and from interviews; not a client questionnaire.'
        : 'Populated from client exports, documents, and SME answers through the source adapters.',
    ]);
  }
  styleSheet(mapping, { widths: [6, 42, 42, 24, 62], headerRow: mappingHeaderRow, freeze: mappingHeaderRow });

  // ---- SME Review Matrix ---------------------------------------------------------
  const sme = workbook.addWorksheet('SME Review Matrix');
  addTitleBlock(
    sme,
    'SME Review Matrix',
    'One row per workstream. Answer the question in plain business language and record your decision. Shaded columns are yours to fill in.',
  );
  sme.addRow([
    'ID',
    'Workstream',
    'Question for your SME',
    'Review status',
    'Disposition',
    'Reviewer name',
    'Reviewer role',
    'Review date (YYYY-MM-DD)',
    'Reviewer notes',
  ]);
  const smeHeaderRow = sme.rowCount;
  for (const stream of streams) {
    sme.addRow([
      stream.workstreamId,
      stream.workstreamName,
      stream.smeValidationFocus ?? '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }
  sme.addRow([
    'PACK',
    'Whole intake pack',
    'Is the workstream list right for this engagement, are the owner groups correct, and is anything material missing?',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const smeLastRow = sme.rowCount;
  styleSheet(sme, {
    widths: [8, 32, 60, 22, 24, 22, 24, 24, 44],
    headerRow: smeHeaderRow,
    freeze: smeHeaderRow,
    editableColumns: [4, 5, 6, 7, 8, 9],
  });
  applyDropdown(sme, 4, smeHeaderRow + 1, smeLastRow, REVIEW_STATUS);
  applyDropdown(sme, 5, smeHeaderRow + 1, smeLastRow, DISPOSITIONS);
  for (let row = smeHeaderRow + 1; row <= smeLastRow; row += 1) {
    sme.getCell(row, 8).numFmt = '@';
  }

  // ---- Evidence and Gates --------------------------------------------------------
  const gates = workbook.addWorksheet('Evidence and Gates');
  addTitleBlock(
    gates,
    'Evidence and Gates',
    'What we need alongside each file, and what stays closed until your SMEs have reviewed the result.',
  );

  gates.addRow(['Item', 'What we need', 'Why']);
  const gatesHeaderRow = gates.rowCount;
  const provenance = [
    ['Source system', 'The system the export came from', 'Ties every fact back to a system of record'],
    ['Report or export name', 'The name of the report, query, or table', 'Lets us or you re-run the same extract later'],
    ['Source owner', 'The team or role that owns the export', 'Tells us who to go back to with questions'],
    ['Extract date', 'When the file was pulled', 'Distinguishes current state from history'],
    ['Effective period', 'The period or as-of date the data covers', 'Stops a full-year figure being read as a monthly one'],
    ['Full or partial', 'Whether this is the whole population or a subset', 'Prevents a partial export being counted as a total'],
    ['Classification', 'How sensitive the file is', 'Drives handling and who can see the result'],
    ['Known limitations', 'Anything you already know is wrong or stale', 'Cheaper to record now than to discover in review'],
  ];
  provenance.forEach((row) => gates.addRow(row));

  gates.addRow([]);
  gates.addRow(['Gate', 'Status until SME review completes', 'Detail']);
  const gate2HeaderRow = gates.rowCount;
  const gateRows = [
    ['Loading into the data platform', 'Closed', 'No canonical load happens on the strength of a completed template.'],
    ['Retrieval indexing', 'Closed', 'Content is not made searchable to the assistant until it is validated.'],
    ['aVa and assistant use', 'Closed', 'The assistant does not answer from unvalidated intake content.'],
    ['Product surfaces', 'Closed', 'Home, Intelligence, Moves, Source, and Tower do not project unvalidated content.'],
    ['Executive narrative', 'Closed', 'Nothing here is quoted to your executives as fact before you have signed it off.'],
    ['Financial and value claims', 'Closed', 'Spend, savings, and benefit figures need a named finance source and attestation.'],
    [
      'Interview-derived statements',
      'Marked as signal',
      'What we hear in interviews is recorded as a proposed signal until a source system or an attestation corroborates it.',
    ],
  ];
  gateRows.forEach((row) => gates.addRow(row));
  styleSheet(gates, { widths: [34, 40, 76], headerRow: gatesHeaderRow });
  const gate2Header = gates.getRow(gate2HeaderRow);
  gate2Header.font = { bold: true, size: 11, color: { argb: `FF${INK.ink}` } };
  gate2Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${INK.head}` } };
  gate2Header.height = 30;

  return workbook;
}

// --------------------------------------------------------------------------------------
// main
// --------------------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const model = buildMappingModel();
  const templateDirAbs = path.join(ROOT, TEMPLATE_DIR);
  const outDir = path.join(ROOT, args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const inventory = [];
  const notes = [];

  for (const file of model.workbookFiles) {
    const absolutePath = path.join(templateDirAbs, file);
    const before = await readWorkbookShape(absolutePath);
    const beforeSheets = before.sheets.map((sheet) => sheet.name);
    const role = workbookRole(file);
    const streams = model.workstreamsByWorkbook.get(file) ?? [];

    const hasStartHere = beforeSheets.some((name) => /^start here$/i.test(name));
    const hasReviewQueue = beforeSheets.some((name) => /review queue|review matrix/i.test(name));
    const hasSmeFields = /reviewer name|review status|disposition/i.test(before.text);
    const namesWorkstream = /client-facing workstream/i.test(before.text);

    let action;
    if (file === INDEX_WORKBOOK) {
      action =
        'Rebuild as the client front door: Start Here, Intake Workstreams, Review Queue, Source Extract Map, ' +
        'Canonical Mapping, SME Review Matrix, Evidence and Gates. The existing sheets are an internal ' +
        'generation contract and name a stale index workbook, so they are replaced rather than extended.';
    } else if (namesWorkstream) {
      action = 'Refresh the governed Start Here sheet in place.';
    } else {
      action =
        'Add a governed Start Here sheet naming the workstream, owner group, populating evidence, ' +
        'canonical role, and pointer to the index; keep the existing tabs unchanged.';
    }

    let result = { alreadyWired: false, renamedLegacy: [], allowStyles: false };
    const shaBefore = sha256(absolutePath);

    if (!args.auditOnly) {
      if (file === INDEX_WORKBOOK) {
        const workbook = buildIndexWorkbook(model);
        await workbook.xlsx.writeFile(absolutePath);
      } else {
        result = await injectStartHere(absolutePath, startHereRows(file, model, displayTitle(file, before)));
      }
    }

    const shaAfter = args.auditOnly ? shaBefore : sha256(absolutePath);
    const after = args.auditOnly ? before : await readWorkbookShape(absolutePath);

    inventory.push({
      workbook: `${TEMPLATE_DIR}/${file}`,
      role,
      workstreams: streams.map((s) => `${s.workstreamId} ${s.workstreamName}`).join(' | ') || 'not mapped',
      canonical_targets: canonicalTargetsFor(file, model).join('; '),
      had_start_here_before: hasStartHere ? 'yes' : 'no',
      start_here_named_workstream_before: namesWorkstream ? 'yes' : 'no',
      had_review_queue_before: hasReviewQueue ? 'yes' : 'no',
      had_sme_review_fields_before: hasSmeFields ? 'yes' : 'no',
      sheets_before: beforeSheets.join(' | '),
      sheets_after: after.sheets.map((sheet) => sheet.name).join(' | '),
      recommended_action: action,
      applied: args.auditOnly ? 'audit-only' : 'applied',
      sha256_before: shaBefore,
      sha256_after: shaAfter,
    });

    if (result.renamedLegacy.length) {
      notes.push(`${file}: renamed legacy orientation tab (${result.renamedLegacy.join(', ')}).`);
    }
    if (!args.auditOnly && file !== INDEX_WORKBOOK && !result.allowStyles) {
      notes.push(`${file}: shared styles were not reusable, Start Here written unstyled.`);
    }
  }

  for (const drift of model.nameDrift) {
    notes.push(
      `Naming drift: canonical contract ${drift.csv} is carried by workbook ${drift.workbook}; ` +
        'the CSV contract is authoritative and was not renamed.',
    );
  }

  // ---- reports -------------------------------------------------------------------
  const headers = Object.keys(inventory[0]);
  fs.writeFileSync(
    path.join(outDir, 'template-workbook-inventory.csv'),
    csvFrom(headers, inventory.map((row) => headers.map((key) => row[key]))),
  );

  const unmapped = inventory.filter((row) => row.role !== 'index' && row.workstreams === 'not mapped');
  const summary = {
    generatedBy: 'scripts/audit/build-universal-template-workbook-quality-bar.mjs',
    templateSetId: model.manifest.templateSetId,
    templateDir: TEMPLATE_DIR,
    qualityBar: QUALITY_BAR_DOC,
    mode: args.auditOnly ? 'audit-only' : 'apply',
    counts: {
      workbooks: inventory.length,
      canonicalDimensionTemplates: inventory.filter((row) => row.role === 'canonical-dimension template').length,
      sourceExtractTemplates: inventory.filter((row) => row.role === 'source-extract template').length,
      workstreams: model.workstreams.clientFacingWorkstreams.length,
      canonicalCsvContracts: model.manifest.templates.length,
      workbooksWithoutWorkstreamMapping: unmapped.length,
    },
    status: 'template_and_review_artifacts_only_no_load_no_product_use',
    notes,
    workbooks: inventory,
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  const md = [
    '# Universal Template Pack — Workbook Quality Bar',
    '',
    `Template set: \`${model.manifest.templateSetId}\``,
    `Quality bar: \`${QUALITY_BAR_DOC}\``,
    `Mode: \`${summary.mode}\``,
    '',
    '## What changed',
    '',
    `- \`${INDEX_WORKBOOK}\` rebuilt as the client front door with seven sheets.`,
    `- ${inventory.length - 1} pack workbooks received a governed \`Start Here\` first sheet.`,
    '- Existing tabs and every CSV column contract were left unchanged.',
    '',
    '## Counts',
    '',
    '| Item | Count |',
    '| --- | --- |',
    ...Object.entries(summary.counts).map(([key, value]) => `| ${key} | ${value} |`),
    '',
    '## Workbooks',
    '',
    '| Workbook | Role | Workstream(s) | Start Here named a workstream before | Sheets after |',
    '| --- | --- | --- | --- | --- |',
    ...inventory.map(
      (row) =>
        `| \`${path.basename(row.workbook)}\` | ${row.role} | ${row.workstreams} | ` +
        `${row.start_here_named_workstream_before} | ${row.sheets_after} |`,
    ),
    '',
    '## Notes',
    '',
    ...(notes.length ? notes.map((note) => `- ${note}`) : ['- None.']),
    '',
    '## Governance boundary',
    '',
    `${GATE_TEXT}`,
    '',
    'Workbook hashes before and after are recorded in `template-workbook-inventory.csv`.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'summary.md'), md);

  console.log(`Workbooks processed: ${inventory.length} (${summary.mode})`);
  console.log(`Report: ${args.out}`);
  for (const note of notes) console.log(`  note: ${note}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

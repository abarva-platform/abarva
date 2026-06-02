'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { NORTHSTAR_CONTEXT_TEMPLATES } from '@/lib/context-ingestion/template-registry';
import { buildTemplateSchemaPreflight } from '@/lib/context-ingestion/schema-preflight';

type UploadResult = {
  ok: boolean;
  uploadId?: string;
  rowsParsed?: number;
  chunksQueued?: number;
  mapping?: {
    templateId: string;
    sourceRecordIdColumn: string | null;
    titleColumn: string | null;
    textColumns: string[];
  };
  embeddingHandoff?: {
    command: string;
    searchableWhen: string;
  };
  persistence?: {
    status: string;
    detail: string;
  };
  detail?: string;
};

interface CsvUploadConnectorProps {
  clientId: string;
  tenantName: string;
}

const inputStyle = {
  border: '1px solid #d8d2c4',
  borderRadius: 6,
  padding: '9px 10px',
  background: '#fff',
  color: '#171717',
  fontFamily: 'DM Sans, sans-serif',
};

function splitHeaderLine(line: string): string[] {
  const headers: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      headers.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  headers.push(current.trim());
  return headers.filter(Boolean);
}

export function CsvUploadConnector({ clientId, tenantName }: CsvUploadConnectorProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState('application-portfolio');
  const [sourceRecordIdColumn, setSourceRecordIdColumn] = useState('');
  const [titleColumn, setTitleColumn] = useState('');
  const [selectedTextColumns, setSelectedTextColumns] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const template = useMemo(
    () => NORTHSTAR_CONTEXT_TEMPLATES.find((item) => item.id === templateId) ?? NORTHSTAR_CONTEXT_TEMPLATES[0],
    [templateId],
  );
  const schemaPreflight = useMemo(
    () => headers.length > 0 ? buildTemplateSchemaPreflight({ templateId, headers }) : null,
    [headers, templateId],
  );
  const requiredFieldsBlocked = (schemaPreflight?.missingRequiredFields.length ?? 0) > 0;

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    if (!nextFile) {
      setHeaders([]);
      return;
    }
    const text = await nextFile.slice(0, 64 * 1024).text();
    const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== '') ?? '';
    const parsedHeaders = splitHeaderLine(firstLine);
    setHeaders(parsedHeaders);
    const idColumn = parsedHeaders.find((header) => /(^|_)id$/i.test(header.replace(/[^a-z0-9]+/gi, '_'))) ?? '';
    const nameColumn = parsedHeaders.find((header) => /^(name|title|vendor_name|tool_name)$/i.test(header)) ?? '';
    setSourceRecordIdColumn(idColumn);
    setTitleColumn(nameColumn);
    setSelectedTextColumns(parsedHeaders.slice(0, 8));
  }

  function toggleTextColumn(header: string) {
    setSelectedTextColumns((current) =>
      current.includes(header)
        ? current.filter((item) => item !== header)
        : [...current, header],
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setResult(null);
    const formData = new FormData();
    formData.set('clientId', clientId);
    formData.set('file', file);
    formData.set('templateId', templateId);
    formData.set('dataClassification', 'confidential');
    if (sourceRecordIdColumn) formData.set('sourceRecordIdColumn', sourceRecordIdColumn);
    if (titleColumn) formData.set('titleColumn', titleColumn);
    formData.set('textColumns', JSON.stringify(selectedTextColumns));
    formData.set('fieldMappings', JSON.stringify({}));
    if (schemaPreflight) {
      formData.set('schemaPreflight', JSON.stringify({
        templateId,
        clarificationRequired: schemaPreflight.clarificationRequired,
        missingRequiredFields: schemaPreflight.missingRequiredFields,
        unknownColumns: schemaPreflight.unknownColumns,
      }));
    }

    try {
      const response = await fetch('/api/admin/context-layer/csv-upload', {
        method: 'POST',
        body: formData,
      });
      setResult(await response.json() as UploadResult);
    } catch (error) {
      setResult({
        ok: false,
        detail: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif', display: 'grid', gap: 14 }}>
      <div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: 0 }}>CSV connector</h2>
        <p style={{ color: '#514c43', margin: '6px 0 0', lineHeight: 1.5 }}>
          Load CSV rows into {tenantName} as tenant context chunks. New chunks stay pending until the embedding worker runs.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>CSV file</span>
            <input style={inputStyle} type="file" accept=".csv,text/csv" onChange={onFileChange} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Context template</span>
            <select style={inputStyle} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {NORTHSTAR_CONTEXT_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        {headers.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Record id column</span>
              <select style={inputStyle} value={sourceRecordIdColumn} onChange={(event) => setSourceRecordIdColumn(event.target.value)}>
                <option value="">Row number</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Title column</span>
              <select style={inputStyle} value={titleColumn} onChange={(event) => setTitleColumn(event.target.value)}>
                <option value="">None</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </label>
          </div>
        )}

        {headers.length > 0 && (
          <fieldset style={{ border: '1px solid #e3decf', borderRadius: 6, padding: 12 }}>
            <legend>Chunk text columns</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {headers.map((header) => (
                <label key={header} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #d8d2c4', borderRadius: 6, padding: '6px 8px', background: selectedTextColumns.includes(header) ? '#EEE8D8' : '#fff' }}>
                  <input
                    type="checkbox"
                    checked={selectedTextColumns.includes(header)}
                    onChange={() => toggleTextColumn(header)}
                  />
                  <span>{header}</span>
                </label>
              ))}
            </div>
            <p style={{ color: '#6b665c', marginBottom: 0 }}>
              Required fields for {template?.label}: {(template?.requiredFields ?? []).join(', ')}
            </p>
          </fieldset>
        )}

        {schemaPreflight && (
          <section aria-label="Template schema preflight" style={{ border: '1px solid #e3decf', borderRadius: 6, padding: 12, background: schemaPreflight.clarificationRequired ? '#FFF9EC' : '#F4F8F1', display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong>{schemaPreflight.clarificationRequired ? 'Schema clarification required' : 'Template fit confirmed'}</strong>
              <span style={{ color: '#6b665c' }}>
                {schemaPreflight.mappedRequiredFields.length}/{template.requiredFields.length} required fields mapped
              </span>
            </div>
            {schemaPreflight.missingRequiredFields.length > 0 && (
              <div>
                <span style={{ fontWeight: 700 }}>Missing required fields: </span>
                <span>{schemaPreflight.missingRequiredFields.join(', ')}</span>
              </div>
            )}
            {schemaPreflight.unknownColumns.length > 0 && (
              <div>
                <span style={{ fontWeight: 700 }}>Columns needing context: </span>
                <span>{schemaPreflight.unknownColumns.join(', ')}</span>
              </div>
            )}
            {schemaPreflight.clarificationRequests.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, color: '#514c43' }}>
                {schemaPreflight.clarificationRequests.slice(0, 4).map((request) => (
                  <li key={`${request.action}:${request.field}`}>{request.message}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div>
          <button
            type="submit"
            disabled={!file || pending || requiredFieldsBlocked}
            style={{ border: '1px solid #171717', borderRadius: 6, padding: '10px 14px', background: pending || requiredFieldsBlocked ? '#d8d2c4' : '#171717', color: pending || requiredFieldsBlocked ? '#514c43' : '#fff', fontFamily: 'DM Sans, sans-serif', cursor: !file || pending || requiredFieldsBlocked ? 'not-allowed' : 'pointer' }}
          >
            {pending ? 'Loading CSV...' : requiredFieldsBlocked ? 'Resolve required fields' : 'Load CSV'}
          </button>
        </div>
      </form>

      {result && (
        <div role="status" style={{ border: '1px solid #e3decf', borderRadius: 6, padding: 12, background: result.ok ? '#F4F8F1' : '#FFF4F1' }}>
          {result.ok ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <strong>{result.chunksQueued?.toLocaleString()} chunks queued from {result.rowsParsed?.toLocaleString()} rows.</strong>
              <span>{result.persistence?.detail}</span>
              <code style={{ whiteSpace: 'normal' }}>{result.embeddingHandoff?.command}</code>
            </div>
          ) : (
            <span>{result.detail ?? result.persistence?.detail ?? 'CSV upload did not complete.'}</span>
          )}
        </div>
      )}
    </section>
  );
}

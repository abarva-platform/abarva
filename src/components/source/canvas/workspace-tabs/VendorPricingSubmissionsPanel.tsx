'use client';

// Vendor Pricing Submissions panel — rendered inside the d19 artifact
// card on DocumentTab. Lets the buyer upload a vendor's filled-in copy
// of the d19a Pricing Template and view the active submissions list.
//
// The upload flow:
//   1. User picks a .xlsx file (optional vendor name override)
//   2. Component POSTs multipart to vendor-submission route
//   3. On success, refetches the list and shows the new row
//   4. Each row shows parse status, line count, deviations, warnings
//
// When the migration hasn't been applied yet (Slice 2c.2 substrate),
// the GET returns { submissions: [] } and the upload returns 500. The
// component handles both gracefully — empty state + inline error.

import { useCallback, useEffect, useState } from 'react';

interface SubmissionDto {
  id: string;
  vendorName: string;
  submittedAt: string;
  parseStatus: 'parsed' | 'partial' | 'failed';
  parseWarnings: Array<{ code: string; message: string }>;
  unitPriceCount: number;
  deviationCount: number;
  uploadedFilename: string | null;
}

interface UploadResultDto {
  id: string;
  vendorName: string;
  parseStatus: 'parsed' | 'partial' | 'failed';
  parseWarnings: Array<{ code: string; message: string }>;
  unitPriceCount: number;
  deviationCount: number;
  supersededCount: number;
  submittedAt: string;
}

export interface VendorPricingSubmissionsPanelProps {
  eventId: string;
  artifactCode: string;
}

const SECTION_STYLE: React.CSSProperties = {
  marginTop: 24,
  padding: 16,
  border: '1px solid #D8D5CC',
  borderRadius: 8,
  background: '#FAFAF6',
};

const HEADER_STYLE: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 18,
  fontWeight: 'normal',
  margin: 0,
  marginBottom: 4,
  color: '#0C1A3A',
};

const SUBHEADER_STYLE: React.CSSProperties = {
  fontSize: 13,
  color: '#706D66',
  marginBottom: 16,
};

const UPLOAD_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  background: 'white',
  border: '1px solid #D8D5CC',
  borderRadius: 6,
  marginBottom: 12,
};

const FILE_INPUT_STYLE: React.CSSProperties = {
  fontSize: 13,
};

const VENDOR_INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 180,
  padding: '6px 10px',
  border: '1px solid #D8D5CC',
  borderRadius: 4,
  fontSize: 13,
};

const ERROR_STYLE: React.CSSProperties = {
  padding: 10,
  background: '#FADBDB',
  border: '1px solid #E5A5A5',
  borderRadius: 4,
  color: '#7A2020',
  fontSize: 13,
  marginBottom: 12,
};

const SUCCESS_STYLE: React.CSSProperties = {
  padding: 10,
  background: '#E2F5E8',
  border: '1px solid #9DD3AC',
  borderRadius: 4,
  color: '#1F5F33',
  fontSize: 13,
  marginBottom: 12,
};

const LIST_STYLE: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto auto auto',
  gap: 12,
  padding: 12,
  borderBottom: '1px solid #ECE9E0',
  alignItems: 'center',
};

const VENDOR_NAME_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#0C1A3A',
};

const META_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#706D66',
};

const STATUS_BADGE: Record<SubmissionDto['parseStatus'], React.CSSProperties> = {
  parsed: {
    fontSize: 11,
    padding: '2px 8px',
    background: '#E2F5E8',
    color: '#1F5F33',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partial: {
    fontSize: 11,
    padding: '2px 8px',
    background: '#FFF4D6',
    color: '#7A5800',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  failed: {
    fontSize: 11,
    padding: '2px 8px',
    background: '#FADBDB',
    color: '#7A2020',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: 16,
  textAlign: 'center',
  fontSize: 13,
  color: '#706D66',
  background: 'white',
  border: '1px dashed #D8D5CC',
  borderRadius: 6,
};

const WARNINGS_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#706D66',
  marginTop: 4,
};

export function VendorPricingSubmissionsPanel({
  eventId,
  artifactCode,
}: VendorPricingSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<UploadResultDto | null>(null);
  const [vendorNameOverride, setVendorNameOverride] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const listUrl = `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/vendor-submissions`;
  const uploadUrl = `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/vendor-submission`;

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(listUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    } catch (err) {
      console.warn('[VendorPricingSubmissionsPanel] list failed', err);
      setSubmissions([]);
    } finally {
      setLoadingList(false);
    }
  }, [listUrl]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const onUploadClick = useCallback(async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      if (vendorNameOverride.trim()) {
        fd.append('vendorName', vendorNameOverride.trim());
      }
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.error ?? `HTTP ${res.status}`);
      }
      const result = (await res.json()) as UploadResultDto;
      setUploadSuccess(result);
      setPendingFile(null);
      setVendorNameOverride('');
      await refetch();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }, [pendingFile, vendorNameOverride, uploadUrl, refetch]);

  return (
    <section
      data-testid={`vendor-pricing-submissions-${artifactCode}`}
      style={SECTION_STYLE}
    >
      <h4 style={HEADER_STYLE}>Vendor pricing submissions</h4>
      <p style={SUBHEADER_STYLE}>
        Upload each vendor&rsquo;s filled-in copy of the d19a Pricing Template
        below. The d19c comparison switches to real submissions once at least
        one is uploaded.
      </p>

      <div style={UPLOAD_ROW_STYLE}>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setPendingFile(f);
            setUploadError(null);
            setUploadSuccess(null);
          }}
          disabled={uploading}
          data-testid="vendor-pricing-submission-file-input"
          style={FILE_INPUT_STYLE}
        />
        <input
          type="text"
          placeholder="Vendor name (optional override)"
          value={vendorNameOverride}
          onChange={(e) => setVendorNameOverride(e.target.value)}
          disabled={uploading}
          data-testid="vendor-pricing-submission-name-input"
          style={VENDOR_INPUT_STYLE}
        />
        <button
          type="button"
          onClick={onUploadClick}
          disabled={!pendingFile || uploading}
          data-testid="vendor-pricing-submission-upload-button"
          style={{
            padding: '6px 16px',
            background: !pendingFile || uploading ? '#D8D5CC' : '#0C1A3A',
            color: !pendingFile || uploading ? '#706D66' : '#FAF7F1',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: !pendingFile || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading…' : 'Upload submission'}
        </button>
      </div>

      {uploadError ? (
        <div role="alert" style={ERROR_STYLE} data-testid="vendor-pricing-submission-error">
          Upload failed: {uploadError}
        </div>
      ) : null}

      {uploadSuccess ? (
        <div style={SUCCESS_STYLE} data-testid="vendor-pricing-submission-success">
          Saved <strong>{uploadSuccess.vendorName}</strong> · {uploadSuccess.parseStatus}
          {' · '}
          {uploadSuccess.unitPriceCount} priced
          {' · '}
          {uploadSuccess.deviationCount} deviation
          {uploadSuccess.deviationCount === 1 ? '' : 's'}
          {uploadSuccess.supersededCount > 0
            ? ` · superseded ${uploadSuccess.supersededCount} prior submission${uploadSuccess.supersededCount === 1 ? '' : 's'}`
            : ''}
          .
        </div>
      ) : null}

      {loadingList ? (
        <div style={EMPTY_STATE_STYLE}>Loading submissions…</div>
      ) : submissions.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>
          No vendor submissions yet. Upload a filled d19 template to switch the
          comparison out of demo mode.
        </div>
      ) : (
        <ul style={LIST_STYLE} data-testid="vendor-pricing-submissions-list">
          {submissions.map((s) => (
            <li
              key={s.id}
              style={ROW_STYLE}
              data-testid={`vendor-pricing-submission-row-${s.id}`}
            >
              <div>
                <div style={VENDOR_NAME_STYLE}>{s.vendorName}</div>
                <div style={META_STYLE}>
                  Submitted {formatTimestamp(s.submittedAt)}
                  {s.uploadedFilename ? ` · ${s.uploadedFilename}` : ''}
                </div>
                {s.parseWarnings.length > 0 ? (
                  <div style={WARNINGS_STYLE}>
                    {s.parseWarnings.length} parser warning
                    {s.parseWarnings.length === 1 ? '' : 's'}:{' '}
                    {s.parseWarnings.map((w) => w.code).join(', ')}
                  </div>
                ) : null}
              </div>
              <span style={META_STYLE}>{s.unitPriceCount} priced</span>
              <span style={META_STYLE}>
                {s.deviationCount} deviation{s.deviationCount === 1 ? '' : 's'}
              </span>
              <span style={STATUS_BADGE[s.parseStatus]}>{s.parseStatus}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

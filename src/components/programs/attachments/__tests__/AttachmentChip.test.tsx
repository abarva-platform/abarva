/**
 * @jest-environment jsdom
 */

// AttachmentChip · OV2-4b render tests.
//
// Pending chip:
//   - Renders filename + formatted size.
//   - Remove (×) button calls onRemove.
//   - Error state surfaces the error message and (when supplied) a
//     retry button.
//
// Persisted chip:
//   - Hyperlinks to the signed-URL download endpoint.
//   - Shows the mime glyph + filename + size.

import { fireEvent, render, screen } from '@testing-library/react';
import {
  PendingAttachmentChip,
  PersistedAttachmentChip,
} from '../AttachmentChip';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

describe('PendingAttachmentChip', () => {
  it('shows filename + size', () => {
    render(
      <PendingAttachmentChip
        filename="baseline.pdf"
        sizeBytes={2048}
        status="pending"
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText('baseline.pdf')).toBeTruthy();
    expect(screen.getByText('2.0 KB')).toBeTruthy();
  });

  it('calls onRemove when × is clicked', () => {
    const onRemove = jest.fn();
    render(
      <PendingAttachmentChip
        filename="x.pdf"
        sizeBytes={100}
        status="pending"
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /remove attachment/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('surfaces error message and retry control', () => {
    const onRetry = jest.fn();
    render(
      <PendingAttachmentChip
        filename="x.pdf"
        sizeBytes={100}
        status="error"
        errorMessage="Sign in required."
        onRemove={() => {}}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Sign in required.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /retry upload/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('PersistedAttachmentChip', () => {
  const SAMPLE: AttachmentRecord = {
    id: 'att-1',
    tenantKey: 'apex-retail',
    programId: 'eng-1',
    phase: 1,
    stepId: null,
    deliverableId: null,
    originalName: 'kickoff.docx',
    storagePath: 'apex-retail/eng-1/att-1/kickoff.docx',
    uploaderUserId: 'user_1',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 4096,
    sha256: 'a'.repeat(64),
    scanStatus: 'pending',
    scanFindings: null,
    redactionState: 'none',
    createdAt: '2026-04-29T12:00:00Z',
    deletedAt: null,
  };

  it('links to the signed-URL download endpoint', () => {
    render(<PersistedAttachmentChip attachment={SAMPLE} />);
    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(
      '/api/programs/eng-1/attachments/att-1',
    );
  });

  it('shows the mime glyph + filename + formatted size', () => {
    render(<PersistedAttachmentChip attachment={SAMPLE} />);
    expect(screen.getByText('DOC')).toBeTruthy();
    expect(screen.getByText('kickoff.docx')).toBeTruthy();
    expect(screen.getByText('4.0 KB')).toBeTruthy();
  });
});

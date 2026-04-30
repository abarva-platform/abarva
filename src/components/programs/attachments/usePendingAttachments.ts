'use client';

// usePendingAttachments · OV2-4b
//
// Hook that manages the lifecycle of pending chat-window attachments.
// Owns:
//   - Selected files (from <input> or drag-drop)
//   - Per-file upload state (idle / uploading / error)
//   - Server-confirmed AttachmentRecords ready for the next message send
//
// Surfaces a small API the composer wires to:
//   - addFiles(File[])              · stage one or more files
//   - removeAttachment(localId)     · drop a pending entry
//   - retry(localId)                · re-attempt a failed upload
//   - uploadAll()                   · resolve once every staged file has
//                                     either succeeded (record present)
//                                     or remained errored. Returns the
//                                     successful records.
//   - clearUploaded()               · drop everything after a successful
//                                     send so the next message starts
//                                     clean.
//
// Does NOT call ATTACHMENT_MIME_ALLOWLIST — that lives on the uploader
// helper. addFiles passes everything through; uploadAttachment will
// short-circuit unsupported / oversize files via its pre-flight checks
// and the chip will render the friendly error.

import { useCallback, useState } from 'react';
import {
  uploadAttachment,
  type UploadAttachmentError,
} from '@/lib/programs/attachments/upload-client';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

export type PendingStatus = 'idle' | 'uploading' | 'error' | 'done';

export interface PendingAttachment {
  localId: string;
  file: File;
  status: PendingStatus;
  loadedBytes: number;
  /** Populated after a successful upload. */
  record?: AttachmentRecord;
  /** Populated when status = 'error'. */
  error?: UploadAttachmentError;
}

interface UsePendingAttachmentsOptions {
  programId?: string | null;
  phase?: number;
  stepId?: string;
  deliverableId?: string;
}

let nextLocalIdCounter = 0;
function nextLocalId(): string {
  nextLocalIdCounter += 1;
  return `att_${Date.now().toString(36)}_${nextLocalIdCounter.toString(36)}`;
}

export function usePendingAttachments(opts: UsePendingAttachmentsOptions) {
  const [items, setItems] = useState<PendingAttachment[]>([]);

  const addFiles = useCallback((files: FileList | File[] | null | undefined) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...list.map<PendingAttachment>((file) => ({
        localId: nextLocalId(),
        file,
        status: 'idle',
        loadedBytes: 0,
      })),
    ]);
  }, []);

  const removeAttachment = useCallback((localId: string) => {
    setItems((prev) => prev.filter((a) => a.localId !== localId));
  }, []);

  const updateItem = useCallback(
    (localId: string, patch: Partial<PendingAttachment>) => {
      setItems((prev) =>
        prev.map((a) => (a.localId === localId ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const uploadOne = useCallback(
    async (item: PendingAttachment): Promise<AttachmentRecord | null> => {
      const programId = opts.programId;
      if (!programId) {
        updateItem(item.localId, {
          status: 'error',
          error: {
            ok: false,
            code: 'unknown',
            message: 'No program id available — drag-drop only works on a Programs surface.',
          },
        });
        return null;
      }
      updateItem(item.localId, { status: 'uploading', loadedBytes: 0, error: undefined });
      const result = await uploadAttachment({
        programId,
        file: item.file,
        phase: opts.phase,
        stepId: opts.stepId,
        deliverableId: opts.deliverableId,
        onProgress: (loaded) => updateItem(item.localId, { loadedBytes: loaded }),
      });
      if (result.ok) {
        updateItem(item.localId, {
          status: 'done',
          record: result.attachment,
          loadedBytes: item.file.size,
        });
        return result.attachment;
      }
      updateItem(item.localId, { status: 'error', error: result });
      return null;
    },
    [opts.programId, opts.phase, opts.stepId, opts.deliverableId, updateItem],
  );

  const uploadAll = useCallback(async (): Promise<AttachmentRecord[]> => {
    // Capture a snapshot — setItems updates the React tree, but we want
    // to drive uploads off whatever was staged at call-time, regardless
    // of subsequent renders.
    const snapshot = items.filter((a) => a.status !== 'done');
    if (snapshot.length === 0) {
      return items.filter((a) => a.record).map((a) => a.record!) as AttachmentRecord[];
    }
    const results = await Promise.all(snapshot.map((it) => uploadOne(it)));
    const succeededHere = results.filter((r): r is AttachmentRecord => r !== null);
    const previouslyDone = items
      .filter((a) => a.status === 'done' && a.record)
      .map((a) => a.record!) as AttachmentRecord[];
    return [...previouslyDone, ...succeededHere];
  }, [items, uploadOne]);

  const retry = useCallback(
    async (localId: string) => {
      const target = items.find((a) => a.localId === localId);
      if (!target) return;
      await uploadOne(target);
    },
    [items, uploadOne],
  );

  const clearUploaded = useCallback(() => {
    // Drop everything — failed entries are discarded too because the
    // user already saw the error and either retried or removed.
    setItems([]);
  }, []);

  return {
    items,
    addFiles,
    removeAttachment,
    retry,
    uploadAll,
    clearUploaded,
    /** Convenience — true while any item is mid-upload. */
    isUploading: items.some((a) => a.status === 'uploading'),
    /** Total byte count across staged files (for progress tooltips). */
    totalBytes: items.reduce((sum, a) => sum + a.file.size, 0),
    /** Number of staged + completed entries. */
    count: items.length,
  };
}

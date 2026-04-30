/**
 * @jest-environment jsdom
 */

// upload-client.test.ts · OV2-4b
//
// Pre-flight + XHR mock tests for uploadAttachment. We mock the global
// XMLHttpRequest so the test never makes a real network call. The
// pre-flight cases (oversize, unsupported mime) MUST short-circuit
// without instantiating an XHR — we assert that no `xhr.open` was
// called for those branches.

import {
  uploadAttachment,
  type UploadAttachmentError,
  type UploadAttachmentResult,
} from '../upload-client';
import type { AttachmentRecord } from '../types';

interface MockXhrInstance {
  method?: string;
  url?: string;
  body?: unknown;
  open: jest.Mock;
  send: jest.Mock;
  upload: { onprogress: ((evt: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  status: number;
  responseText: string;
  responseType: string;
  withCredentials: boolean;
  /** Helper to simulate a server response and trigger onload. */
  fireLoad: (status: number, body: string) => void;
}

const xhrInstances: MockXhrInstance[] = [];

function makeMockXhr(): MockXhrInstance {
  const instance: MockXhrInstance = {
    open: jest.fn((method: string, url: string) => {
      instance.method = method;
      instance.url = url;
    }),
    send: jest.fn((body: unknown) => {
      instance.body = body;
    }),
    upload: { onprogress: null },
    onload: null,
    onerror: null,
    onabort: null,
    status: 0,
    responseText: '',
    responseType: '',
    withCredentials: false,
    fireLoad(status, body) {
      instance.status = status;
      instance.responseText = body;
      instance.onload?.();
    },
  };
  return instance;
}

beforeEach(() => {
  xhrInstances.length = 0;
  // jsdom ships an XMLHttpRequest, but we override it so we can
  // capture calls and trigger handlers programmatically.
  (globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = jest
    .fn()
    .mockImplementation(() => {
      const inst = makeMockXhr();
      xhrInstances.push(inst);
      return inst;
    });
});

const SAMPLE_RECORD: AttachmentRecord = {
  id: 'att-1',
  tenantKey: 'apex-retail',
  programId: 'eng-1',
  phase: 1,
  stepId: null,
  deliverableId: null,
  originalName: 'baseline.pdf',
  storagePath: 'apex-retail/eng-1/att-1/baseline.pdf',
  uploaderUserId: 'user_123',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  sha256: 'a'.repeat(64),
  scanStatus: 'pending',
  scanFindings: null,
  redactionState: 'none',
  createdAt: '2026-04-29T12:00:00Z',
  deletedAt: null,
};

function makeFile(name: string, size: number, type: string): File {
  // jsdom File supports a Blob-style arg + size override via the
  // returned size getter — we instantiate the real File and trust
  // jsdom's reported size.
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('uploadAttachment · pre-flight', () => {
  it('rejects oversize files without making a network call', async () => {
    const file = makeFile('huge.pdf', 200_000_000, 'application/pdf');
    const result = await uploadAttachment({ programId: 'eng-1', file });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('oversize');
    }
    expect(xhrInstances).toHaveLength(0);
  });

  it('rejects unsupported mime types without a network call', async () => {
    const file = makeFile('script.exe', 100, 'application/x-msdownload');
    const result = await uploadAttachment({ programId: 'eng-1', file });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unsupported_mime');
    }
    expect(xhrInstances).toHaveLength(0);
  });

  it('rejects empty mime types without a network call', async () => {
    const file = makeFile('mystery', 100, '');
    const result = await uploadAttachment({ programId: 'eng-1', file });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unsupported_mime');
    }
    expect(xhrInstances).toHaveLength(0);
  });

  it('rejects missing programId synchronously', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const result = await uploadAttachment({ programId: '', file });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unknown');
    }
    expect(xhrInstances).toHaveLength(0);
  });
});

describe('uploadAttachment · server responses', () => {
  it('returns { ok: true, attachment } on a 200 with a valid body', async () => {
    const file = makeFile('baseline.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    // Wait one microtask so the synchronous XHR setup completes.
    await Promise.resolve();
    expect(xhrInstances).toHaveLength(1);
    const xhr = xhrInstances[0];
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/programs/eng-1/attachments/upload');
    xhr.fireLoad(200, JSON.stringify({ attachment: SAMPLE_RECORD }));
    const result = (await promise) as UploadAttachmentResult;
    expect(result.ok).toBe(true);
    expect(result.attachment.id).toBe(SAMPLE_RECORD.id);
  });

  it('returns code: unauthorized on 401', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    await Promise.resolve();
    xhrInstances[0].fireLoad(401, JSON.stringify({ error: 'unauthenticated' }));
    const result = (await promise) as UploadAttachmentError;
    expect(result.ok).toBe(false);
    expect(result.code).toBe('unauthorized');
    expect(result.status).toBe(401);
  });

  it('returns code: oversize on 413', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    await Promise.resolve();
    xhrInstances[0].fireLoad(413, JSON.stringify({ error: 'oversize' }));
    const result = (await promise) as UploadAttachmentError;
    expect(result.ok).toBe(false);
    expect(result.code).toBe('oversize');
  });

  it('returns code: unsupported_mime on 415', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    await Promise.resolve();
    xhrInstances[0].fireLoad(415, JSON.stringify({ error: 'unsupported_mime' }));
    const result = (await promise) as UploadAttachmentError;
    expect(result.ok).toBe(false);
    expect(result.code).toBe('unsupported_mime');
  });

  it('returns code: forbidden on 403', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    await Promise.resolve();
    xhrInstances[0].fireLoad(403, JSON.stringify({ error: 'forbidden' }));
    const result = (await promise) as UploadAttachmentError;
    expect(result.ok).toBe(false);
    expect(result.code).toBe('forbidden');
  });

  it('returns code: network on xhr.onerror', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({ programId: 'eng-1', file });
    await Promise.resolve();
    xhrInstances[0].onerror?.();
    const result = (await promise) as UploadAttachmentError;
    expect(result.ok).toBe(false);
    expect(result.code).toBe('network');
  });

  it('forwards optional anchors (phase, stepId) into the form data', async () => {
    const file = makeFile('a.pdf', 100, 'application/pdf');
    const promise = uploadAttachment({
      programId: 'eng-1',
      file,
      phase: 3,
      stepId: 'p3-design-anchor',
    });
    await Promise.resolve();
    const xhr = xhrInstances[0];
    expect(xhr.body).toBeInstanceOf(FormData);
    const fd = xhr.body as FormData;
    expect(fd.get('phase')).toBe('3');
    expect(fd.get('stepId')).toBe('p3-design-anchor');
    expect(fd.get('file')).toBeInstanceOf(File);
    xhr.fireLoad(200, JSON.stringify({ attachment: SAMPLE_RECORD }));
    await promise;
  });

  it('reports progress via onProgress', async () => {
    const file = makeFile('a.pdf', 1024, 'application/pdf');
    const progressEvents: Array<[number, number]> = [];
    const promise = uploadAttachment({
      programId: 'eng-1',
      file,
      onProgress: (loaded, total) => progressEvents.push([loaded, total]),
    });
    await Promise.resolve();
    const xhr = xhrInstances[0];
    // Simulate browser-fired progress event.
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 512,
      total: 1024,
    } as unknown as ProgressEvent);
    expect(progressEvents).toEqual([[512, 1024]]);
    xhr.fireLoad(200, JSON.stringify({ attachment: SAMPLE_RECORD }));
    await promise;
  });
});

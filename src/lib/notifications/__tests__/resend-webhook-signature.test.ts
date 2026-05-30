/**
 * W4-PR-7 · Resend webhook signature verification tests
 *
 * Covers:
 *   • Missing header rejection.
 *   • Malformed secret rejection.
 *   • Timestamp-out-of-window rejection.
 *   • Forged signature rejection.
 *   • Happy path with a self-signed body.
 *   • Multi-key rotation (header carries two v1 entries; one matches).
 *   • Tolerates whsec_ prefix (Resend issues secrets with the prefix).
 */

import { createHmac } from 'crypto';
import {
  decodeWebhookSecret,
  verifyResendSignature,
} from '../resend-webhook-signature';

function makeSecret(): { whsec: string; bytes: Buffer } {
  // 32 bytes is the Standard Webhooks recommended size.
  const bytes = Buffer.from('a'.repeat(32), 'utf8');
  const whsec = `whsec_${bytes.toString('base64')}`;
  return { whsec, bytes };
}

function sign(args: { secretBytes: Buffer; id: string; timestamp: string; body: string }): string {
  const target = `${args.id}.${args.timestamp}.${args.body}`;
  return createHmac('sha256', args.secretBytes).update(target).digest('base64');
}

describe('decodeWebhookSecret', () => {
  it('decodes a whsec_-prefixed secret', () => {
    const { whsec, bytes } = makeSecret();
    expect(decodeWebhookSecret(whsec)).toEqual(bytes);
  });

  it('accepts a bare base64 secret without the prefix', () => {
    const { bytes } = makeSecret();
    const bare = bytes.toString('base64');
    expect(decodeWebhookSecret(bare)).toEqual(bytes);
  });

  it('returns null for empty input', () => {
    expect(decodeWebhookSecret('')).toBeNull();
    expect(decodeWebhookSecret('whsec_')).toBeNull();
  });
});

describe('verifyResendSignature', () => {
  const { whsec, bytes } = makeSecret();
  const nowSec = 1_700_000_000;
  const nowMs = nowSec * 1000;
  const body = '{"type":"email.delivered","data":{"email_id":"abc"}}';
  const id = 'msg_2abc';
  const ts = String(nowSec);

  it('rejects when any required header is missing', () => {
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: '',
        svixTimestamp: ts,
        svixSignature: 'v1,deadbeef',
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: false, reason: 'missing_header' });

    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: '',
        svixSignature: 'v1,deadbeef',
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: false, reason: 'missing_header' });

    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: ts,
        svixSignature: '',
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: false, reason: 'missing_header' });
  });

  it('rejects when the secret is invalid', () => {
    const sig = sign({ secretBytes: bytes, id, timestamp: ts, body });
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: ts,
        svixSignature: `v1,${sig}`,
        secret: 'whsec_',
        now: nowMs,
      }),
    ).toEqual({ ok: false, reason: 'invalid_secret' });
  });

  it('rejects when the timestamp is outside the ±5min window', () => {
    const sig = sign({ secretBytes: bytes, id, timestamp: ts, body });
    const tooOld = String(nowSec - 6 * 60);
    const tooNew = String(nowSec + 6 * 60);
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: tooOld,
        svixSignature: `v1,${sig}`,
        secret: whsec,
        now: nowMs,
      }).ok,
    ).toBe(false);
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: tooNew,
        svixSignature: `v1,${sig}`,
        secret: whsec,
        now: nowMs,
      }).ok,
    ).toBe(false);
  });

  it('rejects a forged signature', () => {
    const fakeSig = Buffer.from('forged-signature-bytes-of-32b!!!', 'utf8').toString('base64');
    const result = verifyResendSignature({
      rawBody: body,
      svixId: id,
      svixTimestamp: ts,
      svixSignature: `v1,${fakeSig}`,
      secret: whsec,
      now: nowMs,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('signature_mismatch');
  });

  it('accepts a valid signature', () => {
    const sig = sign({ secretBytes: bytes, id, timestamp: ts, body });
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: ts,
        svixSignature: `v1,${sig}`,
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: true });
  });

  it('accepts the active key when the header carries multiple v1 entries', () => {
    const sig = sign({ secretBytes: bytes, id, timestamp: ts, body });
    const fakeSig = Buffer.from('forged-signature-bytes-of-32b!!!', 'utf8').toString('base64');
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: ts,
        svixSignature: `v1,${fakeSig} v1,${sig}`,
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects a header with only non-v1 versions', () => {
    expect(
      verifyResendSignature({
        rawBody: body,
        svixId: id,
        svixTimestamp: ts,
        svixSignature: 'v2,abc v0,def',
        secret: whsec,
        now: nowMs,
      }),
    ).toEqual({ ok: false, reason: 'malformed_signature_header' });
  });
});

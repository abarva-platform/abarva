/**
 * W4-PR-2 · CAN-SPAM headers tests
 *
 * Verifies that every required header / footer element is present:
 *   • From sender (Phase 1 default = notifications@abarva.com)
 *   • List-Unsubscribe (RFC 2369) with HTTPS + mailto fallbacks
 *   • List-Unsubscribe-Post (RFC 8058) one-click marker
 *   • X-Entity-Ref-ID tracking header (event row id)
 *   • Physical address in footer (placeholder OR env-supplied)
 */

import {
  buildCanSpamHeaders,
  canSpamFooterHtml,
  canSpamFooterText,
  assembleEmailHeaders,
  PHASE1_SHARED_SENDER,
} from '../can-spam-headers';

describe('buildCanSpamHeaders', () => {
  const baseInput = {
    recipientUserId: 'user_abc123',
    eventType: 'approval.requested',
    eventId: 'evt-uuid-1',
  };

  it('defaults sender to PHASE1_SHARED_SENDER', () => {
    const out = buildCanSpamHeaders(baseInput);
    expect(out.from).toBe(PHASE1_SHARED_SENDER);
  });

  it('honours an explicit sender override', () => {
    const out = buildCanSpamHeaders({ ...baseInput, sender: 'a@b.com' });
    expect(out.from).toBe('a@b.com');
  });

  it('includes both https and mailto unsubscribe in List-Unsubscribe', () => {
    const out = buildCanSpamHeaders(baseInput);
    expect(out.listUnsubscribe).toContain('https://');
    expect(out.listUnsubscribe).toContain('mailto:unsubscribe@abarva.com');
    // RFC 2369: each URI wrapped in angle brackets, comma-separated.
    expect(out.listUnsubscribe).toMatch(/^<[^>]+>(\s*,\s*<[^>]+>)*$/);
  });

  it('encodes the event_type and user_id in the unsubscribe URL', () => {
    const out = buildCanSpamHeaders(baseInput);
    expect(out.listUnsubscribe).toContain(encodeURIComponent('approval.requested'));
    expect(out.listUnsubscribe).toContain('user_abc123');
  });

  it('sets the RFC 8058 one-click marker', () => {
    const out = buildCanSpamHeaders(baseInput);
    expect(out.listUnsubscribePost).toBe('List-Unsubscribe=One-Click');
  });

  it('threads the event_id into X-Entity-Ref-ID', () => {
    const out = buildCanSpamHeaders(baseInput);
    expect(out.xEntityRefId).toBe('evt-uuid-1');
  });
});

describe('CAN-SPAM footers', () => {
  it('canSpamFooterHtml includes a physical-address paragraph', () => {
    const html = canSpamFooterHtml();
    expect(html).toMatch(/placeholder|AbarVa/i);
    expect(html).toContain('Manage your notification preferences');
  });

  it('canSpamFooterText is plain text with the same content', () => {
    const text = canSpamFooterText();
    expect(text).toContain('--');
    expect(text).toContain('Manage your notification preferences');
  });

  it('uses ABARVA_PHYSICAL_ADDRESS env when set', () => {
    const prev = process.env.ABARVA_PHYSICAL_ADDRESS;
    process.env.ABARVA_PHYSICAL_ADDRESS = 'AbarVa, 1 Main St, Springfield';
    try {
      expect(canSpamFooterHtml()).toContain('1 Main St, Springfield');
      expect(canSpamFooterText()).toContain('1 Main St, Springfield');
    } finally {
      if (prev === undefined) delete process.env.ABARVA_PHYSICAL_ADDRESS;
      else process.env.ABARVA_PHYSICAL_ADDRESS = prev;
    }
  });
});

describe('assembleEmailHeaders', () => {
  it('always emits the three required SMTP headers', () => {
    const canSpam = buildCanSpamHeaders({
      recipientUserId: 'u1',
      eventType: 'invite.sent',
      eventId: 'evt-2',
    });
    const out = assembleEmailHeaders(canSpam);
    expect(out['List-Unsubscribe']).toBe(canSpam.listUnsubscribe);
    expect(out['List-Unsubscribe-Post']).toBe(canSpam.listUnsubscribePost);
    expect(out['X-Entity-Ref-ID']).toBe(canSpam.xEntityRefId);
  });

  it('accepts custom tracking headers but preserves CAN-SPAM headers', () => {
    const canSpam = buildCanSpamHeaders({
      recipientUserId: 'u1',
      eventType: 'invite.sent',
      eventId: 'evt-2',
    });
    const out = assembleEmailHeaders(canSpam, {
      'X-Tenant-Id': 'tenant-uuid',
      'List-Unsubscribe': 'fake', // should be overwritten
    });
    expect(out['X-Tenant-Id']).toBe('tenant-uuid');
    expect(out['List-Unsubscribe']).toBe(canSpam.listUnsubscribe);
  });
});

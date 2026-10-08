export {};

import { issueCredential, verifyPassword, rotateCredential } from '../credentials';
import { issueSession, hashToken, tokenMatchesHash, sessionIsLive, hashIp } from '../session';
import { backoffMs, recordFailure, isThrottled, shouldAlertInternally } from '../throttle';
import { resolveVendorAccess } from '../access';

const HOUR = 3_600_000;

describe('credentials', () => {
  it('verifies the issued password and rejects a near miss', async () => {
    const c = await issueCredential();
    await expect(verifyPassword(c.password, c.passwordHash, c.passwordSalt)).resolves.toBe(true);
    await expect(
      verifyPassword(c.password.slice(0, -1) + 'X', c.passwordHash, c.passwordSalt),
    ).resolves.toBe(false);
  });

  it('never issues the same credential twice', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i += 1) {
      const c = await issueCredential();
      expect(seen.has(c.password)).toBe(false);
      seen.add(c.password);
    }
  });

  it('excludes glyphs that get misread when a credential is read aloud or retyped', async () => {
    for (let i = 0; i < 25; i += 1) {
      const c = await issueCredential();
      expect(c.password).not.toMatch(/[O0Il1]/);
      expect(c.username).not.toMatch(/[o0il1]/);
    }
  });

  // A corrupt row must read as "wrong password", never as a crash — a thrown
  // error is an oracle that distinguishes one vendor's record from another's.
  it('returns false rather than throwing on a malformed stored hash', async () => {
    await expect(verifyPassword('anything', 'not-hex-at-all', 'salt')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'ab', 'salt')).resolves.toBe(false);
    await expect(verifyPassword('anything', '', '')).resolves.toBe(false);
  });

  it('rotation keeps the username and invalidates the old password', async () => {
    const first = await issueCredential();
    const second = await rotateCredential(first.username);
    expect(second.username).toBe(first.username);
    await expect(verifyPassword(first.password, second.passwordHash, second.passwordSalt)).resolves.toBe(false);
    await expect(verifyPassword(second.password, second.passwordHash, second.passwordSalt)).resolves.toBe(true);
  });
});

describe('sessions', () => {
  it('stores only a hash — the token cannot be recovered from what is persisted', () => {
    const s = issueSession({ respondBy: new Date(Date.now() + 100 * HOUR) });
    expect(s.tokenHash).not.toContain(s.token);
    expect(s.tokenHash).toBe(hashToken(s.token));
    expect(s.tokenHash).toHaveLength(64);
    expect(tokenMatchesHash(s.token, s.tokenHash)).toBe(true);
    expect(tokenMatchesHash('some-other-token', s.tokenHash)).toBe(false);
  });

  it('never outlives the response deadline by more than the grace window', () => {
    const respondBy = new Date(Date.now() + 1 * HOUR);
    const s = issueSession({ respondBy, maxHours: 12, graceHours: 2 });
    expect(s.expiresAt.getTime()).toBeLessThanOrEqual(respondBy.getTime() + 2 * HOUR);
  });

  it('allows concurrent sessions — the credential is shared by a bid team', () => {
    const respondBy = new Date(Date.now() + 100 * HOUR);
    const a = issueSession({ respondBy });
    const b = issueSession({ respondBy });
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('treats revoked and expired sessions as dead', () => {
    const future = new Date(Date.now() + HOUR);
    expect(sessionIsLive({ expiresAt: future })).toBe(true);
    expect(sessionIsLive({ expiresAt: future, revokedAt: new Date() })).toBe(false);
    expect(sessionIsLive({ expiresAt: new Date(Date.now() - HOUR) })).toBe(false);
  });

  it('records nothing rather than something reversible when no IP salt is set', () => {
    const prev = process.env.VENDOR_PORTAL_IP_SALT;
    delete process.env.VENDOR_PORTAL_IP_SALT;
    expect(hashIp('203.0.113.7')).toBeNull();
    process.env.VENDOR_PORTAL_IP_SALT = 'salted';
    expect(hashIp('203.0.113.7')).not.toBeNull();
    expect(hashIp('203.0.113.7')).not.toContain('203.0.113.7');
    if (prev === undefined) delete process.env.VENDOR_PORTAL_IP_SALT;
    else process.env.VENDOR_PORTAL_IP_SALT = prev;
  });
});

describe('throttle — must never be able to lock a bidder out', () => {
  it('delays but never closes access, however many failures', () => {
    let state = recordFailure(null);
    for (let i = 0; i < 500; i += 1) state = recordFailure(state);
    expect(state.failures).toBe(501);
    // The only guarantee that matters: a finite wait always reopens the door.
    expect(backoffMs(state.failures)).toBeLessThanOrEqual(30_000);
    expect(isThrottled(state, state.lastFailureAt + 30_001)).toBe(false);
  });

  it('forgives the first few attempts outright', () => {
    expect(backoffMs(1)).toBe(0);
    expect(backoffMs(3)).toBe(0);
    expect(backoffMs(4)).toBeGreaterThan(0);
  });

  it('alerts us internally instead of blocking them', () => {
    let state = recordFailure(null);
    for (let i = 0; i < 20; i += 1) state = recordFailure(state);
    expect(shouldAlertInternally(state)).toBe(true);
    expect(isThrottled(state, state.lastFailureAt + 60_000)).toBe(false);
  });

  it('resets after a quiet hour so a vendor returning next morning starts clean', () => {
    const t0 = Date.now();
    let state: ReturnType<typeof recordFailure> = { failures: 9, firstFailureAt: t0, lastFailureAt: t0 };
    state = recordFailure(state, t0 + 2 * HOUR);
    expect(state.failures).toBe(1);
  });
});

describe('access gates', () => {
  const base = {
    acceptBy: new Date(Date.now() + 10 * HOUR),
    respondBy: new Date(Date.now() + 100 * HOUR),
  };

  it('an invited vendor can read the overview but cannot take the package', () => {
    const d = resolveVendorAccess({ ...base, invitationState: 'invited' });
    expect(d.canViewRfp).toBe(true);
    expect(d.canDownloadPackage).toBe(false);
    expect(d.canUploadResponse).toBe(false);
    expect(d.denial).toBe('not_acknowledged');
  });

  it('acceptance unlocks download and upload', () => {
    const d = resolveVendorAccess({ ...base, invitationState: 'accepted' });
    expect(d.canDownloadPackage).toBe(true);
    expect(d.canUploadResponse).toBe(true);
    expect(d.denial).toBeNull();
  });

  it('a passed accept-by closes acknowledgement without touching read access', () => {
    const d = resolveVendorAccess({
      invitationState: 'invited',
      acceptBy: new Date(Date.now() - HOUR),
      respondBy: base.respondBy,
    });
    expect(d.canAcknowledge).toBe(false);
    expect(d.canViewRfp).toBe(true);
    expect(d.denial).toBe('invitation_expired');
  });

  it('a passed respond-by stops uploads for an accepted vendor', () => {
    const d = resolveVendorAccess({
      invitationState: 'accepted',
      acceptBy: new Date(Date.now() - 100 * HOUR),
      respondBy: new Date(Date.now() - HOUR),
    });
    expect(d.canDownloadPackage).toBe(true);
    expect(d.canUploadResponse).toBe(false);
    expect(d.denial).toBe('response_window_closed');
  });

  it.each(['declined', 'withdrawn'] as const)(
    'a %s vendor loses every capability at once, including read',
    (state) => {
      const d = resolveVendorAccess({ ...base, invitationState: state });
      expect(Object.values(d).filter((v) => v === true)).toHaveLength(0);
      expect(d.denial).toBe(state);
    },
  );
});

import {
  renderVendorInvitationHtml,
  renderVendorInvitationText,
} from '../invitation-email';

describe('invitation email', () => {
  const input = {
    vendorDisplayName: 'Northwind Systems',
    contactName: 'A. Contact',
    contactEmail: 'contact@example.invalid',
    eventName: 'Data Platform Build and Rollout',
    buyerDisplayName: 'Example Health',
    portalUrl: 'https://app.example.invalid/rfp/evt-1',
    username: 'abc23xyz',
    password: 'PASSWORD23456789',
    acceptBy: new Date('2026-10-01T01:00:00Z'),
    respondBy: new Date('2026-10-07T01:00:00Z'),
    procurementContactName: 'P. Lead',
    procurementContactEmail: 'lead@example.invalid',
  };

  it('carries both deadlines and states the download precondition', () => {
    const text = renderVendorInvitationText(input);
    expect(text).toContain('Confirm intent to respond by');
    expect(text).toContain('Submit your response by');
    expect(text).toContain('available to download once your confirmation is recorded');
  });

  it('tells the vendor the credential is shareable and unrecoverable', () => {
    const text = renderVendorInvitationText(input);
    expect(text).toMatch(/may be shared with colleagues/i);
    expect(text).toMatch(/cannot be retrieved later/i);
  });

  it('escapes vendor-supplied names rather than interpolating markup', () => {
    const html = renderVendorInvitationHtml({ ...input, vendorDisplayName: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

import { buildPortalView, type RfpSection, type VendorActivityEvent } from '../portal-view';

describe('portal view', () => {
  const sections: RfpSection[] = [
    { key: 'scope', ordinal: 2, title: 'Project Scope', summary: 'What is being bought.' },
    { key: 'intro', ordinal: 1, title: 'Introduction and Overview', summary: 'Who is buying.' },
    { key: 'terms', ordinal: 3, title: 'Commercial Terms', summary: 'Pricing format.', requiresAction: true },
  ];
  const activity: VendorActivityEvent[] = [
    { type: 'invited', occurredAt: new Date('2026-09-24T10:00:00Z') },
    { type: 'signed_in', occurredAt: new Date('2026-09-25T09:00:00Z') },
    { type: 'invitation_viewed', occurredAt: new Date('2026-09-24T18:00:00Z') },
  ];
  const base = {
    eventName: 'Data Platform Build and Rollout',
    buyerDisplayName: 'Example Health',
    vendorDisplayName: 'Northwind Systems',
    acceptBy: new Date('2026-10-01T01:00:00Z'),
    respondBy: new Date('2026-10-07T01:00:00Z'),
    sections,
    activity,
    submissionCount: 0,
    now: new Date('2026-09-25T10:00:00Z'),
  };

  it('orders sections by ordinal, not by the order handed in', () => {
    const v = buildPortalView({ ...base, invitationState: 'invited' });
    expect(v.sections.map((s) => s.key)).toEqual(['intro', 'scope', 'terms']);
  });

  it('shows activity newest first, in vendor-readable language', () => {
    const v = buildPortalView({ ...base, invitationState: 'invited' });
    expect(v.activity.map((a) => a.label)).toEqual([
      'Signed in',
      'Invitation opened',
      'Invitation issued',
    ]);
  });

  it('states exactly one next action — acknowledge, before anything else', () => {
    const v = buildPortalView({ ...base, invitationState: 'invited' });
    expect(v.primaryCallToAction).toMatch(/Confirm whether your organisation intends to respond/);
    expect(v.access.canDownloadPackage).toBe(false);
  });

  it('switches the instruction to download-and-upload once accepted', () => {
    const v = buildPortalView({ ...base, invitationState: 'accepted' });
    expect(v.primaryCallToAction).toMatch(/Download the RFP package/);
    expect(v.primaryCallToAction).toMatch(/upload your documents/);
    expect(v.blockedReason).toBeNull();
  });

  // The brief is explicit: sections are for browsing, the response is prepared
  // offline. If that expectation is not stated, a bid team will try to type
  // their response into the page and lose it.
  it('says plainly that the response is prepared offline, not in the page', () => {
    const v = buildPortalView({ ...base, invitationState: 'accepted' });
    expect(v.packageExpectation).toMatch(/prepared offline and uploaded here, not completed in this page/);
  });

  it('marks the acceptance deadline as next while unacknowledged, and the response deadline after', () => {
    const invited = buildPortalView({ ...base, invitationState: 'invited' });
    expect(invited.deadlines.find((d) => d.isNext)?.label).toBe('Confirm intent to respond');
    const accepted = buildPortalView({ ...base, invitationState: 'accepted' });
    expect(accepted.deadlines.find((d) => d.isNext)?.label).toBe('Submit your response');
  });

  it('reports a passed deadline as passed with negative hours, not as time remaining', () => {
    const v = buildPortalView({
      ...base,
      invitationState: 'accepted',
      now: new Date('2026-10-08T01:00:00Z'),
    });
    const respond = v.deadlines.find((d) => d.label === 'Submit your response')!;
    expect(respond.passed).toBe(true);
    expect(respond.hoursRemaining).toBeLessThan(0);
    expect(v.access.canUploadResponse).toBe(false);
    expect(v.blockedReason).toMatch(/response window closed/i);
  });

  it('gives a withdrawn vendor a reason rather than an empty page', () => {
    const v = buildPortalView({ ...base, invitationState: 'withdrawn' });
    expect(v.blockedReason).toMatch(/withdrawn/i);
    expect(v.primaryCallToAction).toMatch(/withdrawn/i);
    expect(v.access.canViewRfp).toBe(false);
  });
});

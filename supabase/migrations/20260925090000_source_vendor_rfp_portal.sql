-- Source — Vendor RFP portal.
--
-- Closes the loop that ended at document generation: issue an RFP to a competing
-- vendor, let them accept, download, and submit — without a person re-keying the
-- vendor's identity from a spreadsheet cell on the way back in.
--
-- DESIGN NOTE — one credential per VENDOR ORGANISATION, shared by several people
-- on that vendor's side. Consequences encoded here:
--   * Attribution is to the organisation. The acknowledgement captures a
--     SELF-DECLARED contact (see `ack_*` columns) which is a vendor assertion and
--     must never be presented as verified identity.
--   * There is no lockout column by design. A shared credential is one typo away
--     from excluding a bidder from a live procurement; throttling belongs in the
--     application as backoff, never as a persisted hard lock.
--
-- Vendors are NOT Clerk users. No column here references a Clerk user id except
-- `created_by_user_id`, which is ours.

BEGIN;

-- ── Competing vendors ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_event_vendors (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id         UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  -- Denormalised for RLS without a join per row check.
  tenant_key              TEXT NOT NULL,

  vendor_legal_name       TEXT NOT NULL,
  vendor_display_name     TEXT NOT NULL,
  primary_contact_name    TEXT NOT NULL,
  primary_contact_email   TEXT NOT NULL,

  -- Issued credential. Username is unique per event, not globally: the same
  -- vendor competing in two events gets two credentials, so revoking one
  -- cannot affect the other.
  username                TEXT NOT NULL,
  -- scrypt(password, salt) — see src/lib/source/vendor-portal/credentials.ts.
  -- The plaintext exists exactly once, in the outbound invitation email.
  password_hash           TEXT NOT NULL,
  password_salt           TEXT NOT NULL,
  password_issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_rotated_at     TIMESTAMPTZ,
  rotation_reason         TEXT,

  invitation_state        TEXT NOT NULL DEFAULT 'invited'
    CHECK (invitation_state IN ('invited','accepted','declined','expired','withdrawn')),

  -- Deadlines. Enforced server-side against these values, never by hiding UI.
  accept_by               TIMESTAMPTZ NOT NULL,
  respond_by              TIMESTAMPTZ NOT NULL,

  -- Acknowledgement — SELF-DECLARED by whoever held the shared credential.
  -- Never render these as verified identity.
  acknowledged_at         TIMESTAMPTZ,
  ack_declared_name       TEXT,
  ack_declared_title      TEXT,
  ack_declared_email      TEXT,
  ack_intends_to_respond  BOOLEAN,
  declined_at             TIMESTAMPTZ,
  decline_reason          TEXT,

  created_by_user_id      TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT source_event_vendors_username_per_event UNIQUE (source_event_id, username),
  CONSTRAINT source_event_vendors_respond_after_accept CHECK (respond_by >= accept_by)
);

CREATE INDEX IF NOT EXISTS idx_sev_event      ON source_event_vendors (source_event_id);
CREATE INDEX IF NOT EXISTS idx_sev_tenant     ON source_event_vendors (tenant_key);
CREATE INDEX IF NOT EXISTS idx_sev_username   ON source_event_vendors (username);

-- ── Sessions ─────────────────────────────────────────────────────────────────
-- Several concurrent sessions per credential is the expected case, not an anomaly:
-- the credential is shared across a vendor's bid team.
CREATE TABLE IF NOT EXISTS source_event_vendor_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES source_event_vendors(id) ON DELETE CASCADE,
  tenant_key          TEXT NOT NULL,
  -- SHA-256 of the opaque session token. The token itself lives only in the cookie.
  session_token_hash  TEXT NOT NULL UNIQUE,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL,
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at          TIMESTAMPTZ,
  -- Evidence, not identity. Hashed so the audit trail is not a store of client IPs.
  ip_hash             TEXT,
  user_agent          TEXT
);

CREATE INDEX IF NOT EXISTS idx_sevs_vendor  ON source_event_vendor_sessions (vendor_id);
CREATE INDEX IF NOT EXISTS idx_sevs_expiry  ON source_event_vendor_sessions (expires_at);

-- ── Audit spine ──────────────────────────────────────────────────────────────
-- Append-only. This is the evidence pack for a contested award: who was invited,
-- who accepted, what they took, when they submitted.
CREATE TABLE IF NOT EXISTS source_event_vendor_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    UUID NOT NULL REFERENCES source_event_vendors(id) ON DELETE CASCADE,
  tenant_key   TEXT NOT NULL,
  event_type   TEXT NOT NULL CHECK (event_type IN (
    'invited','invitation_resent','invitation_viewed',
    'signed_in','sign_in_failed','signed_out',
    'acknowledged','declined',
    'section_viewed','package_downloaded','document_downloaded',
    'question_submitted','addendum_viewed',
    'submission_uploaded','submission_superseded','submission_finalised',
    'credential_rotated','access_withdrawn'
  )),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash      TEXT
);

CREATE INDEX IF NOT EXISTS idx_seve_vendor ON source_event_vendor_events (vendor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_seve_type   ON source_event_vendor_events (event_type);

-- ── Submissions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_event_vendor_submissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               UUID NOT NULL REFERENCES source_event_vendors(id) ON DELETE CASCADE,
  source_event_id         UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  tenant_key              TEXT NOT NULL,
  -- Partitioned path: <tenant>/<event>/<vendor>/<submission>/<filename>.
  -- One vendor reaching another's submission is the failure this cannot absorb,
  -- so the partition is structural, not a convention.
  blob_path               TEXT NOT NULL UNIQUE,
  original_filename       TEXT NOT NULL,
  content_type            TEXT NOT NULL,
  byte_size               BIGINT NOT NULL,
  sha256                  TEXT NOT NULL,
  scan_status             TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending','clean','infected','failed')),
  uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalised_at            TIMESTAMPTZ,
  -- Re-uploads supersede; nothing is overwritten. A withdrawn version stays
  -- readable because a contested award may turn on what was sent when.
  supersedes_submission_id UUID REFERENCES source_event_vendor_submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_sevsub_vendor ON source_event_vendor_submissions (vendor_id);
CREATE INDEX IF NOT EXISTS idx_sevsub_event  ON source_event_vendor_submissions (source_event_id);

-- ── Link the legacy free-text pricing submissions to real vendor identity ────
-- Historical rows have no vendor record. A NULL that says so is better than a guess.
ALTER TABLE source_event_pricing_submissions
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES source_event_vendors(id);

COMMENT ON COLUMN source_event_pricing_submissions.vendor_id IS
  'FK to the competing vendor. NULL for rows predating the vendor portal, where vendor_name is free text read from a spreadsheet cell.';

COMMIT;

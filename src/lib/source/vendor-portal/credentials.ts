import 'server-only';

// Source vendor portal — credential issuance and verification.
//
// ONE credential per competing VENDOR ORGANISATION, shared by several people on
// that vendor's side. That is a deliberate procurement decision, and it shapes
// this module:
//
//   * The plaintext password exists exactly ONCE — as the return value of
//     `issueCredential`, which the caller puts straight into the invitation
//     email. It is never stored, never logged, and never re-derivable. Recovery
//     is reissue, not retrieval.
//   * There is no lockout here, and there must not be one. A shared credential
//     is one typo away from excluding a bidder from a live procurement; see
//     `throttle.ts` for the backoff that replaces it.
//
// Hashing uses scrypt from node:crypto — a real slow KDF with no native
// dependency to add.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

/** scrypt cost. 128 * N * r = 16 MiB, comfortably under node's 32 MiB default maxmem. */
const SCRYPT_N = 16_384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Password alphabet. Excludes 0/O and 1/I/l — this credential gets read aloud
 * on a call, retyped from a printout, and pasted into a chat by several people
 * at the vendor. Ambiguous glyphs turn into support tickets during a live bid.
 */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PASSWORD_LENGTH = 16; // ~80 bits
const USERNAME_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const USERNAME_LENGTH = 8;

export interface IssuedCredential {
  username: string;
  /** Plaintext. Send it, then drop it. Never persist or log this. */
  password: string;
  passwordHash: string;
  passwordSalt: string;
}

/** Uniform random string over `alphabet`, rejection-sampled so the draw is unbiased. */
function randomString(length: number, alphabet: string): string {
  const out: string[] = [];
  const max = Math.floor(256 / alphabet.length) * alphabet.length;
  while (out.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= max) continue; // modulo bias — discard
      out.push(alphabet[byte % alphabet.length]!);
      if (out.length === length) break;
    }
  }
  return out.join('');
}

async function derive(password: string, salt: string): Promise<Buffer> {
  return (await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
  })) as Buffer;
}

/**
 * Mint a credential for one vendor on one event.
 *
 * The returned `password` is the only copy that will ever exist. The caller must
 * hand it to the invitation email and let it fall out of scope.
 */
export async function issueCredential(): Promise<IssuedCredential> {
  const username = randomString(USERNAME_LENGTH, USERNAME_ALPHABET);
  const password = randomString(PASSWORD_LENGTH, PASSWORD_ALPHABET);
  const passwordSalt = randomBytes(SALT_BYTES).toString('hex');
  const passwordHash = (await derive(password, passwordSalt)).toString('hex');
  return { username, password, passwordHash, passwordSalt };
}

/**
 * Constant-time verification.
 *
 * Returns false rather than throwing on a malformed stored hash: a corrupt row
 * must read as "wrong password" to the caller, never as a crash that could be
 * used to distinguish one vendor's record from another's.
 */
export async function verifyPassword(
  candidate: string,
  storedHashHex: string,
  storedSalt: string,
): Promise<boolean> {
  if (!candidate || !storedHashHex || !storedSalt) return false;
  let stored: Buffer;
  try {
    stored = Buffer.from(storedHashHex, 'hex');
  } catch {
    return false;
  }
  if (stored.length !== KEY_LENGTH) return false;
  const derived = await derive(candidate, storedSalt);
  return timingSafeEqual(derived, stored);
}

/** Rotate in place. Same contract: the plaintext is returned once and never stored. */
export async function rotateCredential(
  existingUsername: string,
): Promise<IssuedCredential> {
  const password = randomString(PASSWORD_LENGTH, PASSWORD_ALPHABET);
  const passwordSalt = randomBytes(SALT_BYTES).toString('hex');
  const passwordHash = (await derive(password, passwordSalt)).toString('hex');
  return { username: existingUsername, password, passwordHash, passwordSalt };
}

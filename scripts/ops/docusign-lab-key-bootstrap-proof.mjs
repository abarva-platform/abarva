#!/usr/bin/env node
import { createPublicKey } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const KEY_ID_PATTERN = /^https:\/\/kv-abarva-lab-001\.vault\.azure\.net\/keys\/source-nda-docusign-lab-jwt\/[0-9a-f]{32}$/i;

export function parsePublicKeyProof(log) {
  const records = String(log).split('\n').flatMap((line) => {
    let payload = line;
    let escapedNewlines = false;
    try {
      const envelope = JSON.parse(line);
      if (typeof envelope?.Log === 'string') payload = envelope.Log;
    } catch {
      // Some ACA CLI versions leave the JSON in Log unescaped while double-escaping PEM newlines.
      const wrapped = /^\{"TimeStamp":"[^"]+","Log":"F (\{"keyId":.*\})"\}$/.exec(line);
      if (wrapped) {
        payload = wrapped[1];
        escapedNewlines = true;
      }
    }
    const start = payload.indexOf('{"keyId"');
    if (start < 0) return [];
    try {
      const record = JSON.parse(payload.slice(start));
      if (escapedNewlines && typeof record.publicKeyPem === 'string') {
        record.publicKeyPem = record.publicKeyPem.replaceAll('\\n', '\n');
      }
      return [record];
    } catch { return []; }
  });
  if (records.length !== 1) throw new Error('expected one public-key proof record');
  const record = records[0];
  if (!KEY_ID_PATTERN.test(record.keyId) ||
      record.exportable !== false ||
      typeof record.created !== 'boolean' ||
      typeof record.publicKeyPem !== 'string' ||
      !/^-----BEGIN PUBLIC KEY-----\n/.test(record.publicKeyPem) ||
      !record.publicKeyPem.endsWith('-----END PUBLIC KEY-----\n') ||
      Object.keys(record).sort().join(',') !== 'created,exportable,keyId,publicKeyPem') {
    throw new Error('invalid public-key proof record');
  }
  try {
    const publicKey = createPublicKey(record.publicKeyPem);
    if (publicKey.asymmetricKeyType !== 'rsa' ||
        publicKey.asymmetricKeyDetails?.modulusLength !== 2048) {
      throw new Error('invalid public-key proof record');
    }
  } catch {
    throw new Error('invalid public-key proof record');
  }
  return record;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const proof = parsePublicKeyProof(readFileSync(process.argv[2], 'utf8'));
    writeFileSync(process.argv[3], `${JSON.stringify(proof, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

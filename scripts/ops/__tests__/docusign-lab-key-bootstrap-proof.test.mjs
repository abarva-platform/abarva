import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { parsePublicKeyProof } from '../docusign-lab-key-bootstrap-proof.mjs';

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const valid = {
  keyId: 'https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/0123456789abcdef0123456789abcdef',
  exportable: false,
  created: true,
  publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
};

test('extracts only one validated public PEM record from job output', () => {
  assert.deepEqual(parsePublicKeyProof(`start\n${JSON.stringify(valid)}\nend\n`), valid);
});

test('rejects private material, wrong vault, duplicate records, and missing proof', () => {
  for (const log of [
    '',
    `${JSON.stringify(valid)}\n${JSON.stringify(valid)}`,
    JSON.stringify({ ...valid, privateKey: 'do-not-publish' }),
    JSON.stringify({ ...valid, exportable: true }),
    JSON.stringify({ ...valid, keyId: valid.keyId.replace('kv-abarva-lab-001', 'other-vault') }),
  ]) assert.throws(() => parsePublicKeyProof(log), /public-key proof record/);
});

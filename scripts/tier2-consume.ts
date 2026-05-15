#!/usr/bin/env -S npx tsx
// scripts/tier2-consume.ts
//
// A2b · local CLI runner for the Azure landing-zone consumer.
//
// Reads a message JSON file from stdin or `--message <path>`, runs it
// through `consumeOneMessage` with stub implementations of the
// download / audit / pipeline ports, and prints the outcome. Designed
// for two purposes:
//
//   1. Local smoke-test the consumer logic without standing up Azure
//      Service Bus + Storage + the broker.
//
//   2. Reproduce a production outcome by replaying a saved message
//      JSON (e.g., one captured from a dead-letter queue) — useful for
//      incident triage.
//
// Production deployment (Codex's lane): wraps `consumeOneMessage` in
// an Azure Function bound to the Service Bus queue trigger on
// `q-context-ingestion-events`.
//
// Usage:
//   echo '{"schema":"abarva.ingestion.v1",...}' | npx tsx scripts/tier2-consume.ts
//   npx tsx scripts/tier2-consume.ts --message ./test-messages/sample.json
//
// Backlog: A2b.

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { consumeOneMessage, type ConsumeContext } from '@/lib/ingestion/azure-landing-zone-consumer';

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function readMessage(): Promise<unknown> {
  const argIdx = process.argv.indexOf('--message');
  if (argIdx >= 0 && process.argv[argIdx + 1]) {
    const messagePath = path.resolve(process.argv[argIdx + 1]);
    const raw = await fs.readFile(messagePath, 'utf-8');
    return JSON.parse(raw);
  }
  // Fall back to stdin.
  const raw = await readStdin();
  if (!raw.trim()) {
    throw new Error('No message on stdin and no --message <path> arg. See --help.');
  }
  return JSON.parse(raw);
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`
A2b · Azure landing-zone consumer · local CLI

Usage:
  cat message.json | npx tsx scripts/tier2-consume.ts
  npx tsx scripts/tier2-consume.ts --message ./message.json

Stub implementations (this CLI):
  download   reads a fake 16-byte payload (or echoes msg.metadata.body if present)
  writeAudit prints an audit-row stub to stdout
  pipeline   prints what it WOULD do; no Pinecone / broker side effect

To run against real Service Bus + Storage + broker, write a small
wrapper that initializes the SDKs and calls consumeOneMessage from
this same library.
`);
}

async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  let raw: unknown;
  try {
    raw = await readMessage();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to read message:', err instanceof Error ? err.message : err);
    process.exit(2);
  }

  let auditCounter = 0;
  const ctx: ConsumeContext = {
    download: async (msg) => {
      // Look for a body the test message may have embedded.
      const meta = msg.metadata ?? {};
      const inline = typeof meta.testBody === 'string' ? meta.testBody : 'placeholder ingestion bytes';
      return {
        bytes: new TextEncoder().encode(inline),
        filename: path.basename(msg.storage.blobPath) || 'inbound',
      };
    },
    writeAudit: async ({ message, outcome }) => {
      auditCounter += 1;
      const id = `local-audit-${auditCounter}`;
      // eslint-disable-next-line no-console
      console.error(
        `  [audit] tenant=${message.tenantClientKey} segment=${message.segmentKey} ` +
          `outcome=${outcome.status} id=${id}`,
      );
      return id;
    },
    runPipeline: async ({ message, bytes }) => {
      // eslint-disable-next-line no-console
      console.error(
        `  [pipeline] tenant=${message.tenantClientKey} segment=${message.segmentKey} ` +
          `bytes=${bytes.byteLength}  (stub; no broker side effect)`,
      );
      return { chunksWritten: Math.max(1, Math.ceil(bytes.byteLength / 800)) };
    },
  };

  const outcome = await consumeOneMessage(raw, ctx);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(outcome, null, 2));
  process.exit(outcome.status === 'accepted' || outcome.status === 'quarantined' ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});

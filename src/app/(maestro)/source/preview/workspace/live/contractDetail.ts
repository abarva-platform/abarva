import type { Contract360View } from '@/lib/source/data-model/contract-360-view';

// JSON shape returned by /api/source/workspace/contract/[contractId] — same
// fields as Contract360View, just serialized (Date-like columns stay ISO
// strings, which is what the underlying rows already are).
export type Contract360Response = Contract360View;

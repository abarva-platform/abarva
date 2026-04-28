export * from "./feature-flag";
export * from "./relational-store";
export * from "./vector-store";
export * from "./graph-store";
export * from "./object-store";
export * from "./evidence-ledger";

import { EvidenceLedger } from "./evidence-ledger";
import { KnowledgeFabricWriteOptions } from "./feature-flag";
import { GraphKnowledgeStore } from "./graph-store";
import { ObjectKnowledgeStore } from "./object-store";
import { RelationalKnowledgeStore } from "./relational-store";
import { VectorKnowledgeStore } from "./vector-store";

export type KnowledgeFabricStores = {
  relational: RelationalKnowledgeStore;
  vector: VectorKnowledgeStore;
  graph: GraphKnowledgeStore;
  object: ObjectKnowledgeStore;
  ledger: EvidenceLedger;
};

export function createKnowledgeFabric(
  options: KnowledgeFabricWriteOptions = {},
): KnowledgeFabricStores {
  return {
    relational: new RelationalKnowledgeStore(options),
    vector: new VectorKnowledgeStore(options),
    graph: new GraphKnowledgeStore(options),
    object: new ObjectKnowledgeStore(options),
    ledger: new EvidenceLedger(options),
  };
}

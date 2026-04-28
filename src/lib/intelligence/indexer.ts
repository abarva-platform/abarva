import {
  KnowledgeFabricStores,
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabric,
  resolveKnowledgeFabricWriteMode,
} from "../architecture/knowledge-fabric";
import { corpus as loadedCorpus } from "./loader";
import type { ContradictionSeed } from "./seed-contradictions";
import type { SignalSeed } from "./seed-signals-manual";
import type { SolutionSeed } from "./seed-solutions";
import type { PatternSeed } from "./seed-types";
import type { LoadedCorpus } from "./types";

export type KnowledgePrimitive = {
  id: string;
  kind: "pattern" | "signal" | "solution" | "contradiction";
  title?: string;
  content: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
};

export type IndexCorpusOptions = KnowledgeFabricWriteOptions & {
  fabric?: KnowledgeFabricStores;
  corpus?: LoadedCorpus;
};

export type IndexCorpusResult = {
  corpusSize: number;
  dryRun: boolean;
  writesEnabled: boolean;
  attemptedWrites: number;
  writtenWrites: number;
  fabric: KnowledgeFabricStores;
  results: KnowledgeFabricWriteResult[];
};

export function indexPrimitive(
  primitive: KnowledgePrimitive,
  fabric: KnowledgeFabricStores,
  options: KnowledgeFabricWriteOptions = {},
): KnowledgeFabricWriteResult[] {
  const relational = fabric.relational.upsertEntity(
    {
      id: primitive.id,
      entityType: primitive.kind,
      fields: {
        title: primitive.title,
        content: primitive.content,
        metadata: primitive.metadata ?? {},
      },
      sourceId: primitive.sourceId,
    },
    options,
  );

  const vector = fabric.vector.upsertVector(
    {
      id: `${primitive.id}:semantic-vector`,
      text: primitive.content,
      embedding: primitive.embedding,
      metadata: {
        primitiveId: primitive.id,
        kind: primitive.kind,
        ...(primitive.metadata ?? {}),
      },
    },
    options,
  );

  const graph = fabric.graph.upsertNode(
    {
      id: primitive.id,
      label: primitive.kind,
      properties: {
        title: primitive.title,
        sourceId: primitive.sourceId,
      },
    },
    options,
  );

  const object = fabric.object.putObject(
    {
      id: `${primitive.id}:source-object`,
      contentType: "application/json",
      body: JSON.stringify(primitive),
      metadata: {
        primitiveId: primitive.id,
        kind: primitive.kind,
      },
    },
    options,
  );

  const ledger = fabric.ledger.append(
    {
      id: `${primitive.id}:indexed`,
      primitiveId: primitive.id,
      eventType: "indexed",
      storeRefs: [relational.id, vector.id, graph.id, object.id],
      evidence: {
        sourceId: primitive.sourceId,
        dryRun: relational.dryRun || vector.dryRun || graph.dryRun || object.dryRun,
      },
    },
    options,
  );

  return [relational, vector, graph, object, ledger];
}

export function patternToPrimitive(pattern: PatternSeed): KnowledgePrimitive {
  return {
    id: pattern.id,
    kind: "pattern",
    title: pattern.title,
    content: [pattern.thesis, pattern.applicability, pattern.body].filter(Boolean).join("\n\n"),
    sourceId: pattern.sourceDocuments[0] ?? "phase-1-pattern-seed",
    metadata: {
      slug: pattern.slug,
      domain: pattern.domain,
      tier: pattern.tier,
      status: pattern.status,
      confidence: pattern.confidence,
      instanceCount: pattern.instanceCount,
      sourceDocuments: pattern.sourceDocuments,
      relatedPatternIds: pattern.relatedPatternIds,
      derivedFromPatternIds: pattern.derivedFromPatternIds,
      taggedContradictionIds: pattern.taggedContradictionIds,
    },
  };
}

export function signalToPrimitive(signal: SignalSeed): KnowledgePrimitive {
  return {
    id: signal.id,
    kind: "signal",
    title: signal.title,
    content: signal.summary,
    sourceId: signal.sourceUrl,
    metadata: {
      sourceType: signal.sourceType,
      sourceName: signal.sourceName,
      observedAt: signal.observedAt,
      ingestedAt: signal.ingestedAt,
      confidence: signal.confidence,
      ttlDays: signal.ttlDays,
      affectedPatternIds: signal.affectedPatternIds,
      affectedProgramIds: signal.affectedProgramIds,
    },
  };
}

export function solutionToPrimitive(solution: SolutionSeed): KnowledgePrimitive {
  return {
    id: solution.id,
    kind: "solution",
    title: solution.title,
    content: [solution.summary, ...solution.applicabilityConditions].join("\n"),
    sourceId: "phase-1-solution-seed",
    metadata: {
      slug: solution.slug,
      confidence: solution.confidence,
      instanceCount: solution.instanceCount,
      patternIds: solution.patternIds,
      signalIds: solution.signalIds,
      compositionManifest: solution.compositionManifest,
      createdAt: solution.createdAt,
      createdBy: solution.createdBy,
      lastRevisedAt: solution.lastRevisedAt,
    },
  };
}

export function contradictionToPrimitive(contradiction: ContradictionSeed): KnowledgePrimitive {
  return {
    id: contradiction.id,
    kind: "contradiction",
    title: contradiction.title,
    content: [
      contradiction.partyA.claim,
      contradiction.partyB.claim,
      contradiction.whyBothCannotBeTrue,
      contradiction.body,
    ].join("\n\n"),
    sourceId: contradiction.sourceDocuments[0] ?? "phase-1-contradiction-seed",
    metadata: {
      status: contradiction.status,
      partyA: contradiction.partyA,
      partyB: contradiction.partyB,
      affectedPatternIds: contradiction.affectedPatternIds,
      resolutionTimeline: contradiction.resolutionTimeline,
      sourceDocuments: contradiction.sourceDocuments,
    },
  };
}

export function corpusToPrimitives(corpus: LoadedCorpus = loadedCorpus): KnowledgePrimitive[] {
  return [
    ...corpus.patterns.map(patternToPrimitive),
    ...corpus.signals.map(signalToPrimitive),
    ...corpus.solutions.map(solutionToPrimitive),
    ...corpus.contradictions.map(contradictionToPrimitive),
  ];
}

export function indexPrimitives(
  primitives: KnowledgePrimitive[],
  options: IndexCorpusOptions = {},
): IndexCorpusResult {
  const mode = resolveKnowledgeFabricWriteMode(options);
  const fabric = options.fabric ?? createKnowledgeFabric(options);
  const results = primitives.flatMap((primitive) => indexPrimitive(primitive, fabric, options));

  return {
    corpusSize: primitives.length,
    dryRun: mode.dryRun,
    writesEnabled: mode.writesEnabled,
    attemptedWrites: results.length,
    writtenWrites: results.filter((result) => result.written).length,
    fabric,
    results,
  };
}

export function indexCorpus(options: IndexCorpusOptions = {}): IndexCorpusResult {
  return indexPrimitives(corpusToPrimitives(options.corpus), options);
}

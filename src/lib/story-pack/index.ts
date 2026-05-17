// Wave 5, Slice 5.5 — Investor / CXO story pack generator.
//
// Public surface for the story pack: the typed input contract, the
// output pack shapes, and the pure `buildStoryPack` composer plus its
// per-section builders. The pack is a deterministic composition over a
// single typed description of one tenant decision's journey through the
// North-Star loop — it performs no I/O of its own and depends on no
// other module in the codebase.

export {
  buildStoryPack,
  buildStoryChapters,
  buildStoryValueSummary,
  buildStoryThesis,
} from './story-pack-generator';
export type {
  LoopStageKey,
  LoopAgent,
  LoopStageInput,
  LoopValueInput,
  LoopDecisionInput,
  StoryChapter,
  StoryValueSummary,
  StoryPack,
} from './story-pack-generator';

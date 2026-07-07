// Shared deck surface — re-exports the expert-kernel deck shell (16:9 slide grammar: cover,
// section slides with one hero exhibit + quiet footer, menu rail, deck chrome) so the deliverable
// deck renderer composes through ONE stable contract instead of importing expert-kernel internals.
// Same "single visual identity" rule as ./index; kept a separate entry point because the deck shell
// is the page/slide layer, distinct from the exhibit engine.
export * from "@/lib/programs/expert-kernel/exports/board-grade/deck-shell";

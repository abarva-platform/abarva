// Rasterisation entry point — kept separate from the SVG-string engine so the @resvg/resvg-js
// native binary is only pulled in by consumers that actually rasterise (e.g. the PPTX renderer),
// not by the Visual Director that composes SVG strings.
export * from "@/lib/programs/expert-kernel/exports/board-grade/svg-raster";

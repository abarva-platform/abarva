import type { ArchitectureView, ArchitectureViewNode } from "@/lib/visual-system/architecture-view-contract";

/**
 * Turns a validated capability-landscape view into the row/tile geometry the approved Architecture
 * Explorer design calls for: footprint proportional to recorded system count, so concentration
 * answers itself before a number is read.
 *
 * Two rules the design is explicit about, and both are honesty rules rather than layout ones:
 *
 *  1. A tile below a legible width is not drawn small -- it moves to the tail, where its share is
 *     carried by a bar and it is still listed by name with its own count. Shrinking a tile until
 *     its label is unreadable loses the record without admitting it.
 *  2. Grouping and counts are identical whichever treatment is shown. The weighting changes how
 *     fast the concentration reads, never what the model says.
 */

/** Below this share of the estate a tile cannot hold its label at a readable size. */
const MIN_TILE_SHARE_PCT = 4;
/** Rows break when they have accumulated roughly this share, giving 2-4 tiles per row. */
const ROW_TARGET_SHARE_PCT = 34;
/** Total vertical space the drawn rows divide between them. Rows take a slice of this in
 * proportion to their share, which is what makes tile AREA track share across the whole figure and
 * not merely within a row. */
const CANVAS_HEIGHT_PX = 470;
/** No row shorter than this, or its tiles cannot hold a label. A row that hits the floor is the
 * one place area stops being exact -- and it can only ever overstate a small row, never understate
 * a large one. */
const MIN_ROW_HEIGHT_PX = 104;

export interface Tile {
  id: string;
  label: string;
  systems: number;
  sharePct: number;
  note?: string;
  /** Share of its row's width. */
  flex: number;
  overlayMark?: string;
}

export interface TileRow {
  items: Tile[];
  /** Row height in px, scaled to the row's share of the estate. */
  height: number;
}

export interface TileTail {
  items: Tile[];
  count: number;
  systems: number;
  sharePct: number;
}

export interface TileLayout {
  rows: TileRow[];
  tail: TileTail | null;
  totalSystems: number;
}

function systemsOf(node: ArchitectureViewNode): number {
  const metric = node.metrics?.systems;
  if (typeof metric === "number") return metric;
  return node.aggregation?.memberCount ?? 0;
}

/**
 * Per-tile marks come from the node's OWN metrics, never from a view-level overlay.
 *
 * The projection's overlays carry an estate-wide total in their label ("57 systems flagged to
 * replace") and list in `nodeIds` merely which capabilities contain any. Stamping that label onto
 * each tile therefore asserts something false about every tile it touches -- a capability holding
 * 46 systems cannot have 57 flagged. The overlay belongs once, at view level; the per-tile number
 * has to be the node's own.
 */
function markFor(node: ArchitectureViewNode): string | undefined {
  const replace = node.metrics?.replacementCandidates;
  const aging = node.metrics?.agingSystems;
  const parts: string[] = [];
  if (typeof replace === "number" && replace > 0) parts.push(`${replace} to replace`);
  if (typeof aging === "number" && aging > 0) parts.push(`${aging} aging`);
  return parts.length ? parts.join(" · ") : undefined;
}

export function buildTileLayout(view: ArchitectureView): TileLayout {
  const nodes = view.nodes.filter((n) => systemsOf(n) > 0);
  const totalSystems = nodes.reduce((sum, n) => sum + systemsOf(n), 0);
  if (totalSystems === 0) return { rows: [], tail: null, totalSystems: 0 };

  const all: Tile[] = nodes
    .map((n) => {
      const systems = systemsOf(n);
      return {
        id: n.id,
        label: n.label,
        systems,
        sharePct: (systems / totalSystems) * 100,
        note: n.note,
        flex: systems,
        overlayMark: markFor(n),
      };
    })
    .sort((a, b) => b.systems - a.systems);

  const drawable = all.filter((t) => t.sharePct >= MIN_TILE_SHARE_PCT);
  const tailItems = all.filter((t) => t.sharePct < MIN_TILE_SHARE_PCT);

  // Pack into rows first, then size them: a row's height cannot be known until its members are.
  const packed: Tile[][] = [];
  const packedShares: number[] = [];
  let current: Tile[] = [];
  let currentShare = 0;
  for (const tile of drawable) {
    current.push(tile);
    currentShare += tile.sharePct;
    if (currentShare >= ROW_TARGET_SHARE_PCT) {
      packed.push(current);
      packedShares.push(currentShare);
      current = [];
      currentShare = 0;
    }
  }
  if (current.length > 0) {
    packed.push(current);
    packedShares.push(currentShare);
  }

  // Height in proportion to the row's share of everything drawn. Without this, widths are only
  // comparable inside a row: a 15% function sitting alone on a short row rendered wider -- and so
  // read as larger -- than an 18% function sharing a tall one. A weighted landscape whose weights
  // invert the ranking is worse than an unweighted grid, because it answers confidently and wrong.
  const drawableShare = packedShares.reduce((a, b) => a + b, 0);
  const rows: TileRow[] = packed.map((items, i) => ({
    items,
    height: Math.max(
      MIN_ROW_HEIGHT_PX,
      Math.round(drawableShare > 0 ? (packedShares[i] / drawableShare) * CANVAS_HEIGHT_PX : MIN_ROW_HEIGHT_PX),
    ),
  }));

  const tail: TileTail | null =
    tailItems.length > 0
      ? {
          items: tailItems,
          count: tailItems.length,
          systems: tailItems.reduce((s, t) => s + t.systems, 0),
          sharePct: tailItems.reduce((s, t) => s + t.sharePct, 0),
        }
      : null;

  return { rows, tail, totalSystems };
}

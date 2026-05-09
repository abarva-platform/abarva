// AppTopBarBlack — back-compat re-export.
//
// As of 2026-05-08 the canonical AppTopBar IS the black bar (Option B
// v2). This file used to host that variant; now it forwards to the
// unified AppTopBar so any historical imports keep resolving.
//
// New code should import { AppTopBar } from "./AppTopBar" directly.

export { AppTopBar as AppTopBarBlack } from "./AppTopBar";
export type { AppTopBarProps } from "./AppTopBar";

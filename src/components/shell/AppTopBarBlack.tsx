// AppTopBarBlack — historical back-compat re-export.
//
// Authenticated product chrome now lives in NexusTopNav. This file forwards
// through the AppTopBar compatibility shim so old imports keep resolving.
// New code should import NexusTopNav directly.

export { AppTopBar as AppTopBarBlack } from "./AppTopBar";
export type { AppTopBarProps } from "./AppTopBar";

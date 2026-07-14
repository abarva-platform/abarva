// Back-compat shim for historical imports. New authenticated shell code should
// import the canonical NEXUS navigation from "@/components/navigation/NexusTopNav".

export { NexusTopNav as AppTopBar } from "@/components/navigation/NexusTopNav";
export type { NexusTopNavProps as AppTopBarProps } from "@/components/navigation/NexusTopNav";

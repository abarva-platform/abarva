import SourceWorkspacePage, {
  metadata as workspaceMetadata,
} from "./workspace/page";

export const metadata = {
  ...workspaceMetadata,
  title: "Source · AbarVa",
};

export const dynamic = "force-dynamic";

/**
 * /source — canonical Source command center.
 *
 * The governed Source workspace remains available at /source/workspace as a
 * compatibility alias for historical links, but product navigation should land
 * here.
 */
export default SourceWorkspacePage;

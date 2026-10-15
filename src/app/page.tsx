import { LoggedOutLandingPage } from "@/components/marketing/LoggedOutLandingPage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Nexus | The AI Success Platform",
  description:
    "Make the case before you spend. Challenge the commitment before you renew. Prove the result before you scale. Enterprise context, Anthropic Claude reasoning and governed workflows.",
};

export default function HomePage() {
  return <LoggedOutLandingPage />;
}

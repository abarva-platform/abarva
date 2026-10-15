import { LoggedOutLandingPage } from "@/components/marketing/LoggedOutLandingPage";

export const dynamic = "force-dynamic";
const title = "Nexus | The AI Success Platform";
const description =
  "Make the case before you spend. Challenge the commitment before you renew. Prove the result before you scale. Enterprise context, Anthropic Claude reasoning and governed workflows.";
export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://app.abarva.ai",
  },
};

export default function HomePage() {
  return <LoggedOutLandingPage />;
}

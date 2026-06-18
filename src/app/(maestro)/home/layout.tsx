// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → signed-in executive hub.
//   /home/learn/*  → AppTopBar + LearnSideNav (in learn/layout.tsx)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

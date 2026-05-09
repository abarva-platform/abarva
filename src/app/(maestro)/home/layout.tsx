// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → AppTopBarBlack + tenant content (in page.tsx)
//   /home/learn/*  → AppTopBar + LearnSideNav (in learn/layout.tsx)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

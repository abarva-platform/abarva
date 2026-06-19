// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → Enterprise Landscape report. Top-nav "Home"
//                    must stay separate from /admin setup/admin.
//   /home/learn/*  → AppTopBar + LearnSideNav (in learn/layout.tsx)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

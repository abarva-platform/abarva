// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → Enterprise Landscape report. Top-nav "Home"
//                    must stay separate from /admin setup/admin.
//   /home/learn/*  → MaestroChrome NexusTopNav + LearnSideNav
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

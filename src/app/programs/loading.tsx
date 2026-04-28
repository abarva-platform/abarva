import { SHELL } from '@/lib/shell/shell-tokens'

export default function ProgramsLoading() {
  return (
    <div style={{ flex: 1, minHeight: '100vh', background: SHELL.PAPER, padding: '32px 40px' }}>
      <div style={{ background: SHELL.GRAY_BG, borderRadius: 6, height: 20, marginBottom: 12, opacity: 0.6, maxWidth: 320 }} />
      <div style={{ background: SHELL.GRAY_BG, borderRadius: 6, height: 20, marginBottom: 12, opacity: 0.6, maxWidth: 480 }} />
      <div style={{ background: SHELL.GRAY_BG, borderRadius: 6, height: 20, marginBottom: 12, opacity: 0.6, maxWidth: 240 }} />
    </div>
  )
}

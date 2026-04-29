import { ReasoningAskToolbar } from '@/components/reasoning/ReasoningAskToolbar';

export default function ReasoningAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', paddingBottom: 88 }}>
      {children}
      <ReasoningAskToolbar />
    </div>
  );
}

import { SiteHeader } from '@/components/shared/SiteHeader';
import { MyAgentsPage } from '@/components/agent/MyAgentsPage';

export default function AgentsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />
      <MyAgentsPage />
    </div>
  );
}

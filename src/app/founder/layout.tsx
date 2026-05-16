import Sidebar from '@/components/Sidebar';

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}

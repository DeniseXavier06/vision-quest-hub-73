import { useState } from 'react';
import SidebarCPA from '@/components/SidebarCPA';
import DashboardOverview from '@/components/DashboardOverview';
import AcoesSection from '@/components/AcoesSection';
import CronogramaSection from '@/components/CronogramaSection';
import ResultadosSection from '@/components/ResultadosSection';
import ReunioesSection from '@/components/ReunioesSection';
import RelatoriosSection from '@/components/RelatoriosSection';

const sections: Record<string, React.ComponentType> = {
  dashboard: DashboardOverview,
  acoes: AcoesSection,
  cronograma: CronogramaSection,
  resultados: ResultadosSection,
  reunioes: ReunioesSection,
  relatorios: RelatoriosSection,
};

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const ActiveComponent = sections[activeSection] || DashboardOverview;

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarCPA activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default Index;

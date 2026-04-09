import { useState } from 'react';
import { setoresData as initialSetores, type Setor } from '@/lib/mockData';
import SidebarCPA from '@/components/SidebarCPA';
import DashboardOverview from '@/components/DashboardOverview';
import AcoesSection from '@/components/AcoesSection';
import CronogramaSection from '@/components/CronogramaSection';
import ResultadosSection from '@/components/ResultadosSection';
import ReunioesSection from '@/components/ReunioesSection';
import RelatoriosSection from '@/components/RelatoriosSection';
import UsuariosSection from '@/components/UsuariosSection';
import SetoresSection from '@/components/SetoresSection';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [setores, setSetores] = useState<Setor[]>(initialSetores);

  const renderSection = () => {
    switch (activeSection) {
      case 'setores': return <SetoresSection setores={setores} setSetores={setSetores} />;
      case 'usuarios': return <UsuariosSection setores={setores} />;
      case 'acoes': return <AcoesSection />;
      case 'cronograma': return <CronogramaSection />;
      case 'resultados': return <ResultadosSection />;
      case 'reunioes': return <ReunioesSection />;
      case 'relatorios': return <RelatoriosSection />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarCPA activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;

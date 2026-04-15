import { useState, useEffect, useCallback } from 'react';
import { type Setor } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import SidebarCPA from '@/components/SidebarCPA';
import DashboardOverview from '@/components/DashboardOverview';
import AcoesSection from '@/components/AcoesSection';
import CronogramaSection from '@/components/CronogramaSection';
import ResultadosSection from '@/components/ResultadosSection';
import ReunioesSection from '@/components/ReunioesSection';
import RelatoriosSection from '@/components/RelatoriosSection';
import UsuariosSection from '@/components/UsuariosSection';
import SetoresSection from '@/components/SetoresSection';
import ConfiguracaoAmbienteSection from '@/components/ConfiguracaoAmbienteSection';
import ImportacoesSection from '@/components/ImportacoesSection';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [setores, setSetores] = useState<Setor[]>([]);

  const fetchSetores = useCallback(async () => {
    const { data } = await supabase.from('setores').select('*').order('nome');
    if (data) setSetores(data.map((s) => ({ id: s.id, nome: s.nome, sigla: s.sigla, tipo: s.tipo, descricao: s.descricao || '', ativo: s.ativo })));
  }, []);

  useEffect(() => { fetchSetores(); }, [fetchSetores]);

  const renderSection = () => {
    switch (activeSection) {
      case 'setores': return <SetoresSection setores={setores} setSetores={setSetores} />;
      case 'usuarios': return <UsuariosSection setores={setores} />;
      case 'acoes': return <AcoesSection />;
      case 'cronograma': return <CronogramaSection />;
      case 'resultados': return <ResultadosSection />;
      case 'reunioes': return <ReunioesSection />;
      case 'relatorios': return <RelatoriosSection />;
      case 'configuracao': return <ConfiguracaoAmbienteSection />;
      case 'importacoes': return <ImportacoesSection />;
      default: return <DashboardOverview onSectionChange={setActiveSection} />;
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

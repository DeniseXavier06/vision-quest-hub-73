import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  BarChart3,
  PieChart,
  Users,
  FileText,
  GraduationCap,
  UserCog,
  Building2,
  Settings2,
  FileUp,
  ClipboardList,
  ShieldCheck,
  LogOut,
  Presentation,
  Sigma,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SidebarCPAProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const STORAGE_KEY = 'cpa-sidebar-recolhida';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'setores', label: 'Setores', icon: Building2 },
  { id: 'usuarios', label: 'Coordenadores', icon: UserCog },
  { id: 'acoes', label: 'Ações', icon: ListChecks },
  { id: 'cronograma', label: 'Cronograma', icon: Calendar },
  { id: 'resultados', label: 'Resultados', icon: BarChart3 },
  { id: 'analise', label: 'Análise', icon: PieChart },
  { id: 'medidas', label: 'Medidas & Drill', icon: Sigma },
  { id: 'storytelling', label: 'Storytelling', icon: Presentation },
  { id: 'reunioes', label: 'Reuniões', icon: Users },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'importacoes', label: 'Importações', icon: FileUp },
  { id: 'avaliadores', label: 'Avaliadores', icon: ClipboardList },
  { id: 'configuracao', label: 'Configuração', icon: Settings2 },
];

const lerRecolhida = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const SidebarCPA = ({ activeSection, onSectionChange }: SidebarCPAProps) => {
  const [collapsed, setCollapsed] = useState(lerRecolhida);
  const { isAdmin, user, signOut } = useAuth();
  const items = isAdmin ? [...menuItems, { id: 'acessos', label: 'Acessos', icon: ShieldCheck }] : menuItems;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignora indisponibilidade do armazenamento local */
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-300 sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 py-5 border-b border-sidebar-border',
          collapsed ? 'px-0 justify-center' : 'px-4'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-heading font-semibold text-sidebar-primary-foreground truncate">
              Portal CPA
            </h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              Comissão Própria de Avaliação
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative w-full flex items-center gap-3 py-2.5 rounded-md text-sm transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-sidebar-primary" />
              )}
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        {!collapsed && user && (
          <p className="px-3 text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
        )}
        <button
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          aria-label="Sair"
          className={cn(
            'w-full flex items-center gap-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
            collapsed ? 'justify-center px-0' : 'px-3'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'w-full flex items-center gap-3 py-2 rounded-md text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors',
            collapsed ? 'justify-center px-0' : 'px-3'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default SidebarCPA;

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { statusLabels } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, MapPin, Clock, Search, Plus, Pencil, Trash2, Eye, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Reuniao {
  id: string;
  titulo: string;
  data_hora: string;
  tipo: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  local: string;
}

const statusOptions = [
  { value: 'agendada', label: 'Agendada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const statusCalendarColors: Record<string, string> = {
  agendada: 'bg-blue-500',
  realizada: 'bg-green-500',
  cancelada: 'bg-red-400',
};

const emptyReuniao: Omit<Reuniao, 'id'> = {
  titulo: '',
  data_hora: '',
  tipo: '',
  status: 'agendada',
  local: '',
};

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ReunioesSection = () => {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reuniao | null>(null);
  const [viewing, setViewing] = useState<Reuniao | null>(null);
  const [deleting, setDeleting] = useState<Reuniao | null>(null);
  const [form, setForm] = useState<Omit<Reuniao, 'id'>>(emptyReuniao);

  const fetchReunioes = async () => {
    const { data, error } = await supabase.from('reunioes').select('*').order('data_hora', { ascending: false });
    if (error) { toast.error('Erro ao carregar reuniões'); return; }
    setReunioes(data || []);
  };

  useEffect(() => { fetchReunioes(); }, []);

  const filtered = reunioes.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.titulo.toLowerCase().includes(term) || r.local.toLowerCase().includes(term) || r.tipo.toLowerCase().includes(term);
  });

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
    // Previous month padding
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      days.push({ day: d, isCurrentMonth: false, date: new Date(year, month - 1, d) });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) });
    }
    return days;
  }, [calendarMonth]);

  const reunioesByDate = useMemo(() => {
    const map: Record<string, Reuniao[]> = {};
    filtered.forEach((r) => {
      const key = new Date(r.data_hora).toLocaleDateString('pt-BR');
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [filtered]);

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  const goToday = () => setCalendarMonth(new Date());

  const openNew = () => { setEditing(null); setForm(emptyReuniao); setDialogOpen(true); };
  const openEdit = (r: Reuniao) => {
    setEditing(r);
    setForm({ titulo: r.titulo, data_hora: r.data_hora ? new Date(r.data_hora).toISOString().slice(0, 16) : '', tipo: r.tipo, status: r.status, local: r.local });
    setDialogOpen(true);
  };
  const openView = (r: Reuniao) => { setViewing(r); setViewDialogOpen(true); };
  const openDelete = (r: Reuniao) => { setDeleting(r); setDeleteDialogOpen(true); };

  const toLocalISO = (dtLocal: string) => {
    const d = new Date(dtLocal);
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${dtLocal}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  };

  const handleSave = async () => {
    if (!form.titulo || !form.data_hora || !form.tipo || !form.local) { toast.error('Preencha todos os campos obrigatórios'); return; }
    const dataHoraISO = toLocalISO(form.data_hora);
    if (editing) {
      const { error } = await supabase.from('reunioes').update({ titulo: form.titulo, data_hora: dataHoraISO, tipo: form.tipo, status: form.status, local: form.local }).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Reunião atualizada');
    } else {
      const { error } = await supabase.from('reunioes').insert({ titulo: form.titulo, data_hora: dataHoraISO, tipo: form.tipo, status: form.status, local: form.local });
      if (error) { toast.error('Erro ao inserir'); return; }
      toast.success('Reunião criada');
    }
    setDialogOpen(false);
    fetchReunioes();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('reunioes').delete().eq('id', deleting.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Reunião excluída');
    setDeleteDialogOpen(false);
    setDeleting(null);
    fetchReunioes();
  };

  const today = new Date();
  const todayKey = today.toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Reuniões</h2>
        <p className="text-sm text-muted-foreground mt-1">Agenda de reuniões da CPA</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar reuniões..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex border rounded-md overflow-hidden">
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setViewMode('list')}>
            <List className="w-4 h-4 mr-1" /> Lista
          </Button>
          <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setViewMode('calendar')}>
            <CalendarDays className="w-4 h-4 mr-1" /> Calendário
          </Button>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Reunião</Button>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião encontrada.</p>
          )}
          {filtered.map((reuniao) => {
            const date = new Date(reuniao.data_hora);
            return (
              <Card key={reuniao.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-lg font-heading font-bold text-primary leading-none">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-primary/70 uppercase font-medium">
                      {date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-heading font-semibold text-foreground">{reuniao.titulo}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reuniao.local}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{reuniao.tipo}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{statusLabels[reuniao.status] || reuniao.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openView(reuniao)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(reuniao)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(reuniao)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-semibold">
                  {MONTHS_PT[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </h3>
                <Button variant="outline" size="sm" onClick={goToday} className="text-xs">Hoje</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {DAYS_PT.map((d) => (
                <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
              ))}
              {calendarDays.map((cell, idx) => {
                const cellKey = cell.date.toLocaleDateString('pt-BR');
                const dayReunioes = reunioesByDate[cellKey] || [];
                const isToday = cellKey === todayKey;
                return (
                  <div
                    key={idx}
                    className={`bg-background min-h-[90px] p-1.5 ${!cell.isCurrentMonth ? 'opacity-40' : ''} ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>{cell.day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayReunioes.slice(0, 3).map((r) => {
                        const time = new Date(r.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <button
                            key={r.id}
                            onClick={() => openView(r)}
                            className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white ${statusCalendarColors[r.status] || 'bg-primary'}`}
                            title={`${time} - ${r.titulo}`}
                          >
                            {time} {r.titulo}
                          </button>
                        );
                      })}
                      {dayReunioes.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayReunioes.length - 3} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Agendada</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Realizada</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Cancelada</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Inserir/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Data e Hora *</Label><Input type="datetime-local" value={form.data_hora} onChange={(e) => setForm({ ...form, data_hora: e.target.value })} /></div>
            <div><Label>Local *</Label><Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} /></div>
            <div><Label>Tipo *</Label><Input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Ex: Ordinária, Extraordinária" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Reuniao['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Reunião</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold">Título:</span> {viewing.titulo}</div>
              <div><span className="font-semibold">Data/Hora:</span> {new Date(viewing.data_hora).toLocaleString('pt-BR')}</div>
              <div><span className="font-semibold">Local:</span> {viewing.local}</div>
              <div><span className="font-semibold">Tipo:</span> {viewing.tipo}</div>
              <div><span className="font-semibold">Status:</span> {statusLabels[viewing.status] || viewing.status}</div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => { setViewDialogOpen(false); if (viewing) openEdit(viewing); }}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
            <Button variant="destructive" size="sm" onClick={() => { setViewDialogOpen(false); if (viewing) openDelete(viewing); }}><Trash2 className="w-3 h-3 mr-1" />Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir a reunião <strong>{deleting?.titulo}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReunioesSection;

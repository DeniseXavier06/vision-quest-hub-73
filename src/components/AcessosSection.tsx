import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, ADMIN_EMAIL } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Acesso {
  id: string;
  nome: string;
  email: string;
  aprovado: boolean;
  admin: boolean;
}

const AcessosSection = () => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    if (error) { toast.error('Erro ao carregar acessos.'); setLoading(false); return; }
    setRows((profiles || []).map((p) => ({
      id: p.id,
      nome: p.nome || '(sem nome)',
      email: p.email,
      aprovado: p.aprovado,
      admin: !!roles?.some((r) => r.user_id === p.id && r.role === 'admin'),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleAprovado = async (row: Acesso, value: boolean) => {
    const { error } = await supabase.from('profiles').update({ aprovado: value }).eq('id', row.id);
    if (error) { toast.error('Erro ao atualizar acesso.'); return; }
    toast.success(value ? 'Acesso liberado!' : 'Acesso revogado.');
    fetch();
  };

  const toggleAdmin = async (row: Acesso, value: boolean) => {
    if (row.email.toLowerCase() === ADMIN_EMAIL) { toast.error('O admin principal não pode ser alterado.'); return; }
    const { error } = value
      ? await supabase.from('user_roles').insert({ user_id: row.id, role: 'admin' })
      : await supabase.from('user_roles').delete().eq('user_id', row.id).eq('role', 'admin');
    if (error) { toast.error('Erro ao atualizar permissão.'); return; }
    toast.success('Permissão atualizada!');
    fetch();
  };

  const remover = async (row: Acesso) => {
    if (row.email.toLowerCase() === ADMIN_EMAIL) { toast.error('O admin principal não pode ser removido.'); return; }
    const { error } = await supabase.from('profiles').delete().eq('id', row.id);
    if (error) { toast.error('Erro ao remover.'); return; }
    toast.success('Registro removido.');
    fetch();
  };

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Somente o administrador da CPA pode gerenciar acessos.</p>;
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Acessos</h2>
        <p className="text-sm text-muted-foreground mt-1">Libere ou revogue o acesso dos usuários ao painel</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {rows.length} {rows.length === 1 ? 'usuário' : 'usuários'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Acesso liberado</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                  <TableCell>
                    <Badge variant={row.aprovado ? 'default' : 'outline'} className={row.aprovado ? 'bg-success/10 text-success' : ''}>
                      {row.aprovado ? 'Liberado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell><Switch checked={row.aprovado} onCheckedChange={(v) => toggleAprovado(row, v)} /></TableCell>
                  <TableCell><Switch checked={row.admin} onCheckedChange={(v) => toggleAdmin(row, v)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remover(row)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcessosSection;

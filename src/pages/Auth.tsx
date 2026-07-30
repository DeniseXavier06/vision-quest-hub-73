import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setLoading(false);
    if (error) { toast.error('E-mail ou senha inválidos.'); return; }
    navigate('/painel');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`, data: { nome } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Cadastro enviado! Confirme seu e-mail e aguarde a liberação de acesso pelo admin.');
  };

  const handleReset = async () => {
    if (!email.trim()) { toast.error('Informe o e-mail para redefinir a senha.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Enviamos um link de redefinição para seu e-mail.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading">Portal CPA</CardTitle>
          <CardDescription>Acesso restrito à Comissão Própria de Avaliação</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Solicitar acesso</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu.email@uniriosead.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Entrar
                </Button>
                <button type="button" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
                  Esqueci minha senha
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>E-mail institucional</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Solicitar acesso
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  O acesso é liberado pelo administrador da CPA.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Voltar à página inicial</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

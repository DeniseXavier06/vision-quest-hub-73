import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, aprovado, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!aprovado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-heading font-bold">Acesso pendente de liberação</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta foi criada, mas ainda precisa ser liberada pelo administrador da CPA.
          </p>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

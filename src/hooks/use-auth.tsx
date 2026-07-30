import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const ADMIN_EMAIL = 'denise.santos@uniriosead.com';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  aprovado: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aprovado, setAprovado] = useState(false);

  const loadPermissions = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      setAprovado(false);
      return;
    }
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', uid),
      supabase.from('profiles').select('aprovado').eq('id', uid).maybeSingle(),
    ]);
    const admin = !!roles?.some((r) => r.role === 'admin');
    setIsAdmin(admin);
    setAprovado(admin || !!profile?.aprovado);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setTimeout(() => {
        loadPermissions(newSession?.user?.id).finally(() => setLoading(false));
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadPermissions(data.session?.user?.id).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAprovado(false);
  };

  const refresh = async () => loadPermissions(user?.id);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, aprovado, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

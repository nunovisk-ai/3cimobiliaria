import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: 'corretor' | 'gerente') => void;
  logout: () => Promise<void>;
  isManager: boolean;
}

const DEMO_USERS: Record<string, UserProfile> = {
  corretor: {
    id: 'usr_corretor_01',
    name: 'Lucas Ferreira',
    email: 'lucas.corretor@grupo3c.com.br',
    role: 'corretor',
    phone: '(11) 98765-4321',
    creci: '241.980-F',
    whatsappConnected: true,
  },
  gerente: {
    id: 'usr_gerente_01',
    name: 'Mariana Castro',
    email: 'mariana.gestao@grupo3c.com.br',
    role: 'gerente',
    phone: '(11) 99123-4567',
    creci: '185.340-F',
    whatsappConnected: true,
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem('grupo3c_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }

    if (isSupabaseConfigured) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário 3C',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as any) || 'corretor',
            whatsappConnected: false,
          };
          setUser(profile);
          localStorage.setItem('grupo3c_auth_user', JSON.stringify(profile));
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário 3C',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as any) || 'corretor',
            whatsappConnected: false,
          };
          setUser(profile);
          localStorage.setItem('grupo3c_auth_user', JSON.stringify(profile));
        } else {
          setUser(null);
          localStorage.removeItem('grupo3c_auth_user');
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email || email,
            role: (data.user.user_metadata?.role as any) || 'corretor',
            whatsappConnected: false,
          };
          setUser(profile);
          localStorage.setItem('grupo3c_auth_user', JSON.stringify(profile));
        }
      } else {
        // Fallback for development / testing without live Supabase env keys yet
        const role: 'corretor' | 'gerente' = email.includes('gerente') || email.includes('gestao') ? 'gerente' : 'corretor';
        const demoUser: UserProfile = {
          id: 'usr_' + Date.now(),
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email,
          role: role,
          creci: '241.980-F',
          whatsappConnected: true,
        };
        setUser(demoUser);
        localStorage.setItem('grupo3c_auth_user', JSON.stringify(demoUser));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Erro inesperado ao realizar login' };
    }
  };

  const loginAsDemo = (role: 'corretor' | 'gerente') => {
    const selected = DEMO_USERS[role];
    setUser(selected);
    localStorage.setItem('grupo3c_auth_user', JSON.stringify(selected));
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('grupo3c_auth_user');
  };

  const isManager = user?.role === 'gerente' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsDemo, logout, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

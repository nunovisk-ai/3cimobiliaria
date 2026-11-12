import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { usersService } from '../services/usersService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isFirstAccess: boolean;
  completeFirstAccess: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isPasswordRecoveryMode: boolean;
  saveRecoveredPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  cancelPasswordRecovery: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState<boolean>(false);

  // Helper to sync user profile from public.profiles
  const fetchAndSetUserProfile = async (authUserId: string, email: string): Promise<UserProfile> => {
    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${authUserId},email.ilike.${email}`)
        .maybeSingle();

      const profile: UserProfile = {
        id: profileRow?.id || authUserId,
        name: profileRow?.nome || email.split('@')[0],
        email: profileRow?.email || email,
        role: (profileRow?.role || profileRow?.cargo || 'corretor') as UserRole,
        cargo: profileRow?.cargo || profileRow?.role || 'corretor',
        phone: profileRow?.telefone || '',
        creci: profileRow?.creci || '',
        avatarUrl: profileRow?.avatar_url,
        whatsappConnected: !!profileRow?.whatsapp_conectado,
        status: (profileRow?.status || 'ativo') as 'ativo' | 'inativo',
        primeiroAcesso: profileRow?.primeiro_acesso ?? false,
        ultimoAcesso: profileRow?.ultimo_acesso || null,
        createdAt: profileRow?.created_at,
      };

      setUser(profile);
      localStorage.setItem('grupo3c_auth_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Error fetching profile from DB, falling back to minimal profile:', err);
      const fallback: UserProfile = {
        id: authUserId,
        name: email.split('@')[0],
        email: email,
        role: 'corretor',
        status: 'ativo',
        primeiroAcesso: false,
      };
      setUser(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    // 1. Detect if URL hash or search params indicate an incoming password recovery link
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const isRecoveryHash = hash.includes('type=recovery') || (hash.includes('access_token=') && hash.includes('type=recovery'));

    if (isRecoveryHash) {
      setIsPasswordRecoveryMode(true);
      // Do not restore cached user session from localStorage during recovery
      localStorage.removeItem('grupo3c_auth_user');
      setUser(null);
    } else {
      // Check saved session in localStorage
      const savedUser = localStorage.getItem('grupo3c_auth_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse saved user', e);
        }
      }
    }

    if (isSupabaseConfigured) {
      // Check active Supabase session
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
        if (isRecoveryHash || currentHash.includes('type=recovery')) {
          setIsPasswordRecoveryMode(true);
          setIsLoading(false);
          return;
        }

        if (session?.user?.email) {
          await fetchAndSetUserProfile(session.user.id, session.user.email);
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecoveryMode(true);
          setIsLoading(false);
          return;
        }

        const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
        if (currentHash.includes('type=recovery')) {
          setIsPasswordRecoveryMode(true);
          setIsLoading(false);
          return;
        }

        if (session?.user?.email) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            await fetchAndSetUserProfile(session.user.id, session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
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
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isSupabaseConfigured && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          let friendlyMsg = 'E-mail ou senha incorretos.';
          if (error.message.includes('Invalid login credentials')) {
            friendlyMsg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
          } else if (error.message.includes('Email not confirmed')) {
            friendlyMsg = 'E-mail não confirmado. Verifique sua caixa de entrada ou confirme o e-mail no Supabase.';
          } else if (error.message) {
            friendlyMsg = error.message;
          }
          return { success: false, error: friendlyMsg };
        }

        if (data.user) {
          const profile = await fetchAndSetUserProfile(data.user.id, data.user.email || cleanEmail);

          // Check if deactivated
          if (profile.status === 'inativo') {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('grupo3c_auth_user');
            return {
              success: false,
              error: 'Acesso desativado. Entre em contato com a administração do Grupo 3C.',
            };
          }

          // Record login audit timestamp
          await usersService.recordLogin(profile.id);
        }
      } else {
        return { success: false, error: 'Supabase não está configurado ou senha ausente.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao realizar login' };
    }
  };

  const completeFirstAccess = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      await usersService.changePassword(user.id, newPassword);
      // Also update password on Supabase Auth session
      await supabase.auth.updateUser({ password: newPassword });

      // Update local state
      const updatedUser: UserProfile = { ...user, primeiroAcesso: false };
      setUser(updatedUser);
      localStorage.setItem('grupo3c_auth_user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao salvar nova senha' };
    }
  };

  const refreshProfile = async () => {
    if (user?.id && user?.email) {
      await fetchAndSetUserProfile(user.id, user.email);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut warning:', e);
      }
    }
    setUser(null);
    localStorage.removeItem('grupo3c_auth_user');
  };

  const saveRecoveredPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Update password on active recovery session in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // 2. Also update password and clear primeiro_acesso in public.profiles
      if (data.user?.id) {
        await usersService.changePassword(data.user.id, newPassword).catch(() => {});
        await fetchAndSetUserProfile(data.user.id, data.user.email || '');
      }

      // 3. Clear URL hash
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setIsPasswordRecoveryMode(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao salvar nova senha no Supabase' };
    }
  };

  const cancelPasswordRecovery = async (): Promise<void> => {
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setIsPasswordRecoveryMode(false);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('grupo3c_auth_user');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'gerente' || user?.role === 'admin';
  const isFirstAccess = !!user?.primeiroAcesso;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        isFirstAccess, 
        completeFirstAccess, 
        refreshProfile,
        isAdmin, 
        isManager,
        isPasswordRecoveryMode,
        saveRecoveredPassword,
        cancelPasswordRecovery
      }}
    >
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

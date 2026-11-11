import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export const usersService = {
  // 1. List all users/profiles
  async getUsers(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.nome || 'Sem Nome',
      email: row.email,
      role: (row.role || row.cargo || 'corretor') as UserRole,
      cargo: row.cargo || row.role,
      phone: row.telefone,
      creci: row.creci,
      avatarUrl: row.avatar_url,
      whatsappConnected: !!row.whatsapp_conectado,
      status: (row.status || 'ativo') as 'ativo' | 'inativo',
      primeiroAcesso: row.primeiro_acesso ?? false,
      ultimoAcesso: row.ultimo_acesso,
      createdAt: row.created_at,
    }));
  },

  // 2. Create new user via admin RPC
  async createUser(params: {
    nome: string;
    email: string;
    password?: string;
    role?: UserRole;
    telefone?: string;
    creci?: string;
    primeiroAcesso?: boolean;
  }): Promise<UserProfile> {
    const password = params.password || '3cImob@2026';
    const role = params.role || 'corretor';
    const primeiroAcesso = params.primeiroAcesso ?? true;

    const { data, error } = await supabase.rpc('admin_create_crm_user', {
      p_nome: params.nome,
      p_email: params.email.trim().toLowerCase(),
      p_password: password,
      p_role: role,
      p_telefone: params.telefone || null,
      p_creci: params.creci || null,
      p_primeiro_acesso: primeiroAcesso,
    });

    if (error) {
      console.error('Error creating user via RPC:', error);
      throw new Error(error.message || 'Erro ao criar usuário');
    }

    return {
      id: data.id,
      name: data.nome,
      email: data.email,
      role: data.role as UserRole,
      status: data.status,
      primeiroAcesso: data.primeiro_acesso,
    };
  },

  // 3. Update user profile / permissions
  async updateUserProfile(params: {
    userId: string;
    nome: string;
    telefone?: string;
    creci?: string;
    role: UserRole;
    status: 'ativo' | 'inativo';
  }): Promise<boolean> {
    const { data, error } = await supabase.rpc('admin_update_user_profile', {
      p_user_id: params.userId,
      p_nome: params.nome,
      p_telefone: params.telefone || null,
      p_creci: params.creci || null,
      p_role: params.role,
      p_status: params.status,
    });

    if (error) {
      console.error('Error updating user profile via RPC:', error);
      throw new Error(error.message || 'Erro ao atualizar usuário');
    }

    return !!data;
  },

  // 4. Admin forces password reset for a user
  async adminSetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('admin_set_user_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (error) {
      console.error('Error setting user password via RPC:', error);
      throw new Error(error.message || 'Erro ao redefinir senha');
    }

    return !!data;
  },

  // 5. User changes their own password (e.g. first access or self reset)
  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('crm_user_change_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (error) {
      console.error('Error changing user password via RPC:', error);
      throw new Error(error.message || 'Erro ao alterar senha');
    }

    return !!data;
  },

  // 6. Generate 6-digit OTP verification code
  async generateVerificationCode(email: string, tipo: 'recuperacao' | 'primeiro_acesso' = 'recuperacao'): Promise<string> {
    const { data, error } = await supabase.rpc('generate_verification_code', {
      p_email: email.trim().toLowerCase(),
      p_tipo: tipo,
    });

    if (error) {
      console.error('Error generating verification code:', error);
      throw new Error(error.message || 'Erro ao gerar código de verificação');
    }

    return data as string;
  },

  // 7. Verify 6-digit OTP code
  async verifyVerificationCode(
    email: string, 
    codigo: string, 
    tipo: 'recuperacao' | 'primeiro_acesso' = 'recuperacao'
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_verification_code', {
      p_email: email.trim().toLowerCase(),
      p_codigo: codigo.trim(),
      p_tipo: tipo,
    });

    if (error) {
      console.error('Error verifying code:', error);
      return false;
    }

    return !!data;
  },

  // 8. Record login timestamp for audit
  async recordLogin(userId: string): Promise<void> {
    try {
      await supabase.rpc('record_user_login', { p_user_id: userId });
    } catch (e) {
      console.warn('Failed to record login timestamp:', e);
    }
  }
};

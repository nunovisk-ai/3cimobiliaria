import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Phone, 
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { usersService } from '../../services/usersService';

export const UserManagerView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);

  // Form states for New User
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefone, setNewTelefone] = useState('');
  const [newCreci, setNewCreci] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('corretor');
  const [newPassword, setNewPassword] = useState('3cImob@2026');
  const [newPrimeiroAcesso, setNewPrimeiroAcesso] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Edit User
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editCreci, setEditCreci] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('corretor');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Form state for Reset Password
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Format timestamp for Last Access audit
  const formatLastAccess = (timestamp?: string | null) => {
    if (!timestamp) {
      return { label: 'Nunca acessou', isRecent: false };
    }
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 5) return { label: 'Agora mesmo', isRecent: true };
      if (diffMins < 60) return { label: `Há ${diffMins} min`, isRecent: true };
      if (diffHours < 24) return { label: `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, isRecent: true };

      return {
        label: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        isRecent: false
      };
    } catch {
      return { label: 'Data inválida', isRecent: false };
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.creci && u.creci.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await usersService.createUser({
        nome: newNome.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        telefone: newTelefone.trim() || undefined,
        creci: newCreci.trim() || undefined,
        primeiroAcesso: newPrimeiroAcesso,
      });

      setSuccessMsg(`Usuário ${newNome} cadastrado com sucesso!`);
      setIsNewUserModalOpen(false);
      // Reset form
      setNewNome('');
      setNewEmail('');
      setNewTelefone('');
      setNewCreci('');
      setNewRole('corretor');
      setNewPassword('3cImob@2026');
      setNewPrimeiroAcesso(true);

      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setEditNome(u.name);
    setEditTelefone(u.phone || '');
    setEditCreci(u.creci || '');
    setEditRole(u.role);
    setEditStatus(u.status || 'ativo');
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await usersService.updateUserProfile({
        userId: editingUser.id,
        nome: editNome.trim(),
        telefone: editTelefone.trim() || undefined,
        creci: editCreci.trim() || undefined,
        role: editRole,
        status: editStatus,
      });

      setSuccessMsg(`Permissões de ${editNome} atualizadas!`);
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (u: UserProfile) => {
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      await usersService.updateUserProfile({
        userId: u.id,
        nome: u.name,
        telefone: u.phone,
        creci: u.creci,
        role: u.role,
        status: newStatus,
      });
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível alterar o status.');
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !resetPasswordValue) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await usersService.adminSetUserPassword(passwordResetUser.id, resetPasswordValue);
      setSuccessMsg(`Nova senha salva para ${passwordResetUser.name}!`);
      setPasswordResetUser(null);
      setResetPasswordValue('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ativo').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const corretorCount = users.filter(u => u.role === 'corretor').length;

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Gestão de Usuários & Equipe
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de acessos, permissões da equipe e auditoria de último login no CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Total de Usuários</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados no CRM</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Usuários Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{activeUsers}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Com acesso liberado</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Administradores</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{adminCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Acesso total</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Corretores / Vendas</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{corretorCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipe comercial</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CRECI..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">Todos os Cargos</option>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="corretor">Corretor / Vendedor</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Cargo / Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Último Acesso (Auditoria)</span>
                  </div>
                </th>
                <th className="py-3 px-4">1º Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const lastAccess = formatLastAccess(u.ultimoAcesso);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {u.email}
                            </p>
                            {u.phone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {u.phone} {u.creci ? `• CRECI: ${u.creci}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3" />
                            Admin Geral
                          </span>
                        ) : u.role === 'gerente' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Gerente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Corretor / Vendedor
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title="Clique para alternar status"
                          className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${u.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className={`text-[11px] font-medium ${u.status === 'ativo' ? 'text-emerald-700' : 'text-slate-400 line-through'}`}>
                            {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </button>
                      </td>

                      {/* Last Access Audit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-medium ${lastAccess.isRecent ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            {lastAccess.label}
                          </span>
                        </div>
                      </td>

                      {/* First Access */}
                      <td className="py-3 px-4">
                        {u.primeiroAcesso ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluído
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Editar Dados e Permissões"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setPasswordResetUser(u);
                              setResetPasswordValue('');
                            }}
                            title="Redefinir Senha do Usuário"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-brand-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Cadastrar Novo Usuário</h3>
                  <p className="text-xs text-slate-500">Defina os dados de acesso e cargo da equipe</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="carlos.corretor@exemplo.com.br"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número do CRECI
                  </label>
                  <input
                    type="text"
                    value={newCreci}
                    onChange={(e) => setNewCreci(e.target.value)}
                    placeholder="Ex: 245.890-F"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil / Permissão *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="corretor">Corretor / Vendedor</option>
                    <option value="gerente">Gerente de Vendas</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha Padrão Inicial *
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={newPrimeiroAcesso}
                    onChange={(e) => setNewPrimeiroAcesso(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 border-slate-300"
                  />
                  <span>Exigir troca obrigatória de senha no primeiro acesso</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO & PERMISSÕES */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-brand-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Editar Permissões</h3>
                  <p className="text-xs text-slate-500">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CRECI
                  </label>
                  <input
                    type="text"
                    value={editCreci}
                    onChange={(e) => setEditCreci(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="corretor">Corretor</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status de Acesso
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ativo' | 'inativo')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA DO USUÁRIO */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Redefinir Senha</h3>
                  <p className="text-[11px] text-slate-500">{passwordResetUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <p className="text-xs text-slate-600">
                Defina uma nova senha para <strong>{passwordResetUser.email}</strong>:
              </p>
              <div>
                <input
                  type="text"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Nova senha (ex: 3cImob@2026)"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resetPasswordValue}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  {isSubmitting ? 'Salvando...' : 'Gravar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

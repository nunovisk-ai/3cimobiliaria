import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FirstAccessModal: React.FC = () => {
  const { user, completeFirstAccess, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security Criteria Checklist
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Complete first access and save new personal password directly to Supabase Auth & Profile
      const res = await completeFirstAccess(newPassword);
      if (!res.success) {
        throw new Error(res.error || 'Erro ao atualizar senha no Supabase.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível cadastrar a nova senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 overflow-hidden">
        
        {/* Top Accent Stripe - cleanly clipped inside rounded container */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600 rounded-t-3xl" />

        {/* Header */}
        <div className="text-center pt-2 pb-5 border-b border-slate-100">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-100 text-brand-600 mb-3 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Primeiro Acesso — Cadastre sua Senha</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Olá, <strong className="text-slate-700">{user?.name}</strong>! Como este é seu primeiro acesso com a senha padrão, cadastre agora sua senha pessoal definitiva para acessar o CRM.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nova Senha Pessoal *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua nova senha"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Explicit Security Criteria Checklist */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Requisitos de Segurança da Senha:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : ''}`}>
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                <span>1 Letra maiúscula</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                <span>1 Número</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : ''}`}>
                {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                <span>1 Caractere especial (!@#$%)</span>
              </div>
              <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordsMatch ? 'text-emerald-600 font-medium' : ''}`}>
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                <span>Confirmação idêntica</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={logout}
              className="py-2.5 px-3 text-slate-500 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar e Sair
            </button>
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="py-2.5 px-6 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {isLoading ? 'Salvando no Supabase...' : 'Salvar Senha e Acessar CRM'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const LoginCard: React.FC = () => {
  const { login, loginAsDemo, isLoading } = useAuth();
  const [email, setEmail] = useState('lucas.corretor@grupo3c.com.br');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      
      {/* Background Architectural Accent Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-[430px] bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10 z-10 transition-all">
        
        {/* Subtle Brand Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600 rounded-t-3xl" />

        {/* Centered Logo Container */}
        <div className="text-center pt-2 pb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100/80 shadow-sm mb-4">
            <img 
              src="/logo-dark.png" 
              alt="Grupo 3C Imobiliária" 
              className="h-12 w-auto object-contain transition-transform hover:scale-105 duration-200"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM de Vendas</h1>
          <p className="text-xs text-slate-500 mt-1">Acesso exclusivo para corretores e equipe 3C</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email / Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail ou Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@grupo3c.com.br"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={() => alert('Para redefinir sua senha, solicite ao administrador do Grupo 3C ou acerte pelo painel do Supabase.')}
                className="text-[11px] text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Security indicator */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 border-slate-300 focus:ring-brand-400 focus:ring-offset-0"
              />
              <span className="text-slate-600">Lembrar meu acesso</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ambiente Seguro</span>
            </div>
          </div>

          {/* Submit Button in Grupo 3C Vibrant Orange */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 hover:shadow-brand-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Autenticando...
              </span>
            ) : (
              <>
                <span>Acessar CRM do Corretor</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Helpers */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold text-center mb-2.5">
            Acesso Rápido de Teste (1 Clique)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => loginAsDemo('corretor')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 border border-slate-200 text-slate-700 hover:text-brand-600 rounded-lg text-[11px] font-medium transition-all text-center"
            >
              🧑‍💼 Como Corretor
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('gerente')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-[11px] font-medium transition-all text-center"
            >
              📊 Como Gerente
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400">
            Grupo 3C Imobiliária • São Paulo - SP
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isSupabaseConfigured ? '🟢 Conectado ao Supabase' : '⚡ Modo Demonstração Ativo (Supabase Pronto)'}
          </p>
        </div>

      </div>
    </div>
  );
};

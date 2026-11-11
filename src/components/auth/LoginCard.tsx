import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';

export const LoginCard: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  useEffect(() => {
    // Load remembered email if available
    const savedEmail = localStorage.getItem('grupo3c_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        if (rememberMe) {
          localStorage.setItem('grupo3c_remembered_email', email);
        } else {
          localStorage.removeItem('grupo3c_remembered_email');
        }
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

      {/* Main Login Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10 z-10 transition-all">
        
        {/* Subtle Brand Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600 rounded-t-3xl" />

        {/* Centered Logo Container */}
        <div className="text-center pt-2 pb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100/80 shadow-xs mb-4">
            <img 
              src="/logo-dark.png" 
              alt="Grupo 3C Imobiliária" 
              className="h-12 w-auto object-contain transition-transform hover:scale-105 duration-200"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM de Vendas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Acesso exclusivo para corretores do Grupo 3c Imobiliária
          </p>
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
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
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
                onClick={() => setIsRecoveryOpen(true)}
                className="text-[11px] text-brand-600 hover:text-brand-700 font-medium transition-colors cursor-pointer"
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
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me Checkbox (Ambiente Seguro removed) */}
          <div className="flex items-center text-xs text-slate-600 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 border-slate-300 focus:ring-brand-400 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-slate-600">Lembrar meu acesso</span>
            </label>
          </div>

          {/* Submit Button in Grupo 3C Vibrant Orange */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 hover:shadow-brand-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Entrando...
              </span>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Clean Footer (without demo buttons, without conectado ao supabase) */}
        <div className="mt-8 text-center pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            Grupo 3C Imobiliária • São Paulo - SP
          </p>
        </div>

      </div>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        defaultEmail={email}
      />

    </div>
  );
};

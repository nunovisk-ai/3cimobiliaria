import React, { useState } from 'react';
import { Mail, KeyRound, Check, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { usersService } from '../../services/usersService';
import { emailService } from '../../services/emailService';
import { supabase } from '../../lib/supabase';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code & New Password, 3: Success
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Security Criteria Checklist
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar && passwordsMatch;

  // Step 1: Send verification code via Resend & Supabase
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Generate 6-digit OTP code in database
      const generatedCode = await usersService.generateVerificationCode(email, 'recuperacao');
      
      // 2. Dispatch via Resend API and Supabase Auth
      await emailService.sendPasswordRecoveryEmail(email, generatedCode);
      
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível enviar o e-mail de recuperação. Verifique se o e-mail está cadastrado.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Validate code & change password in Supabase
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Verify 6-digit code
      const isValidCode = await usersService.verifyVerificationCode(email, code, 'recuperacao');
      if (!isValidCode) {
        throw new Error('Código de verificação incorreto ou expirado. Verifique os 6 dígitos recebidos no seu e-mail.');
      }

      // 2. Find user in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email.trim())
        .maybeSingle();

      if (!profile) {
        throw new Error('Usuário não localizado no sistema.');
      }

      // 3. Update password via admin RPC in Supabase Auth & Profile
      await usersService.adminSetUserPassword(profile.id, newPassword);

      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao redefinir senha no Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 overflow-hidden">
        
        {/* Top Accent Stripe - cleanly clipped inside rounded container */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-amber-500 to-brand-600 rounded-t-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-brand-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Recuperação de Senha</h2>
              <p className="text-xs text-slate-500">Grupo 3C Imobiliária</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Informe seu e-mail cadastrado no CRM. Enviaremos um <strong>código de verificação de 6 dígitos</strong> para o seu e-mail.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail Cadastrado
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Enviando código...
                </span>
              ) : (
                'Receber Código no E-mail'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter Code from Email and New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* Info Box */}
            <div className="p-3.5 bg-orange-50/90 border border-orange-200/80 rounded-xl text-xs text-orange-950 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-orange-900">
                <Mail className="w-4 h-4 text-brand-600" />
                <span>Instruções enviadas para seu e-mail!</span>
              </div>
              <p className="text-[11px] text-orange-800 leading-relaxed">
                Verifique sua caixa de entrada e pasta de spam em <strong>{email}</strong>.
              </p>
              <div className="pt-1.5 border-t border-orange-200/60 text-[11px] text-orange-900 space-y-1">
                <p>
                  🔗 <strong>Pelo link:</strong> Se você recebeu o link da Caixa Postal, basta clicar em <em>"Reset password"</em> no seu e-mail para abrir a tela de nova senha.
                </p>
                <p>
                  🔢 <strong>Pelo código:</strong> Se você recebeu um código de 6 dígitos no seu e-mail, digite-o abaixo junto com a sua nova senha:
                </p>
              </div>
            </div>

            {/* Code Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de 6 Dígitos (Recebido no e-mail) *
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 849201"
                required
                className="w-full text-center py-2.5 tracking-[0.5em] font-mono text-base font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Live Security Checklist */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
              <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                Aspectos de Segurança Exigidos:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
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
                  <span>1 Caractere especial</span>
                </div>
                <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordsMatch ? 'text-emerald-600 font-medium' : ''}`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                  <span>Confirmação idêntica</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || code.length !== 6}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? 'Salvando no Supabase...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Senha Alterada com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sua nova senha foi salva no Supabase. Agora você já pode fazer login no CRM de Vendas.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Ir para Tela de Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

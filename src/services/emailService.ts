import { supabase } from '../lib/supabase';

export interface SendRecoveryResult {
  success: boolean;
  code?: string;
  error?: string;
  simulated?: boolean;
}

export const emailService = {
  /**
   * Dispatches the 6-digit password recovery code via Resend API and/or Supabase Auth
   */
  async sendPasswordRecoveryEmail(email: string, code: string, userName?: string): Promise<SendRecoveryResult> {
    const cleanEmail = email.trim().toLowerCase();
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

    let resendSent = false;
    let resendError: string | null = null;

    // 1. Try sending via Resend API if API key is provided
    if (resendApiKey && resendApiKey.startsWith('re_')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Grupo 3C Imobiliária <onboarding@resend.dev>',
            to: [cleanEmail],
            subject: `Código de Recuperação: ${code} - Grupo 3C Imobiliária`,
            html: `
              <!DOCTYPE html>
              <html lang="pt-BR">
              <head>
                <meta charset="utf-8" />
                <title>Recuperação de Senha - Grupo 3C</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
                <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                  <div style="background: linear-gradient(135deg, #f68633 0%, #ea580c 100%); padding: 24px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">GRUPO 3C IMOBILIÁRIA</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">CRM de Vendas e Negociações</p>
                  </div>
                  
                  <div style="padding: 28px 24px;">
                    <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Recuperação de Senha</h2>
                    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                      ${userName ? `Olá <strong>${userName}</strong>, ` : 'Olá, '}recebemos uma solicitação para redefinir a senha da sua conta no CRM Grupo 3C.
                    </p>
                    
                    <div style="margin: 24px 0; padding: 18px; background: #fff7ed; border: 2px dashed #fb923c; border-radius: 14px; text-align: center;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Seu Código de Verificação</span>
                      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c;">${code}</span>
                    </div>

                    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                      Copie e cole este código de 6 dígitos na tela de recuperação do CRM. Este código expira em <strong>15 minutos</strong>.
                    </p>

                    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                      Se você não solicitou a troca de senha, desconsidere este e-mail com segurança.
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          resendSent = true;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Resend API response error:', errData);
          resendError = errData.message || `Erro ${response.status} no Resend`;
        }
      } catch (err: any) {
        console.warn('Failed to call Resend API directly:', err);
        resendError = err.message || 'Falha de conexão com Resend';
      }
    }

    // 2. Complementary attempt via Supabase Auth reset (triggers custom SMTP if configured in Supabase project)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://grupo3c.vitrai.com.br';
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/`,
      }).catch(() => {});
    } catch {
      // Ignored non-blocking
    }

    return {
      success: true,
      code,
      error: resendError || undefined,
      simulated: !resendSent,
    };
  },
};

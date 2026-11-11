import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WhatsAppMessage, WhatsAppInstance, Lead } from '../types';

export const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution.vitrai.com.br';
export const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '3c_evolution_secret_994821';

export const whatsappService = {
  /**
   * Fetches the live QR code from Evolution API
   */
  async fetchLiveQrCode(sessionName: string = '3c_vendedor'): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${sessionName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64 || null;
    } catch (err) {
      console.warn('Could not fetch QR code from Evolution API:', err);
      return null;
    }
  },

  /**
   * Checks real connection state from Evolution API
   */
  async checkLiveConnectionState(sessionName: string = '3c_vendedor'): Promise<'open' | 'connecting' | 'close'> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${sessionName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });
      if (!res.ok) return 'close';
      const data = await res.json();
      return data?.instance?.state || 'close';
    } catch (err) {
      console.warn('Could not check connection state from Evolution API:', err);
      return 'close';
    }
  },

  /**
   * Sends a real message via Evolution API with anti-ban delay & presence
   */
  async sendEvolutionMessage(sessionName: string, phoneNumber: string, text: string): Promise<boolean> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const ddiPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: ddiPhone,
          text: text,
          delay: 1200, // Anti-ban emulation: mimics human typing
          linkPreview: true,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error sending message via Evolution API:', err);
      return false;
    }
  },
  /**
   * Fetches all messages for a specific lead, ordered chronologically
   */
  async getMessages(leadId: string): Promise<WhatsAppMessage[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('enviada_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      leadId: row.lead_id,
      corretorId: row.corretor_id,
      fromMe: row.remetente_tipo === 'corretor',
      text: row.mensagem,
      mediaUrl: row.midia_url,
      timestamp: row.enviada_at,
      status: (row.status_envio as any) || 'read',
    }));
  },

  /**
   * Sends a message from the corretor to the lead, saving to Supabase and updating last interaction
   */
  async sendMessage(leadId: string, text: string, corretorId?: string, mediaUrl?: string): Promise<WhatsAppMessage> {
    const payload = {
      lead_id: leadId,
      corretor_id: corretorId || null,
      remetente_tipo: 'corretor',
      mensagem: text,
      midia_url: mediaUrl || null,
      enviada_at: new Date().toISOString(),
      status_envio: 'sent',
    };

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    // Try sending via Evolution API asynchronously if lead has phone
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('telefone')
        .eq('id', leadId)
        .maybeSingle();

      if (lead?.telefone) {
        // Dispatch to real WhatsApp in the background
        this.sendEvolutionMessage('3c_vendedor', lead.telefone, text);
      }
    } catch (e) {
      console.warn('Could not forward message to Evolution API:', e);
    }

    // Update lead's last interaction timestamp
    await supabase
      .from('leads')
      .update({ ultima_interacao_at: new Date().toISOString() })
      .eq('id', leadId);

    return {
      id: data.id,
      leadId: data.lead_id,
      corretorId: data.corretor_id,
      fromMe: true,
      text: data.mensagem,
      mediaUrl: data.midia_url,
      timestamp: data.enviada_at,
      status: 'delivered',
    };
  },

  /**
   * Simulates an incoming message from the lead (useful for testing two-way real-time mirroring)
   */
  async simulateIncomingMessage(leadId: string, text: string): Promise<WhatsAppMessage> {
    const payload = {
      lead_id: leadId,
      corretor_id: null,
      remetente_tipo: 'lead',
      mensagem: text,
      enviada_at: new Date().toISOString(),
      status_envio: 'read',
    };

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error simulating incoming message:', error);
      throw error;
    }

    await supabase
      .from('leads')
      .update({ ultima_interacao_at: new Date().toISOString() })
      .eq('id', leadId);

    return {
      id: data.id,
      leadId: data.lead_id,
      fromMe: false,
      text: data.mensagem,
      timestamp: data.enviada_at,
      status: 'read',
    };
  },

  /**
   * Gets or initializes the WhatsApp instance status for the broker
   */
  async getInstanceStatus(corretorEmail: string = 'corretor@grupo3c.com.br'): Promise<WhatsAppInstance> {
    if (!isSupabaseConfigured) {
      return {
        id: 'demo-inst',
        sessionName: 'corretor_3c',
        status: 'disconnected'
      };
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('corretor_email', corretorEmail)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching whatsapp instance:', error);
    }

    if (data) {
      let currentStatus = data.status;
      let currentQr = data.qrcode_base64;

      try {
        const liveState = await this.checkLiveConnectionState(data.session_name);
        if (liveState === 'open' && currentStatus !== 'connected') {
          currentStatus = 'connected';
          await supabase
            .from('whatsapp_instances')
            .update({ status: 'connected', updated_at: new Date().toISOString() })
            .eq('id', data.id);
        } else if (currentStatus !== 'connected' && !currentQr) {
          currentQr = await this.fetchLiveQrCode(data.session_name);
          if (currentQr) {
            await supabase
              .from('whatsapp_instances')
              .update({ qrcode_base64: currentQr })
              .eq('id', data.id);
          }
        }
      } catch (err) {
        console.warn('Error checking live Evolution instance state:', err);
      }

      return {
        id: data.id,
        corretorId: data.corretor_id,
        sessionName: data.session_name,
        phoneNumber: data.phone_number,
        status: currentStatus,
        qrcodeBase64: currentQr,
        connectedAt: data.connected_at,
        lastSyncAt: data.last_sync_at,
      };
    }

    // Default instance if none exists
    const newInstance = {
      corretor_email: corretorEmail,
      session_name: `3c_${corretorEmail.split('@')[0]}`,
      status: 'disconnected',
    };

    const { data: created } = await supabase
      .from('whatsapp_instances')
      .insert([newInstance])
      .select()
      .single();

    return {
      id: created?.id || 'inst-1',
      sessionName: created?.session_name || 'corretor_3c',
      status: 'disconnected',
    };
  },

  /**
   * Connects the instance (supports demo one-click or QR code scanning)
   */
  async setInstanceConnected(instanceId: string, phoneNumber: string = '(11) 98765-4321'): Promise<void> {
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        qrcode_base64: null,
      })
      .eq('id', instanceId);
  },

  /**
   * Disconnects the WhatsApp instance
   */
  async disconnectInstance(instanceId: string): Promise<void> {
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        phone_number: null,
        qrcode_base64: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId);
  },

  /**
   * Pre-formatted quick real estate response templates for brokers
   */
  getQuickTemplates(lead?: Lead | null) {
    const nome = lead?.nome ? lead.nome.split(' ')[0] : 'Cliente';
    const emp = lead?.empreendimentoInteresse || 'nossos lançamentos em São Paulo';
    const parcela = lead?.rendaMensal ? `R$ ${(lead.rendaMensal * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'uma parcela que cabe no seu bolso';

    return [
      {
        id: 'apresentacao',
        titulo: 'Apresentação do Projeto',
        texto: `Olá ${nome}! Tudo bem? Sou da equipe do *Grupo 3C Imobiliária*. Estou entrando em contato sobre o *${emp}*! Temos condições exclusivas pelo programa Minha Casa Minha Vida com subsídio e entrada parcelada direto com a construtora. Gostaria de receber o book de fotos e plantas no seu WhatsApp?`,
      },
      {
        id: 'docs_caixa',
        titulo: 'Lista de Docs Caixa',
        texto: `Olá ${nome}! Para fazermos a sua análise de crédito com a Caixa Econômica Federal e garantir a taxa de juros mais baixa do mercado, precisamos dos seguintes documentos básicos:\n\n1. RG ou CNH (frente e verso)\n2. Comprovante de Residência recente (últimos 60 dias)\n3. 3 últimos Holerites\n4. Extrato do FGTS com saldo\n5. Certidão de Estado Civil (Nascimento ou Casamento)\n6. Declaração do Imposto de Renda (se declarar)\n\nPode me enviar por foto ou PDF aqui mesmo pelo WhatsApp! 👍`,
      },
      {
        id: 'visita',
        titulo: 'Convite / Confirmação de Visita',
        texto: `Olá ${nome}! O que acha de darmos um pulo no plantão do *${emp}* para você conhecer o apartamento decorado em tamanho real e tirar todas as dúvidas? Posso agendar para você amanhã ou no próximo sábado! Qual horário fica melhor para você?`,
      },
      {
        id: 'simulacao',
        titulo: 'Simulação de Financiamento',
        texto: `Olá ${nome}! Fizemos um estudo prévio do seu perfil com base na sua renda: sua parcela máxima estimada pelo Minha Casa Minha Vida fica em torno de *${parcela}* mensais! E podemos usar o seu saldo de FGTS para abater a entrada. Ficou com alguma dúvida sobre o fluxo?`,
      },
      {
        id: 'localizacao',
        titulo: 'Localização do Plantão',
        texto: `Segue o endereço do nosso plantão de vendas do *${emp}*! Temos estacionamento no local e atendimento com café e maquete completa. Quando estiver a caminho, me avise para eu te recepcionar na portaria! 🏢✨`,
      }
    ];
  }
};

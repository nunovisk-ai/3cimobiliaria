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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (err) {
      console.warn('Error sending message via Evolution API:', err);
      return false;
    }
  },

  /**
   * Fetches the real connected phone number from Evolution API for the session
   */
  async getConnectedPhone(sessionName: string): Promise<string | null> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });
      if (res.ok) {
        const list = await res.json();
        const target = Array.isArray(list) ? list.find((i: any) => i.name === sessionName) : list;
        if (target?.ownerJid || target?.number) {
          const raw = (target.ownerJid || target.number || '').split('@')[0].replace(/\D/g, '');
          if (raw) {
            const clean = raw.startsWith('55') ? raw.slice(2) : raw;
            const ddd = clean.slice(0, 2);
            const num = clean.slice(2);
            return num.length === 9 
              ? `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
              : `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching connected phone from Evolution API:', e);
    }
    return null;
  },
  /**
   * Automatically ensures the broker's isolated instance exists on Evolution API with anti-ban protections
   */
  async ensureInstance(sessionName: string): Promise<void> {
    try {
      const checkRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${sessionName}`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });
      if (checkRes.status === 404) {
        await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: sessionName,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true,
          }),
        });

        await fetch(`${EVOLUTION_API_URL}/settings/set/${sessionName}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectCall: true,
            msgCall: 'Grupo 3C: Atendimento por mensagem.',
            groupsIgnore: true,
            alwaysOnline: false,
            readMessages: true,
            readStatus: false,
            syncFullHistory: false,
          }),
        });
      }
    } catch (err) {
      console.warn('Error ensuring Evolution instance:', err);
    }
  },

  /**
   * Fetches real WhatsApp chats from Evolution API for the broker's session
   */
  async getRealChats(sessionName: string = '3c_vendedor'): Promise<any[]> {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) return [];
      const chats = await res.json();
      if (!Array.isArray(chats)) return [];

      // Filter out WhatsApp groups (@g.us) to keep only customer leads (anti-spam)
      return chats
        .filter((c: any) => c.remoteJid && !c.remoteJid.includes('@g.us') && !c.remoteJid.includes('status@broadcast'))
        .map((c: any) => {
          const rawPhone = c.remoteJid.split('@')[0];
          let phoneClean = rawPhone.replace(/\D/g, '');
          if (phoneClean.startsWith('55') && phoneClean.length >= 12) {
            phoneClean = phoneClean.slice(2);
          }
          const ddd = phoneClean.slice(0, 2);
          const num = phoneClean.slice(2);
          const formattedPhone = num.length === 9 
            ? `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
            : `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;

          let lastMsg = '';
          const lastTime = c.updatedAt || new Date().toISOString();

          if (c.lastMessage?.message) {
            const m = c.lastMessage.message;
            lastMsg = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || (m.audioMessage ? '🎤 Áudio' : 'Mensagem');
          }

          return {
            id: c.remoteJid,
            remoteJid: c.remoteJid,
            name: c.pushName || c.name || formattedPhone,
            pushName: c.pushName,
            phone: formattedPhone,
            rawPhone,
            unreadCount: c.unreadCount || 0,
            profilePicUrl: c.profilePicUrl,
            lastMessage: lastMsg,
            lastMessageTimestamp: lastTime,
          };
        });
    } catch (err) {
      console.warn('Could not fetch real chats from Evolution API:', err);
      return [];
    }
  },

  /**
   * Fetches real messages for a specific WhatsApp chat
   */
  async getRealMessages(sessionName: string, remoteJid: string, leadId?: string): Promise<WhatsAppMessage[]> {
    let evolutionMsgs: WhatsAppMessage[] = [];
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${sessionName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          where: {
            key: {
              remoteJid: remoteJid,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const records = data.messages?.records || (Array.isArray(data) ? data : []);
        evolutionMsgs = records.map((m: any) => {
          const msgObj = m.message || {};
          const text = msgObj.conversation || 
                       msgObj.extendedTextMessage?.text || 
                       msgObj.imageMessage?.caption || 
                       (msgObj.audioMessage ? '🎤 Mensagem de áudio' : '') ||
                       (msgObj.imageMessage ? '📷 Imagem' : '') ||
                       (msgObj.documentMessage ? '📄 Documento' : '') ||
                       '';
          return {
            id: m.key?.id || m.id || String(Math.random()),
            leadId: leadId || remoteJid,
            fromMe: Boolean(m.key?.fromMe),
            text: text,
            timestamp: m.messageTimestamp ? new Date(m.messageTimestamp * 1000).toISOString() : (m.createdAt || new Date().toISOString()),
            status: m.status === 'READ' ? 'read' : 'delivered',
          };
        }).filter((m: any) => m.text);
      }
    } catch (err) {
      console.warn('Could not fetch messages from Evolution API:', err);
    }

    // Also get Supabase messages for leadId if present
    let supabaseMsgs: WhatsAppMessage[] = [];
    if (leadId) {
      try {
        supabaseMsgs = await this.getMessages(leadId);
      } catch (e) {
        // ignore
      }
    }

    // Merge and deduplicate by id or text+fromMe
    const combined = [...evolutionMsgs, ...supabaseMsgs];
    const seen = new Set<string>();
    const unique: WhatsAppMessage[] = [];
    for (const msg of combined) {
      const key = msg.id || `${msg.fromMe}_${msg.text}_${msg.timestamp.slice(0, 16)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(msg);
      }
    }

    unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return unique;
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
   * Sends a message from the corretor to the lead, saving to Supabase and dispatching via Evolution API
   */
  async sendMessage(
    leadId: string, 
    text: string, 
    sessionName: string = '3c_vendedor', 
    corretorId?: string, 
    mediaUrl?: string,
    customPhone?: string
  ): Promise<WhatsAppMessage> {
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const validLeadId = isUuid(leadId) ? leadId : null;

    let targetPhone = customPhone;

    if (!targetPhone && validLeadId && isSupabaseConfigured) {
      try {
        const { data: lead } = await supabase
          .from('leads')
          .select('telefone')
          .eq('id', validLeadId)
          .maybeSingle();

        if (lead?.telefone) {
          targetPhone = lead.telefone;
        }
      } catch (e) {
        // ignore
      }
    }

    // Dispatch to real WhatsApp phone via Evolution API
    if (targetPhone) {
      try {
        await this.sendEvolutionMessage(sessionName, targetPhone, text);
      } catch (e) {
        console.warn('Could not forward message to Evolution API:', e);
      }
    }

    let insertedId = `msg-${Date.now()}`;
    let insertedTime = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const payload = {
          lead_id: validLeadId,
          corretor_id: corretorId || null,
          remetente_tipo: 'corretor',
          mensagem: text,
          midia_url: mediaUrl || null,
          enviada_at: insertedTime,
          status_envio: 'sent',
        };

        const { data } = await supabase
          .from('whatsapp_messages')
          .insert([payload])
          .select()
          .single();

        if (data) {
          insertedId = data.id;
          insertedTime = data.enviada_at;
        }
      } catch (err) {
        console.warn('Could not save message to Supabase:', err);
      }

      if (validLeadId) {
        try {
          await supabase
            .from('leads')
            .update({ ultima_interacao_at: new Date().toISOString() })
            .eq('id', validLeadId);
        } catch (e) {
          // ignore
        }
      }
    }

    return {
      id: insertedId,
      leadId: leadId,
      corretorId: corretorId,
      fromMe: true,
      text: text,
      mediaUrl: mediaUrl,
      timestamp: insertedTime,
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
  async getInstanceStatus(corretorEmail: string = 'corretor@grupo3c.com.br', corretorId?: string): Promise<WhatsAppInstance> {
    if (!isSupabaseConfigured) {
      return {
        id: 'demo-inst',
        sessionName: '3c_vendedor',
        status: 'disconnected'
      };
    }

    const cleanSessionName = `3c_${corretorEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')}`;

    // Auto-ensure instance on Evolution API
    await this.ensureInstance(cleanSessionName);

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .or(`corretor_email.eq.${corretorEmail},session_name.eq.${cleanSessionName}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching whatsapp instance:', error);
    }

    let instanceRow = data;

    if (!instanceRow) {
      const newInstance = {
        corretor_id: corretorId || null,
        corretor_email: corretorEmail,
        session_name: cleanSessionName,
        status: 'disconnected',
      };

      const { data: created } = await supabase
        .from('whatsapp_instances')
        .insert([newInstance])
        .select()
        .single();
      instanceRow = created;
    }

    let currentStatus = instanceRow?.status || 'disconnected';
    let currentPhone = instanceRow?.phone_number || null;
    let currentQr = instanceRow?.qrcode_base64 || null;

    try {
      const liveState = await this.checkLiveConnectionState(cleanSessionName);
      if (liveState === 'open') {
        currentStatus = 'connected';
        const detectedPhone = await this.getConnectedPhone(cleanSessionName);
        if (detectedPhone) {
          currentPhone = detectedPhone;
        }
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone_number: currentPhone,
            qrcode_base64: null,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', instanceRow.id);
      } else {
        // WhatsApp is NOT connected in Evolution API: keep as disconnected and fetch fresh QR code
        currentStatus = 'disconnected';
        currentPhone = null;
        currentQr = await this.fetchLiveQrCode(cleanSessionName);
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'disconnected',
            phone_number: null,
            qrcode_base64: currentQr,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', instanceRow.id);
      }
    } catch (err) {
      console.warn('Error checking live Evolution instance state:', err);
    }

    return {
      id: instanceRow?.id || 'inst-1',
      corretorId: instanceRow?.corretor_id,
      sessionName: cleanSessionName,
      phoneNumber: currentPhone,
      status: currentStatus,
      qrcodeBase64: currentQr,
      connectedAt: instanceRow?.connected_at,
      lastSyncAt: instanceRow?.last_sync_at,
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
   * Disconnects the WhatsApp instance from both Evolution API and Supabase
   */
  async disconnectInstance(instanceId: string, sessionName: string = '3c_vendedor'): Promise<void> {
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${sessionName}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_API_KEY },
      });
    } catch (err) {
      console.warn('Error logging out from Evolution API:', err);
    }

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

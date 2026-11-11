import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Visit } from '../types';

export interface CreateVisitInput {
  leadId: string;
  empreendimentoNome: string;
  enderecoPlantao?: string;
  dataHora: string;
  observacoes?: string;
  corretorId?: string;
}

export const visitsService = {
  /**
   * Fetches all visits joined with lead details (name, phone)
   */
  async getVisits(): Promise<Visit[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('visitas')
      .select('*, leads(nome, telefone)')
      .order('data_hora', { ascending: true });

    if (error) {
      console.error('Error fetching visits:', error);
      throw error;
    }

    return (data || []).map(row => {
      const leadInfo = row.leads || {};
      return {
        id: row.id,
        leadId: row.lead_id,
        leadNome: leadInfo.nome || 'Lead sem nome',
        leadTelefone: leadInfo.telefone || '',
        corretorId: row.corretor_id,
        empreendimentoNome: row.empreendimento_nome,
        enderecoPlantao: row.endereco_plantao || '',
        dataHora: row.data_hora,
        realizada: row.realizada,
        motivoNaoComparecimento: row.motivo_nao_comparecimento,
        observacoes: row.observacoes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  },

  /**
   * Creates a new scheduled visit and moves lead to 'visita_agendada'
   */
  async createVisit(input: CreateVisitInput): Promise<Visit> {
    const payload = {
      lead_id: input.leadId,
      empreendimento_nome: input.empreendimentoNome,
      endereco_plantao: input.enderecoPlantao || null,
      data_hora: input.dataHora,
      observacoes: input.observacoes || null,
      corretor_id: input.corretorId || null,
      realizada: null,
    };

    const { data, error } = await supabase
      .from('visitas')
      .insert([payload])
      .select('*, leads(nome, telefone)')
      .single();

    if (error) {
      console.error('Error creating visit:', error);
      throw error;
    }

    // Automatically update lead's funnel status to 'visita_agendada'
    await supabase
      .from('leads')
      .update({
        status_funil: 'visita_agendada',
        ultima_interacao_at: new Date().toISOString()
      })
      .eq('id', input.leadId);

    const leadInfo = data.leads || {};
    return {
      id: data.id,
      leadId: data.lead_id,
      leadNome: leadInfo.nome || 'Lead',
      leadTelefone: leadInfo.telefone || '',
      corretorId: data.corretor_id,
      empreendimentoNome: data.empreendimento_nome,
      enderecoPlantao: data.endereco_plantao || '',
      dataHora: data.data_hora,
      realizada: data.realizada,
      motivoNaoComparecimento: data.motivo_nao_comparecimento,
      observacoes: data.observacoes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Records visit outcome: Realizada (true) or Não Compareceu (false with reason)
   */
  async updateVisitOutcome(visitId: string, realizada: boolean, motivoNaoComparecimento?: string): Promise<void> {
    const payload: any = {
      realizada,
      motivo_nao_comparecimento: realizada ? null : (motivoNaoComparecimento || 'Cliente não compareceu'),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('visitas')
      .update(payload)
      .eq('id', visitId);

    if (error) {
      console.error('Error updating visit outcome:', error);
      throw error;
    }
  },

  /**
   * Reschedules an existing visit to a new date/time and resets status to pending (null)
   */
  async rescheduleVisit(visitId: string, novaDataHora: string, novasObservacoes?: string): Promise<void> {
    const payload: any = {
      data_hora: novaDataHora,
      realizada: null,
      motivo_nao_comparecimento: null,
      updated_at: new Date().toISOString(),
    };

    if (novasObservacoes) {
      payload.observacoes = novasObservacoes;
    }

    const { error } = await supabase
      .from('visitas')
      .update(payload)
      .eq('id', visitId);

    if (error) {
      console.error('Error rescheduling visit:', error);
      throw error;
    }
  },

  /**
   * Deletes a scheduled visit
   */
  async deleteVisit(visitId: string): Promise<void> {
    const { error } = await supabase
      .from('visitas')
      .delete()
      .eq('id', visitId);

    if (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  },

  /**
   * Generates Google Calendar direct URL with event pre-filled
   */
  getGoogleCalendarUrl(visit: Visit): string {
    const startDate = new Date(visit.dataHora);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration default

    const formatDateUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dates = `${formatDateUtc(startDate)}/${formatDateUtc(endDate)}`;

    const title = `Visita Estande - ${visit.empreendimentoNome} (${visit.leadNome || 'Lead'})`;
    const details = [
      `🤝 Lead: ${visit.leadNome || 'Lead'}`,
      `📞 Telefone: ${visit.leadTelefone || 'N/A'}`,
      `🏢 Empreendimento: ${visit.empreendimentoNome}`,
      `📍 Local: ${visit.enderecoPlantao || 'Plantão de Vendas'}`,
      visit.observacoes ? `📝 Observações: ${visit.observacoes}` : '',
      '\nGrupo 3C Imobiliária'
    ].filter(Boolean).join('\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: dates,
      details: details,
      location: visit.enderecoPlantao || 'Plantão de Vendas'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  /**
   * Generates and triggers download of .ics calendar file for Apple Calendar (iPhone/iCloud) & Outlook
   */
  downloadIcsFile(visit: Visit): void {
    const startDate = new Date(visit.dataHora);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateIcs = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Grupo 3C Imobiliaria//CRM//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${visit.id || Date.now()}@grupo3c.vitrai.com.br`,
      `DTSTAMP:${formatDateIcs(new Date())}`,
      `DTSTART:${formatDateIcs(startDate)}`,
      `DTEND:${formatDateIcs(endDate)}`,
      `SUMMARY:Visita Estande: ${visit.empreendimentoNome} com ${visit.leadNome || 'Lead'}`,
      `DESCRIPTION:Cliente: ${visit.leadNome || 'Lead'}\\nTelefone: ${visit.leadTelefone || 'N/A'}\\nEmpreendimento: ${visit.empreendimentoNome}\\nObs: ${visit.observacoes || 'N/A'}\\n\\nGrupo 3C Imobiliaria`,
      `LOCATION:${visit.enderecoPlantao || 'Plantão de Vendas'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const safeName = (visit.leadNome || 'lead').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('download', `visita_${safeName}_${visit.empreendimentoNome.toLowerCase().replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Formats a professional WhatsApp confirmation message to send to the lead
   */
  getWhatsAppConfirmationMessage(visit: Visit): string {
    const visitDate = new Date(visit.dataHora);
    const dataFormatada = visitDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const horaFormatada = visitDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `Olá, *${visit.leadNome}*! Tudo bem? 👋\n\n` +
      `Aqui é da equipe do *Grupo 3C Imobiliária* confirmando nossa visita agendada ao estande do *${visit.empreendimentoNome}*! 🏢✨\n\n` +
      `📅 *Data:* ${dataFormatada}\n` +
      `⏰ *Horário:* ${horaFormatada}\n` +
      `📍 *Endereço do Plantão:* ${visit.enderecoPlantao || 'Plantão de Vendas'}\n\n` +
      (visit.enderecoPlantao ? `🗺️ *Google Maps:* https://maps.google.com/?q=${encodeURIComponent(visit.enderecoPlantao)}\n\n` : '') +
      `Você poderá conhecer o apartamento decorado e tiramos todas as dúvidas sobre fluxo de pagamento e aprovação de crédito Caixa. 🔑\n\n` +
      `Por favor, me responda confirmando se este dia e horário continuam certos para você. Nos vemos lá! 🤝`;
  }
};

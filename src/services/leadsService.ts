import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lead, FunnelStage } from '../types';

export const leadsService = {
  async getLeads(): Promise<Lead[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, using fallback');
      return [];
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_checklist_items(*)')
      .order('ultima_interacao_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    return (data || []).map(row => {
      const checklist = row.lead_checklist_items || [];
      const coletados = checklist.filter((i: any) => i.coletado).length;
      const aprovados = checklist.filter((i: any) => i.status_analise === 'aprovado').length;
      const temRejeitado = checklist.some((i: any) => i.status_analise === 'rejeitado');

      return {
        id: row.id,
        corretorId: row.corretor_id || '',
        nome: row.nome,
        telefone: row.telefone,
        email: row.email,
        cpf: row.cpf || '',
        dataNascimento: row.data_nascimento || '',
        rendaMensal: Number(row.renda_bruta_mensal) || 0,
        fgtsValor: Number(row.fgts_saldo) || 0,
        fgtsAprovado: Boolean(row.fgts_aprovado),
        empreendimentoInteresse: row.empreendimento_nome || 'A definir',
        statusFunil: row.status_funil as FunnelStage,
        origemLead: (row.origem as any) || 'whatsapp',
        motivoDescarte: row.motivo_descarte,
        motivoRejeicaoCredito: row.motivo_rejeicao_credito,
        observacaoRejeicao: row.observacao_rejeicao,
        observacoes: row.observacoes,
        checklistProgress: checklist.length > 0 ? {
          coletados,
          total: checklist.length,
          aprovados,
          temRejeitado
        } : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ultimaInteracaoAt: row.ultima_interacao_at || row.created_at,
      };
    });
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const payload = {
      nome: leadData.nome,
      telefone: leadData.telefone,
      email: leadData.email || null,
      cpf: leadData.cpf || null,
      data_nascimento: leadData.dataNascimento || null,
      renda_bruta_mensal: leadData.rendaMensal || 0,
      fgts_saldo: leadData.fgtsValor || 0,
      fgts_aprovado: leadData.fgtsAprovado || false,
      empreendimento_nome: leadData.empreendimentoInteresse || 'A definir',
      status_funil: leadData.statusFunil || 'novo_lead',
      origem: leadData.origemLead || 'whatsapp',
      observacoes: leadData.observacoes || null,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw error;
    }

    return {
      id: data.id,
      corretorId: data.corretor_id || '',
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      cpf: data.cpf || '',
      dataNascimento: data.data_nascimento || '',
      rendaMensal: Number(data.renda_bruta_mensal) || 0,
      fgtsValor: Number(data.fgts_saldo) || 0,
      fgtsAprovado: Boolean(data.fgts_aprovado),
      empreendimentoInteresse: data.empreendimento_nome,
      statusFunil: data.status_funil as FunnelStage,
      origemLead: data.origem as any,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ultimaInteracaoAt: data.ultima_interacao_at,
    };
  },

  async updateLeadStatus(leadId: string, newStatus: FunnelStage): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status_funil: newStatus,
        ultima_interacao_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  },

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.telefone !== undefined) payload.telefone = updates.telefone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.cpf !== undefined) payload.cpf = updates.cpf;
    if (updates.dataNascimento !== undefined) payload.data_nascimento = updates.dataNascimento;
    if (updates.rendaMensal !== undefined) payload.renda_bruta_mensal = updates.rendaMensal;
    if (updates.fgtsValor !== undefined) payload.fgts_saldo = updates.fgtsValor;
    if (updates.fgtsAprovado !== undefined) payload.fgts_aprovado = updates.fgtsAprovado;
    if (updates.empreendimentoInteresse !== undefined) payload.empreendimento_nome = updates.empreendimentoInteresse;
    if (updates.statusFunil !== undefined) payload.status_funil = updates.statusFunil;
    if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;
    if (updates.motivoDescarte !== undefined) payload.motivo_descarte = updates.motivoDescarte;
    if (updates.motivoRejeicaoCredito !== undefined) payload.motivo_rejeicao_credito = updates.motivoRejeicaoCredito;
    if (updates.observacaoRejeicao !== undefined) payload.observacao_rejeicao = updates.observacaoRejeicao;
    payload.ultima_interacao_at = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }
};

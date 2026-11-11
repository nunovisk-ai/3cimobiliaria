import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ChecklistItem } from '../types';

export const STANDARD_DOCS = [
  {
    codigoDoc: 'rg_cnh',
    titulo: 'RG ou CNH (Frente e Verso)',
    descricao: 'Documento oficial com foto e CPF legível',
    obrigatorio: true,
  },
  {
    codigoDoc: 'comp_residencia',
    titulo: 'Comprovante de Residência Recente',
    descricao: 'Conta de consumo (luz, água, gás) emitida nos últimos 60 dias',
    obrigatorio: true,
  },
  {
    codigoDoc: 'holerites',
    titulo: '3 Últimos Holerites ou 6 Extratos',
    descricao: 'Comprovação de renda bruta mensal formal ou extratos para autônomos',
    obrigatorio: true,
  },
  {
    codigoDoc: 'extrato_fgts',
    titulo: 'Extrato Analítico do FGTS & CTPS',
    descricao: 'Extrato da conta vinculada Caixa para abatimento do saldo na entrada',
    obrigatorio: true,
  },
  {
    codigoDoc: 'certidao_civil',
    titulo: 'Certidão de Estado Civil',
    descricao: 'Nascimento (solteiro), Casamento com averbação ou Escritura de União Estável',
    obrigatorio: true,
  },
  {
    codigoDoc: 'irpf',
    titulo: 'Declaração e Recibo de IRPF',
    descricao: 'Cópia da declaração de imposto de renda mais recente (se declarante)',
    obrigatorio: false,
  }
];

export const CREDIT_REJECTION_REASONS = [
  'Restrição cadastral no CPF (Serasa / SPC / Bacen / CADIN)',
  'Renda bruta mensal insuficiente para a faixa do empreendimento',
  'Score de crédito baixo / Reprovado nos critérios de risco da Caixa (Conres)',
  'Comprometimento excessivo de renda (Empréstimos ou outros financiamentos ativos)',
  'Tempo de carteira assinada insuficiente (< 3 anos para benefícios MCMV)',
  'Divergência de dados cadastrais / Documentação ilegível',
  'Outro motivo específico da assessoria'
];

export const documentsService = {
  async getChecklist(leadId: string): Promise<ChecklistItem[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('lead_checklist_items')
      .select('*')
      .eq('lead_id', leadId)
      .order('codigo_doc', { ascending: true });

    if (error) {
      console.error('Error fetching checklist items:', error);
      throw error;
    }

    // If no checklist exists for this lead yet, initialize with standard items
    if (!data || data.length === 0) {
      const inserts = STANDARD_DOCS.map(doc => ({
        lead_id: leadId,
        codigo_doc: doc.codigoDoc,
        titulo: doc.titulo,
        descricao: doc.descricao,
        obrigatorio: doc.obrigatorio,
        coletado: false,
        status_analise: 'pendente'
      }));

      const { data: created, error: insertError } = await supabase
        .from('lead_checklist_items')
        .insert(inserts)
        .select();

      if (insertError) {
        console.error('Error initializing checklist items:', insertError);
        throw insertError;
      }

      return (created || []).map(row => ({
        id: row.id,
        leadId: row.lead_id,
        codigoDoc: row.codigo_doc,
        titulo: row.titulo,
        descricao: row.descricao,
        obrigatorio: Boolean(row.obrigatorio),
        coletado: Boolean(row.coletado),
        statusAnalise: row.status_analise as any,
        motivoRejeicao: row.motivo_rejeicao,
        arquivoUrl: row.arquivo_url,
        nomeArquivo: row.nome_arquivo,
        updatedAt: row.updated_at,
      }));
    }

    return data.map(row => ({
      id: row.id,
      leadId: row.lead_id,
      codigoDoc: row.codigo_doc,
      titulo: row.titulo,
      descricao: row.descricao,
      obrigatorio: Boolean(row.obrigatorio),
      coletado: Boolean(row.coletado),
      statusAnalise: row.status_analise as any,
      motivoRejeicao: row.motivo_rejeicao,
      arquivoUrl: row.arquivo_url,
      nomeArquivo: row.nome_arquivo,
      updatedAt: row.updated_at,
    }));
  },

  async toggleColetado(itemId: string, coletado: boolean): Promise<void> {
    const { error } = await supabase
      .from('lead_checklist_items')
      .update({ 
        coletado,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      console.error('Error toggling coletado:', error);
      throw error;
    }
  },

  async updateStatusAnalise(
    itemId: string, 
    statusAnalise: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado',
    motivoRejeicao?: string
  ): Promise<void> {
    const payload: any = {
      status_analise: statusAnalise,
      updated_at: new Date().toISOString()
    };

    if (statusAnalise === 'rejeitado') {
      payload.motivo_rejeicao = motivoRejeicao || 'Documento reprovado pela assessoria';
    } else {
      payload.motivo_rejeicao = null;
    }

    const { error } = await supabase
      .from('lead_checklist_items')
      .update(payload)
      .eq('id', itemId);

    if (error) {
      console.error('Error updating status analise:', error);
      throw error;
    }
  },

  async uploadDocumentFile(leadId: string, itemId: string, file: File): Promise<string> {
    const fileName = `${leadId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos-leads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documentos-leads')
      .getPublicUrl(fileName);

    // Update checklist item with file details and mark as collected
    const { error: updateError } = await supabase
      .from('lead_checklist_items')
      .update({
        arquivo_url: publicUrl,
        nome_arquivo: file.name,
        coletado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error linking file to checklist item:', updateError);
      throw updateError;
    }

    return publicUrl;
  },

  generateWhatsAppPendingMessage(leadNome: string, items: ChecklistItem[]): string {
    const pendentes = items.filter(i => !i.coletado || i.statusAnalise === 'rejeitado');
    
    if (pendentes.length === 0) {
      return `Olá ${leadNome}! Sua pasta de documentos para análise de crédito da Caixa Econômica está completa. Obrigado!`;
    }

    let text = `Olá ${leadNome}! Tudo bem?\n\n`;
    text += `Sou da 3C Imobiliária. Para darmos andamento na sua aprovação de crédito junto à Caixa, ainda precisamos que você nos envie os seguintes itens:\n\n`;

    pendentes.forEach(item => {
      if (item.statusAnalise === 'rejeitado') {
        text += `❌ *${item.titulo}* (Reprovado: ${item.motivoRejeicao || 'Solicitar reenvio legível'})\n`;
      } else {
        text += `⏳ *${item.titulo}* (Pendente)\n`;
      }
    });

    text += `\nVocê pode me mandar as fotos ou arquivos por aqui mesmo!`;
    return text;
  }
};

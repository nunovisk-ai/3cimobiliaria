import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Empreendimento {
  id: string;
  nome: string;
  construtora: string;
  regiaoSp: string;
  enderecoPlantao: string;
  faixaPrecoDe: number;
  faixaPrecoAte?: number;
  linkBookPdf?: string;
  ativo: boolean;
  createdAt?: string;
}

export const empreendimentosService = {
  async getEmpreendimentos(): Promise<Empreendimento[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('empreendimentos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching empreendimentos:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      nome: row.nome,
      construtora: row.construtora,
      regiaoSp: row.regiao_sp,
      enderecoPlantao: row.endereco_plantao,
      faixaPrecoDe: Number(row.faixa_preco_de) || 0,
      faixaPrecoAte: Number(row.faixa_preco_ate) || undefined,
      linkBookPdf: row.link_book_pdf,
      ativo: Boolean(row.ativo),
      createdAt: row.created_at,
    }));
  },

  async createEmpreendimento(emp: Omit<Empreendimento, 'id' | 'createdAt' | 'ativo'>): Promise<Empreendimento> {
    const payload = {
      nome: emp.nome,
      construtora: emp.construtora,
      regiao_sp: emp.regiaoSp,
      endereco_plantao: emp.enderecoPlantao,
      faixa_preco_de: emp.faixaPrecoDe,
      faixa_preco_ate: emp.faixaPrecoAte || null,
      link_book_pdf: emp.linkBookPdf || null,
      ativo: true,
    };

    const { data, error } = await supabase
      .from('empreendimentos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating empreendimento:', error);
      throw error;
    }

    return {
      id: data.id,
      nome: data.nome,
      construtora: data.construtora,
      regiaoSp: data.regiao_sp,
      enderecoPlantao: data.endereco_plantao,
      faixaPrecoDe: Number(data.faixa_preco_de),
      faixaPrecoAte: Number(data.faixa_preco_ate) || undefined,
      linkBookPdf: data.link_book_pdf,
      ativo: data.ativo,
      createdAt: data.created_at,
    };
  }
};

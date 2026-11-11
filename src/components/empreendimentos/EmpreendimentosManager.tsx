import React, { useState } from 'react';
import { Empreendimento, empreendimentosService } from '../../services/empreendimentosService';
import { 
  Building2, 
  Plus, 
  MapPin, 
  ExternalLink, 
  Search, 
  X 
} from 'lucide-react';

interface EmpreendimentosManagerProps {
  empreendimentos: Empreendimento[];
  onRefresh: () => void;
}

export const EmpreendimentosManager: React.FC<EmpreendimentosManagerProps> = ({
  empreendimentos,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Development form state
  const [novoNome, setNovoNome] = useState('');
  const [novaConstrutora, setNovaConstrutora] = useState('');
  const [novaRegiao, setNovaRegiao] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novoPrecoDe, setNovoPrecoDe] = useState<number | ''>('');
  const [novoPrecoAte, setNovoPrecoAte] = useState<number | ''>('');
  const [novoLinkBook, setNovoLinkBook] = useState('');

  const filteredEmps = empreendimentos.filter(emp => 
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.construtora.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.regiaoSp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novaConstrutora.trim()) {
      alert('Nome e construtora são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await empreendimentosService.createEmpreendimento({
        nome: novoNome.trim(),
        construtora: novaConstrutora.trim(),
        regiaoSp: novaRegiao.trim() || 'São Paulo - SP',
        enderecoPlantao: novoEndereco.trim() || 'Plantão de Vendas - São Paulo, SP',
        faixaPrecoDe: Number(novoPrecoDe) || 0,
        faixaPrecoAte: Number(novoPrecoAte) || undefined,
        linkBookPdf: novoLinkBook.trim() || undefined
      });

      setIsModalOpen(false);
      // Reset form
      setNovoNome('');
      setNovaConstrutora('');
      setNovaRegiao('');
      setNovoEndereco('');
      setNovoPrecoDe('');
      setNovoPrecoAte('');
      setNovoLinkBook('');
      onRefresh();
    } catch (err) {
      console.error('Error creating empreendimento:', err);
      alert('Erro ao cadastrar empreendimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Catálogo de Empreendimentos</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-700 border border-orange-200">
              Site Oficial 3cimobiliaria.com.br
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Produtos parceiros do Grupo 3C em São Paulo (MCMV, Casa Paulista e Médio Padrão)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empreendimento ou construtora..."
              className="pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-64 shadow-2xs"
            />
          </div>

          {/* Add Button (Available to Manager / Admin) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Empreendimento</span>
          </button>
        </div>
      </div>

      {/* Grid of Developments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmps.map(emp => (
          <div 
            key={emp.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                  {emp.construtora}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {emp.faixaPrecoDe > 0 ? `A partir de R$ ${emp.faixaPrecoDe.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{emp.nome}</h3>
              
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                  <span>{emp.regiaoSp}</span>
                </p>
                <p className="text-[11px] text-slate-500 pl-5 leading-tight">
                  {emp.enderecoPlantao}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              {emp.linkBookPdf ? (
                <a
                  href={emp.linkBookPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Ver na 3c Imobiliária</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Sem link externo</span>
              )}

              <span className="text-[11px] text-slate-400 font-medium">
                Ativo no CRM
              </span>
            </div>
          </div>
        ))}

        {filteredEmps.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Nenhum empreendimento encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal: Cadastrar Novo Empreendimento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Cadastrar Novo Empreendimento</h3>
                  <p className="text-[11px] text-slate-400">Área Administrativa do Grupo 3C</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Empreendimento *</label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Reserva Tatuapé"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Construtora / Incorporadora *</label>
                  <input
                    type="text"
                    required
                    value={novaConstrutora}
                    onChange={(e) => setNovaConstrutora(e.target.value)}
                    placeholder="Ex: Cury, Cyrela, MRV"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro / Região em SP *</label>
                  <input
                    type="text"
                    required
                    value={novaRegiao}
                    onChange={(e) => setNovaRegiao(e.target.value)}
                    placeholder="Ex: Itaquera - Zona Leste"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Endereço do Plantão / Stand de Vendas</label>
                <input
                  type="text"
                  value={novoEndereco}
                  onChange={(e) => setNovoEndereco(e.target.value)}
                  placeholder="Ex: Av. Radial Leste, 2500 - Tatuapé, SP"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Inicial (R$)</label>
                  <input
                    type="number"
                    step="1000"
                    value={novoPrecoDe}
                    onChange={(e) => setNovoPrecoDe(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 220000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Máximo (R$)</label>
                  <input
                    type="number"
                    step="1000"
                    value={novoPrecoAte}
                    onChange={(e) => setNovoPrecoAte(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 340000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link do Book PDF ou Página Oficial</label>
                <input
                  type="url"
                  value={novoLinkBook}
                  onChange={(e) => setNovoLinkBook(e.target.value)}
                  placeholder="https://www.3cimobiliaria.com.br/nome-imovel"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Empreendimento'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

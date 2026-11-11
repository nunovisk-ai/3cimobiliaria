import React, { useState } from 'react';
import { Lead, FunnelStage } from '../../types';
import { Empreendimento } from '../../services/empreendimentosService';
import { LeadChecklistSection } from './LeadChecklistSection';
import { 
  X, 
  MessageSquare, 
  Calculator, 
  Trash2, 
  Save,
  FileCheck2,
  User
} from 'lucide-react';

interface LeadModalProps {
  lead: Lead;
  empreendimentos: Empreendimento[];
  onClose: () => void;
  onSave: (updated: Partial<Lead>) => Promise<void>;
  onDelete: (leadId: string) => Promise<void>;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  empreendimentos,
  onClose,
  onSave,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos'>('dados');

  const [formData, setFormData] = useState({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email || '',
    cpf: lead.cpf || '',
    dataNascimento: lead.dataNascimento || '',
    rendaMensal: lead.rendaMensal || 0,
    fgtsValor: lead.fgtsValor || 0,
    fgtsAprovado: lead.fgtsAprovado || false,
    empreendimentoInteresse: lead.empreendimentoInteresse || '',
    statusFunil: lead.statusFunil,
    observacoes: lead.observacoes || '',
    motivoRejeicaoCredito: lead.motivoRejeicaoCredito || '',
    observacaoRejeicao: lead.observacaoRejeicao || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Financial simulation calculations (Caixa / MCMV standards)
  const renda = Number(formData.rendaMensal) || 0;
  const fgts = Number(formData.fgtsValor) || 0;
  const parcelaMaxima = renda * 0.30;
  const financiadoEstimado = parcelaMaxima > 0 ? parcelaMaxima * 75 : 0;
  const poderCompraTotal = financiadoEstimado + fgts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        cpf: formData.cpf,
        dataNascimento: formData.dataNascimento,
        rendaMensal: Number(formData.rendaMensal),
        fgtsValor: Number(formData.fgtsValor),
        fgtsAprovado: formData.fgtsAprovado,
        empreendimentoInteresse: formData.empreendimentoInteresse,
        statusFunil: formData.statusFunil,
        observacoes: formData.observacoes,
        motivoRejeicaoCredito: formData.motivoRejeicaoCredito,
        observacaoRejeicao: formData.observacaoRejeicao
      });
      onClose();
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Erro ao salvar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRejection = async (motivo: string, obs: string) => {
    setFormData(prev => ({
      ...prev,
      motivoRejeicaoCredito: motivo,
      observacaoRejeicao: obs
    }));

    await onSave({
      motivoRejeicaoCredito: motivo,
      observacaoRejeicao: obs
    });
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir o lead "${lead.nome}"? Esta ação removerá o registro do banco de dados.`)) {
      setIsDeleting(true);
      try {
        await onDelete(lead.id);
        onClose();
      } catch (err) {
        console.error('Error deleting lead:', err);
        alert('Erro ao excluir lead.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const openWhatsApp = () => {
    const cleanPhone = formData.telefone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá ${formData.nome}! Sou o corretor da 3C Imobiliária.`);
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:px-8 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {formData.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{formData.nome}</h3>
                <span className="text-[10px] bg-orange-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Grupo 3C
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.telefone} • {formData.email || 'Sem e-mail'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chamar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Subtabs (Dados vs Checklist Documental) */}
        <div className="bg-slate-100 px-6 sm:px-8 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'dados'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Ficha do Lead & Simulação Caixa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'documentos'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Checklist Documental & Análise de Crédito</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {/* TAB 1: DADOS & SIMULAÇÃO */}
          {activeTab === 'dados' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Caixa Simulator Card */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50/30 p-5 rounded-2xl border border-orange-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
                    <Calculator className="w-4 h-4 text-brand-600" />
                    <span>Simulação Instantânea Caixa Econômica / MCMV</span>
                  </div>
                  <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-semibold">
                    Cálculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Renda Bruta</span>
                    <strong className="text-sm font-bold text-slate-900">
                      R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Saldo FGTS</span>
                    <strong className="text-sm font-bold text-emerald-600">
                      R$ {fgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Parcela Máx. (30%)</span>
                    <strong className="text-sm font-bold text-brand-600">
                      R$ {parcelaMaxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Poder de Compra</span>
                    <strong className="text-sm font-bold text-slate-900">
                      R$ {poderCompraTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Renda Bruta Mensal (R$)</label>
                  <input
                    type="number"
                    step="100"
                    value={formData.rendaMensal}
                    onChange={(e) => setFormData({ ...formData, rendaMensal: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saldo de FGTS (R$)</label>
                  <input
                    type="number"
                    step="500"
                    value={formData.fgtsValor}
                    onChange={(e) => setFormData({ ...formData, fgtsValor: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.fgtsAprovado}
                      onChange={(e) => setFormData({ ...formData, fgtsAprovado: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400"
                    />
                    <span className="font-semibold text-slate-700">FGTS Aprovado na Caixa</span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Etapa do Funil</label>
                  <select
                    value={formData.statusFunil}
                    onChange={(e) => setFormData({ ...formData, statusFunil: e.target.value as FunnelStage })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="novo_lead">📥 Novo Lead</option>
                    <option value="em_atendimento">💬 Em Atendimento</option>
                    <option value="visita_agendada">📅 Visita Agendada</option>
                    <option value="aguardando_docs">📑 Aguardando Documentação</option>
                    <option value="analise_credito">🔍 Análise de Crédito</option>
                    <option value="proposta">📝 Proposta & Negociação</option>
                    <option value="venda_fechada">🏆 Venda Fechada</option>
                    <option value="descartado">❌ Descartado</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Empreendimento de Interesse (3C Imobiliária)</label>
                  <select
                    value={formData.empreendimentoInteresse}
                    onChange={(e) => setFormData({ ...formData, empreendimentoInteresse: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="A definir">A definir / Em qualificação</option>
                    {empreendimentos.map(emp => (
                      <option key={emp.id} value={emp.nome}>
                        {emp.nome} ({emp.construtora} • {emp.regiaoSp})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Observações & Anotações de Atendimento</label>
                  <textarea
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Ex: Cliente tem preferência por andar alto com vaga. Possui dependente para aumentar subsídio..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Excluindo...' : 'Excluir Lead...'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: CHECKLIST DOCUMENTAL & ASSESSORIA CAIXA */}
          {activeTab === 'documentos' && (
            <LeadChecklistSection
              leadId={lead.id}
              leadNome={lead.nome}
              leadTelefone={lead.telefone}
              motivoRejeicaoCredito={formData.motivoRejeicaoCredito}
              observacaoRejeicao={formData.observacaoRejeicao}
              onUpdateRejection={handleUpdateRejection}
            />
          )}

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Lead, FunnelStage } from '../../types';
import { Empreendimento } from '../../services/empreendimentosService';
import { LeadChecklistSection } from './LeadChecklistSection';
import { 
  X, 
  Trash2, 
  Save,
  FileCheck2,
  User,
  Calendar,
  UserX,
  RotateCcw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { formatCPF, isValidCPF } from '../../utils/cpfValidator';
import { formatPhoneBR } from '../../utils/phoneMask';
import { ConfirmModal } from '../common/ConfirmModal';
import { CurrencyInput } from '../common/CurrencyInput';

interface LeadModalProps {
  lead: Lead;
  empreendimentos: Empreendimento[];
  onClose: () => void;
  onSave: (updated: Partial<Lead>) => Promise<void>;
  onDelete: (leadId: string) => Promise<void>;
  onScheduleVisit?: (lead: Lead) => void;
  onOpenChat?: (leadId: string) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  empreendimentos,
  onClose,
  onSave,
  onDelete,
  onScheduleVisit,
  onOpenChat
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
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'discard' | 'delete' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyField = (fieldKey: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const renda = Number(formData.rendaMensal) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cpf && !isValidCPF(formData.cpf)) {
      setCpfError('CPF inválido. Verifique os 11 dígitos ou deixe em branco.');
      alert('O CPF informado é inválido. Por favor, verifique os dígitos ou deixe o campo em branco (opcional).');
      return;
    }

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

  const handleDiscard = () => {
    setConfirmAction('discard');
  };

  const handleConfirmDiscard = async () => {
    setIsSaving(true);
    try {
      await onSave({ statusFunil: 'descartado' });
      setConfirmAction(null);
      onClose();
    } catch (err) {
      console.error('Error discarding lead:', err);
      alert('Erro ao descartar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async () => {
    setIsSaving(true);
    try {
      await onSave({ statusFunil: 'em_atendimento' });
      onClose();
    } catch (err) {
      console.error('Error reactivating lead:', err);
      alert('Erro ao reativar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setConfirmAction('delete');
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(lead.id);
      setConfirmAction(null);
      onClose();
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Erro ao excluir lead.');
    } finally {
      setIsDeleting(false);
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
            {onScheduleVisit && (
              <button
                type="button"
                onClick={() => {
                  onScheduleVisit(lead);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agendar Visita</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onOpenChat) {
                  onOpenChat(lead.id);
                  onClose();
                } else {
                  openWhatsApp();
                }
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Chat WhatsApp</span>
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
            <span>Ficha do Lead</span>
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
          
          {/* TAB 1: DADOS */}
          {activeTab === 'dados' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Caixa Simulator Card */}
              <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-orange-50/30 p-5 rounded-2xl border border-blue-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                      CEF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Simulador Habitacional Caixa Econômica
                        </h4>
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                          Oficial MCMV / SBPE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Acesse o simulador oficial da Caixa. Clique nos dados abaixo para copiar e colar no portal.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://simuladorhabitacao.caixa.gov.br/simulacao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all flex-shrink-0 cursor-pointer"
                  >
                    <span>Abrir Simulador da Caixa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Quick Copy Data Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* CPF */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-400 block font-medium">CPF do Lead</span>
                      <strong className="text-xs text-slate-800 font-mono truncate block">
                        {formData.cpf || 'Não informado'}
                      </strong>
                    </div>
                    {formData.cpf && (
                      <button
                        type="button"
                        onClick={() => handleCopyField('cpf', formData.cpf)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Copiar CPF"
                      >
                        {copiedField === 'cpf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Data Nascimento */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Nascimento</span>
                      <strong className="text-xs text-slate-800 truncate block">
                        {formData.dataNascimento
                          ? new Date(formData.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')
                          : 'Não informada'}
                      </strong>
                    </div>
                    {formData.dataNascimento && (
                      <button
                        type="button"
                        onClick={() => handleCopyField('nascimento', new Date(formData.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR'))}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Copiar Data de Nascimento"
                      >
                        {copiedField === 'nascimento' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Celular</span>
                      <strong className="text-xs text-slate-800 font-mono truncate block">
                        {formData.telefone || 'Não informado'}
                      </strong>
                    </div>
                    {formData.telefone && (
                      <button
                        type="button"
                        onClick={() => handleCopyField('telefone', formData.telefone)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Copiar Telefone"
                      >
                        {copiedField === 'telefone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Renda Bruta */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Renda Mensal</span>
                      <strong className="text-xs text-slate-800 truncate block">
                        R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    {renda > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyField('renda', renda.toFixed(2).replace('.', ','))}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Copiar Renda"
                      >
                        {copiedField === 'renda' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
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
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneBR(e.target.value) })}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">CPF</label>
                    <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.cpf}
                    onChange={(e) => {
                      const masked = formatCPF(e.target.value);
                      setFormData({ ...formData, cpf: masked });
                      if (masked && masked.replace(/\D/g, '').length === 11) {
                        if (!isValidCPF(masked)) {
                          setCpfError('CPF inválido. Verifique os dígitos.');
                        } else {
                          setCpfError(null);
                        }
                      } else {
                        setCpfError(null);
                      }
                    }}
                    onBlur={() => {
                      if (formData.cpf && !isValidCPF(formData.cpf)) {
                        setCpfError('CPF inválido. Verifique os dígitos.');
                      } else {
                        setCpfError(null);
                      }
                    }}
                    placeholder="000.000.000-00"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                      cpfError 
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30' 
                        : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                  {cpfError && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{cpfError}</p>
                  )}
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
                  <label className="block font-semibold text-slate-700 mb-1">Renda Bruta Mensal</label>
                  <CurrencyInput
                    value={formData.rendaMensal}
                    onChange={(val) => setFormData({ ...formData, rendaMensal: val })}
                    placeholder="0,00"
                    textColor="text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saldo de FGTS</label>
                  <CurrencyInput
                    value={formData.fgtsValor}
                    onChange={(val) => setFormData({ ...formData, fgtsValor: val })}
                    placeholder="0,00"
                    prefixColor="text-emerald-500"
                    textColor="text-emerald-600"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="novo_lead">Novo Lead</option>
                    <option value="em_atendimento">Em Atendimento</option>
                    <option value="visita_agendada">Visita Agendada</option>
                    <option value="aguardando_docs">Aguardando Documentação</option>
                    <option value="analise_credito">Análise de Crédito</option>
                    <option value="proposta">Proposta & Negociação</option>
                    <option value="venda_fechada">Venda Fechada</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Empreendimento de Interesse (3C Imobiliária)</label>
                  <select
                    value={formData.empreendimentoInteresse}
                    onChange={(e) => setFormData({ ...formData, empreendimentoInteresse: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value=""></option>
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
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {formData.statusFunil !== 'descartado' ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleDiscard}
                      className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Mover lead para a etapa Descartado"
                    >
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>Descartar Lead</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleReactivate}
                      className="px-3 py-1.5 text-xs text-brand-700 hover:text-brand-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reativar lead e mover para Em Atendimento"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brand-600" />
                      <span>Reativar Lead</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Excluindo...' : 'Excluir Lead'}</span>
                  </button>
                </div>

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

      {/* Custom Confirmation Modal: Discard Lead */}
      <ConfirmModal
        isOpen={confirmAction === 'discard'}
        title="Descartar Lead"
        description={`Deseja mover o lead "${lead.nome}" para a etapa de Descartados? O histórico e as informações do cliente continuarão salvos no CRM.`}
        confirmText="Sim, Descartar"
        cancelText="Voltar"
        variant="warning"
        isLoading={isSaving}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmDiscard}
      />

      {/* Custom Confirmation Modal: Delete Lead */}
      <ConfirmModal
        isOpen={confirmAction === 'delete'}
        title="Excluir Lead Permanentemente"
        description={`Tem certeza que deseja excluir o lead "${lead.nome}"? Esta ação removerá o registro e todas as mensagens do banco de dados.`}
        confirmText="Excluir Permanentemente"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

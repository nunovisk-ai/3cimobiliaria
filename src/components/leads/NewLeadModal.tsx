import React, { useState } from 'react';
import { Lead, FunnelStage } from '../../types';
import { Empreendimento } from '../../services/empreendimentosService';
import { X, UserPlus } from 'lucide-react';
import { formatCPF, isValidCPF } from '../../utils/cpfValidator';

interface NewLeadModalProps {
  empreendimentos: Empreendimento[];
  onClose: () => void;
  onCreate: (newLead: Partial<Lead>) => Promise<void>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  empreendimentos,
  onClose,
  onCreate
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [rendaMensal, setRendaMensal] = useState<number | ''>('');
  const [fgtsValor, setFgtsValor] = useState<number | ''>('');
  const [empreendimentoInteresse, setEmpreendimentoInteresse] = useState(
    empreendimentos.length > 0 ? empreendimentos[0].nome : 'Link Itaquera'
  );
  const [statusFunil, setStatusFunil] = useState<FunnelStage>('novo_lead');
  const [origemLead, setOrigemLead] = useState<'whatsapp' | 'zap' | 'meta' | 'google' | 'indicacao'>('whatsapp');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      alert('Nome e telefone são obrigatórios.');
      return;
    }

    if (cpf && !isValidCPF(cpf)) {
      setCpfError('CPF inválido. Verifique os dígitos ou deixe em branco.');
      alert('O CPF informado é inválido. Por favor, verifique os dígitos ou deixe o campo em branco (opcional).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        cpf: cpf.trim() || undefined,
        rendaMensal: Number(rendaMensal) || 0,
        fgtsValor: Number(fgtsValor) || 0,
        empreendimentoInteresse,
        statusFunil,
        origemLead,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error creating lead:', err);
      alert('Erro ao cadastrar lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cadastrar Novo Lead</h3>
              <p className="text-[11px] text-slate-400">Grupo 3C Imobiliária</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Juliana Mendes"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone WhatsApp *</label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">CPF</label>
              <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
            </div>
            <input
              type="text"
              maxLength={14}
              value={cpf}
              onChange={(e) => {
                const masked = formatCPF(e.target.value);
                setCpf(masked);
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
                if (cpf && !isValidCPF(cpf)) {
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renda Bruta (R$)</label>
              <input
                type="number"
                step="100"
                value={rendaMensal}
                onChange={(e) => setRendaMensal(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 5000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Saldo FGTS (R$)</label>
              <input
                type="number"
                step="500"
                value={fgtsValor}
                onChange={(e) => setFgtsValor(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 25000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Empreendimento de Interesse</label>
            <select
              value={empreendimentoInteresse}
              onChange={(e) => setEmpreendimentoInteresse(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="A definir">A definir / Em qualificação</option>
              {empreendimentos.map(emp => (
                <option key={emp.id} value={emp.nome}>
                  {emp.nome} ({emp.construtora} • {emp.regiaoSp})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Origem do Lead</label>
              <select
                value={origemLead}
                onChange={(e) => setOrigemLead(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="whatsapp">WhatsApp Direto</option>
                <option value="zap">Portal Zap / VivaReal</option>
                <option value="meta">Anúncio Meta (Instagram/Facebook)</option>
                <option value="google">Google Ads</option>
                <option value="indicacao">Indicação de Cliente</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Etapa Inicial</label>
              <select
                value={statusFunil}
                onChange={(e) => setStatusFunil(e.target.value as FunnelStage)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="novo_lead">Novo Lead</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="visita_agendada">Visita Agendada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais do lead..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Lead'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ChecklistItem } from '../../types';
import { documentsService, CREDIT_REJECTION_REASONS } from '../../services/documentsService';
import { 
  AlertCircle, 
  FileText, 
  Upload, 
  ExternalLink, 
  Copy, 
  ShieldAlert,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface LeadChecklistSectionProps {
  leadId: string;
  leadNome: string;
  leadTelefone: string;
  motivoRejeicaoCredito?: string;
  observacaoRejeicao?: string;
  onUpdateRejection: (motivo: string, obs: string) => Promise<void>;
}

export const LeadChecklistSection: React.FC<LeadChecklistSectionProps> = ({
  leadId,
  leadNome,
  leadTelefone,
  motivoRejeicaoCredito,
  observacaoRejeicao,
  onUpdateRejection
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [editingRejectionItemId, setEditingRejectionItemId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Credit rejection state for the whole lead
  const [selectedCreditReason, setSelectedCreditReason] = useState(motivoRejeicaoCredito || '');
  const [creditObs, setCreditObs] = useState(observacaoRejeicao || '');
  const [isSavingRejection, setIsSavingRejection] = useState(false);

  const loadChecklist = async () => {
    setIsLoading(true);
    try {
      const data = await documentsService.getChecklist(leadId);
      setItems(data);
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, [leadId]);

  const handleToggleColetado = async (item: ChecklistItem) => {
    const novoValor = !item.coletado;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, coletado: novoValor } : i));
    try {
      await documentsService.toggleColetado(item.id, novoValor);
    } catch (err) {
      console.error('Failed to toggle coletado:', err);
      loadChecklist();
    }
  };

  const handleStatusAnaliseChange = async (
    item: ChecklistItem, 
    newStatus: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'
  ) => {
    if (newStatus === 'rejeitado') {
      setEditingRejectionItemId(item.id);
      setRejectionReasonInput(item.motivoRejeicao || '');
      return;
    }

    setItems(prev => prev.map(i => i.id === item.id ? { 
      ...i, 
      statusAnalise: newStatus,
      motivoRejeicao: undefined
    } : i));

    try {
      await documentsService.updateStatusAnalise(item.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      loadChecklist();
    }
  };

  const handleSaveRejectionReason = async (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? {
      ...i,
      statusAnalise: 'rejeitado',
      motivoRejeicao: rejectionReasonInput.trim() || 'Documento recusado pela assessoria'
    } : i));

    try {
      await documentsService.updateStatusAnalise(itemId, 'rejeitado', rejectionReasonInput.trim());
      setEditingRejectionItemId(null);
    } catch (err) {
      console.error('Failed to save rejection reason:', err);
      loadChecklist();
    }
  };

  const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItemId(itemId);
    try {
      await documentsService.uploadDocumentFile(leadId, itemId, file);
      await loadChecklist();
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Erro ao fazer upload do documento.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleCopyWhatsAppMessage = () => {
    const text = documentsService.generateWhatsAppPendingMessage(leadNome, items);
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(documentsService.generateWhatsAppPendingMessage(leadNome, items));
    const cleanPhone = leadTelefone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  const handleSaveLeadCreditRejection = async () => {
    setIsSavingRejection(true);
    try {
      await onUpdateRejection(selectedCreditReason, creditObs);
      alert('Motivo de rejeição salvo com sucesso!');
    } catch (err) {
      console.error('Error saving credit rejection:', err);
      alert('Erro ao salvar motivo de rejeição.');
    } finally {
      setIsSavingRejection(false);
    }
  };

  const totalItems = items.length;
  const coletadosCount = items.filter(i => i.coletado).length;
  const aprovadosCount = items.filter(i => i.statusAnalise === 'aprovado').length;
  const rejeitadosCount = items.filter(i => i.statusAnalise === 'rejeitado').length;
  const percentualColetado = totalItems > 0 ? Math.round((coletadosCount / totalItems) * 100) : 0;

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        Carregando checklist de documentos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Progress & WhatsApp Quick Actions Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Checklist de Documentos (Caixa Econômica)
            </h4>

            {/* Badges row with nowrap */}
            <div className="flex items-center flex-wrap gap-2 pt-0.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 whitespace-nowrap flex-shrink-0">
                {coletadosCount} de {totalItems} Coletados
              </span>
              {aprovadosCount > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap flex-shrink-0">
                  {aprovadosCount} Aprovados
                </span>
              )}
              {rejeitadosCount > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{rejeitadosCount} Pendente(s) de Correção</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Marque o que o cliente já entregou e acompanhe o parecer da assessoria de crédito
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyWhatsAppMessage}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedMessage ? 'Copiado!' : 'Copiar Pendências'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Cobrar no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex">
          <div 
            className="bg-brand-500 h-full transition-all duration-300"
            style={{ width: `${percentualColetado}%` }}
          />
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              item.statusAnalise === 'rejeitado'
                ? 'bg-rose-50/40 border-rose-200'
                : item.statusAnalise === 'aprovado'
                ? 'bg-emerald-50/20 border-emerald-200/80'
                : item.coletado
                ? 'bg-white border-slate-200 shadow-2xs'
                : 'bg-white border-slate-200/70 opacity-90'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Checkbox and Document Title */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.coletado}
                  onChange={() => handleToggleColetado(item)}
                  className="w-5 h-5 rounded-lg text-brand-500 border-slate-300 focus:ring-brand-400 mt-0.5 cursor-pointer"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h5 className={`text-xs font-bold ${item.coletado ? 'text-slate-900' : 'text-slate-600'}`}>
                      {item.titulo}
                    </h5>
                    {item.obrigatorio ? (
                      <span className="text-[9px] font-semibold text-brand-600 bg-orange-50 px-1.5 py-0.2 rounded">
                        Obrigatório
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">Opcional</span>
                    )}
                  </div>
                  {item.descricao && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.descricao}</p>
                  )}
                  {item.nomeArquivo && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>{item.nomeArquivo}</span>
                      </span>
                      {item.arquivoUrl && (
                        <a 
                          href={item.arquivoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selector & Optional Upload */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                
                {/* Status Analise Selector */}
                <select
                  value={item.statusAnalise}
                  onChange={(e) => handleStatusAnaliseChange(item, e.target.value as any)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${
                    item.statusAnalise === 'aprovado'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : item.statusAnalise === 'rejeitado'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : item.statusAnalise === 'em_analise'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="pendente">Pendente Coleta</option>
                  <option value="em_analise">Em Análise Caixa</option>
                  <option value="aprovado">Aprovado Caixa</option>
                  <option value="rejeitado">Rejeitado / Pendência</option>
                </select>

                {/* Optional File Upload button */}
                <label className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 px-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span className="text-[11px] font-medium">
                    {uploadingItemId === item.id ? 'Subindo...' : item.arquivoUrl ? 'Trocar' : 'Anexar (Opcional)'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(item.id, e)}
                  />
                </label>

              </div>

            </div>

            {/* Rejection reason inline box */}
            {item.statusAnalise === 'rejeitado' && editingRejectionItemId !== item.id && (
              <div className="mt-2.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-500" />
                  <p>
                    <strong>Motivo da Recusa:</strong> {item.motivoRejeicao || 'Documento ilegível ou vencido.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRejectionItemId(item.id);
                    setRejectionReasonInput(item.motivoRejeicao || '');
                  }}
                  className="text-[10px] text-rose-700 font-semibold hover:underline flex-shrink-0"
                >
                  Editar Motivo
                </button>
              </div>
            )}

            {/* Editing rejection reason modal / inline form */}
            {editingRejectionItemId === item.id && (
              <div className="mt-2.5 p-3 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-rose-900">
                  Por que este documento foi rejeitado pela assessoria?
                </label>
                <input
                  type="text"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ex: Holerite cortado na margem inferior. Falta carimbo de admissão."
                  className="w-full p-2 text-xs bg-rose-50/50 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingRejectionItemId(null)}
                    className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveRejectionReason(item.id)}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700"
                  >
                    Salvar Recusa
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Credit Rejection Section (Assessoria Caixa Geral) */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Motivo de Rejeição de Crédito da Assessoria (Geral)
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Se o financiamento do cliente for reprovado no banco, selecione o motivo abaixo para alimentar o histórico de vendas e direcionar o corretor sobre os próximos passos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motivo Principal</label>
            <select
              value={selectedCreditReason}
              onChange={(e) => setSelectedCreditReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-800"
            >
              <option value="">Selecione o motivo (se reprovado)...</option>
              {CREDIT_REJECTION_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observações da Assessoria</label>
            <input
              type="text"
              value={creditObs}
              onChange={(e) => setCreditObs(e.target.value)}
              placeholder="Ex: Quitar dívida de R$ 500 no Serasa e reapresentar em 30 dias..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-800"
            />
          </div>
        </div>

        {selectedCreditReason && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isSavingRejection}
              onClick={handleSaveLeadCreditRejection}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {isSavingRejection ? 'Salvando...' : 'Salvar Motivo de Reprovação'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

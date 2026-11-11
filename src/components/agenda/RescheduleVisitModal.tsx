import React, { useState } from 'react';
import { Visit } from '../../types';
import { visitsService } from '../../services/visitsService';
import { 
  Calendar, 
  RotateCw, 
  X, 
  AlertCircle,
  CalendarCheck
} from 'lucide-react';

interface RescheduleVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  'Cliente pediu para reagendar',
  'Imprevisto familiar ou pessoal do cliente',
  'Imprevisto no trabalho / escala de plantão',
  'Chuva forte ou trânsito intenso em São Paulo',
  'Cliente não compareceu e não atendeu ligação/WhatsApp',
  'Cliente optou por outro projeto / desistiu',
  'Outro motivo'
];

export const RescheduleVisitModal: React.FC<RescheduleVisitModalProps> = ({
  visit,
  onClose,
  onSuccess
}) => {
  const [actionType, setActionType] = useState<'reagendar' | 'registrar_falta'>('reagendar');
  const [selectedReason, setSelectedReason] = useState<string>(REASONS[0]);
  const [novaDataHora, setNovaDataHora] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default new date to next Saturday 10:00 AM
  React.useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setNovaDataHora(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (actionType === 'reagendar') {
        if (!novaDataHora) {
          alert('Por favor informe a nova data e horário para reagendamento.');
          setIsSubmitting(false);
          return;
        }
        const obsFormatada = `[Reagendado em ${new Date().toLocaleDateString('pt-BR')} - Motivo: ${selectedReason}] ${observacoes || ''}`.trim();
        await visitsService.rescheduleVisit(visit.id, new Date(novaDataHora).toISOString(), obsFormatada);
      } else {
        // Registrar falta sem reagendar
        await visitsService.updateVisitOutcome(visit.id, false, selectedReason);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao processar reagendamento:', err);
      alert('Falha ao processar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <RotateCw className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="text-base font-bold">Desfecho / Reagendar Visita</h3>
              <p className="text-xs text-amber-100">
                {visit.leadNome} • {visit.empreendimentoNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Action Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActionType('reagendar')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionType === 'reagendar'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Reagendar Nova Data</span>
            </button>
            <button
              type="button"
              onClick={() => setActionType('registrar_falta')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionType === 'registrar_falta'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Registrar Não Compareceu</span>
            </button>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Motivo do Reagendamento ou Não Comparecimento:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 cursor-pointer"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* New Date and Time (if rescheduling) */}
          {actionType === 'reagendar' && (
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-2">
              <label className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>Nova Data e Horário da Visita:</span>
              </label>
              <input
                type="datetime-local"
                value={novaDataHora}
                onChange={(e) => setNovaDataHora(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
              <p className="text-[10px] text-slate-500">
                A visita será atualizada no sistema e você poderá gerar um novo link de calendário ou confirmação no WhatsApp.
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Observações adicionais (opcional):
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Ex: Cliente estava preso no trânsito na Radial Leste, combinamos de nos ver sábado às 10h."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                actionType === 'reagendar'
                  ? 'bg-brand-500 hover:bg-brand-600'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{actionType === 'reagendar' ? 'Confirmar Reagendamento' : 'Registrar Não Compareceu'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

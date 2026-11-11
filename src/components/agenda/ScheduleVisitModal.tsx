import React, { useState, useEffect } from 'react';
import { Lead, Visit } from '../../types';
import { Empreendimento } from '../../services/empreendimentosService';
import { visitsService } from '../../services/visitsService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  User, 
  X, 
  ExternalLink,
  Download,
  CheckCircle2
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface ScheduleVisitModalProps {
  lead?: Lead | null;
  leads?: Lead[];
  empreendimentos: Empreendimento[];
  onClose: () => void;
  onSuccess: (createdVisit: Visit) => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  lead,
  leads = [],
  empreendimentos,
  onClose,
  onSuccess
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(lead?.id || (leads[0]?.id || ''));
  const [selectedEmpNome, setSelectedEmpNome] = useState<string>(
    lead?.empreendimentoInteresse && lead.empreendimentoInteresse !== 'A definir'
      ? lead.empreendimentoInteresse
      : (empreendimentos[0]?.nome || '')
  );
  const [enderecoPlantao, setEnderecoPlantao] = useState<string>('');
  const [dataVisita, setDataVisita] = useState<string>('');
  const [horaVisita, setHoraVisita] = useState<string>('10:00');
  const [observacoes, setObservacoes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<Visit | null>(null);

  // Today for date input min constraint
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize address based on selected development
  useEffect(() => {
    const matchedEmp = empreendimentos.find(e => e.nome === selectedEmpNome);
    if (matchedEmp?.enderecoPlantao) {
      setEnderecoPlantao(matchedEmp.enderecoPlantao);
    }
  }, [selectedEmpNome, empreendimentos]);

  // Set default date to tomorrow and time to 10:00 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setDataVisita(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
    setHoraVisita('10:00');
  }, []);

  const currentLead = lead || leads.find(l => l.id === selectedLeadId);

  const handleEmpChange = (empNome: string) => {
    setSelectedEmpNome(empNome);
    const found = empreendimentos.find(e => e.nome === empNome);
    if (found?.enderecoPlantao) {
      setEnderecoPlantao(found.enderecoPlantao);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      alert('Selecione um lead.');
      return;
    }
    if (!dataVisita || !horaVisita) {
      alert('Informe a data e o horário da visita.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataHoraIso = new Date(`${dataVisita}T${horaVisita}:00`).toISOString();
      const visit = await visitsService.createVisit({
        leadId: selectedLeadId,
        empreendimentoNome: selectedEmpNome,
        enderecoPlantao: enderecoPlantao,
        dataHora: dataHoraIso,
        observacoes: observacoes || undefined,
      });

      setCreatedVisit(visit);
      onSuccess(visit);
    } catch (err: any) {
      console.error('Erro ao agendar visita:', err);
      alert('Falha ao agendar visita: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    if (!createdVisit) return;
    const msg = visitsService.getWhatsAppConfirmationMessage(createdVisit);
    const cleanPhone = (createdVisit.leadTelefone || currentLead?.telefone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {createdVisit ? 'Visita Agendada com Sucesso!' : 'Agendar Visita ao Plantão'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {createdVisit ? 'Sincronize com a sua agenda ou envie confirmação no WhatsApp' : 'Reserve o horário no estande para apresentar o decorado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdVisit ? (
            /* SUCCESS VIEW WITH SYNC OPTIONS */
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Agendamento confirmado para {new Date(createdVisit.dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>{createdVisit.leadNome}</strong> • {createdVisit.empreendimentoNome}
                </p>
                {createdVisit.enderecoPlantao && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    <span>{createdVisit.enderecoPlantao}</span>
                  </p>
                )}
              </div>

              {/* Sync Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                
                {/* 1. Google Calendar */}
                <a
                  href={visitsService.getGoogleCalendarUrl(createdVisit)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    <Calendar className="w-4 h-4 text-brand-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600 flex items-center gap-1">
                    Google Agenda <ExternalLink className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-[10px] text-slate-400">Salvar no Google</span>
                </a>

                {/* 2. Apple Calendar (.ics) */}
                <button
                  onClick={() => visitsService.downloadIcsFile(createdVisit)}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 flex items-center gap-1">
                    Apple Calendar <Download className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-[10px] text-slate-400">iPhone / iCloud (.ics)</span>
                </button>

                {/* 3. Send WhatsApp Confirmation */}
                <button
                  onClick={openWhatsAppConfirmation}
                  className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    Confirmar no WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-600">Enviar lembrete e mapa</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Concluir e Voltar
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Lead Selector or Display */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cliente / Lead</span>
                </label>
                {lead ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{lead.nome}</h4>
                      <p className="text-[11px] text-slate-500">{lead.telefone} {lead.email ? `• ${lead.email}` : ''}</p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 cursor-pointer"
                  >
                    <option value="" disabled>Selecione o lead...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nome} ({l.telefone}) - {l.empreendimentoInteresse}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Empreendimento Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Empreendimento a ser visitado</span>
                </label>
                <select
                  value={selectedEmpNome}
                  onChange={(e) => handleEmpChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 cursor-pointer font-medium"
                >
                  {empreendimentos.map(emp => (
                    <option key={emp.id} value={emp.nome}>
                      {emp.nome} ({emp.regiaoSp})
                    </option>
                  ))}
                  {/* Fallback option if lead has custom interest */}
                  {selectedEmpNome && !empreendimentos.some(e => e.nome === selectedEmpNome) && (
                    <option value={selectedEmpNome}>{selectedEmpNome}</option>
                  )}
                </select>
              </div>

              {/* Stand / Plantão Address */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Endereço do Plantão / Ponto de Encontro</span>
                </label>
                <input
                  type="text"
                  value={enderecoPlantao}
                  onChange={(e) => setEnderecoPlantao(e.target.value)}
                  placeholder="Ex: Av. Itaquera, 2400 - Itaquera, SP"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                />
              </div>

              {/* Data e Horário (Clean Executive Date & Time Selectors) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" />
                    <span>Data da Visita *</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={dataVisita}
                    onChange={(e) => setDataVisita(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 font-medium cursor-pointer shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    <span>Horário da Visita *</span>
                  </label>
                  <select
                    value={horaVisita}
                    onChange={(e) => setHoraVisita(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="11:00">11:00</option>
                    <option value="11:30">11:30</option>
                    <option value="12:00">12:00</option>
                    <option value="12:30">12:30</option>
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                    <option value="14:30">14:30</option>
                    <option value="15:00">15:00</option>
                    <option value="15:30">15:30</option>
                    <option value="16:00">16:00</option>
                    <option value="16:30">16:30</option>
                    <option value="17:00">17:00</option>
                    <option value="17:30">17:30</option>
                    <option value="18:00">18:00</option>
                    <option value="18:30">18:30</option>
                    <option value="19:00">19:00</option>
                    <option value="19:30">19:30</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Observações para a Visita (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Cliente quer ver planta de 2 dormitórios com vaga. Trazer cópia dos holerites."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 resize-none"
                />
              </div>

              {/* Action Buttons */}
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
                  className="px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

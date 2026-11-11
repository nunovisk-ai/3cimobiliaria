import React, { useState, useEffect } from 'react';
import { Visit, Lead } from '../../types';
import { Empreendimento } from '../../services/empreendimentosService';
import { visitsService } from '../../services/visitsService';
import { ScheduleVisitModal } from './ScheduleVisitModal';
import { RescheduleVisitModal } from './RescheduleVisitModal';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  RotateCw, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  CalendarDays,
  Calendar,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface AgendaViewProps {
  leads: Lead[];
  empreendimentos: Empreendimento[];
  onSelectLead?: (lead: Lead) => void;
  onLeadStatusChanged?: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  leads,
  empreendimentos,
  onSelectLead,
  onLeadStatusChanged
}) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterEmp, setSelectedFilterEmp] = useState('all');
  const [activeTab, setActiveTab] = useState<'proximas' | 'aguardando_baixa' | 'realizadas' | 'nao_compareceu' | 'todas'>('proximas');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleTargetVisit, setRescheduleTargetVisit] = useState<Visit | null>(null);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const data = await visitsService.getVisits();
      setVisits(data);
    } catch (err) {
      console.error('Falha ao carregar visitas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const now = new Date();

  // Categorize visits
  const proximasVisitas = visits.filter(v => v.realizada === null && new Date(v.dataHora) >= now);
  const aguardandoBaixa = visits.filter(v => v.realizada === null && new Date(v.dataHora) < now);
  const realizadasVisitas = visits.filter(v => v.realizada === true);
  const naoCompareceuVisitas = visits.filter(v => v.realizada === false);

  // Filter visits based on active tab and search/filter
  const getFilteredVisits = () => {
    let list: Visit[] = [];
    if (activeTab === 'proximas') list = proximasVisitas;
    else if (activeTab === 'aguardando_baixa') list = aguardandoBaixa;
    else if (activeTab === 'realizadas') list = realizadasVisitas;
    else if (activeTab === 'nao_compareceu') list = naoCompareceuVisitas;
    else list = visits;

    return list.filter(v => {
      const matchesSearch = 
        (v.leadNome && v.leadNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.leadTelefone && v.leadTelefone.includes(searchTerm)) ||
        (v.empreendimentoNome && v.empreendimentoNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.enderecoPlantao && v.enderecoPlantao.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesEmp = selectedFilterEmp === 'all' || v.empreendimentoNome === selectedFilterEmp;

      return matchesSearch && matchesEmp;
    });
  };

  const filteredVisits = getFilteredVisits();

  // Mark visit as completed
  const handleMarkRealizada = async (visit: Visit) => {
    try {
      await visitsService.updateVisitOutcome(visit.id, true);
      await loadVisits();
      if (onLeadStatusChanged) onLeadStatusChanged();
    } catch (err) {
      console.error('Erro ao marcar visita como realizada:', err);
      alert('Erro ao atualizar status da visita.');
    }
  };

  // Open WhatsApp with confirmation
  const handleOpenWhatsApp = (visit: Visit) => {
    const msg = visitsService.getWhatsAppConfirmationMessage(visit);
    const cleanPhone = (visit.leadTelefone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Agenda de Visitas ao Plantão</h2>
              <p className="text-xs text-slate-500">
                Acompanhe as visitas aos estandes, envie confirmações e sincronize com o calendário do corretor
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVisits}
            title="Atualizar agenda"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-purple-600 rounded-2xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-xs shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Nova Visita</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* 1. Próximas Visitas */}
        <div 
          onClick={() => setActiveTab('proximas')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'proximas'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Próximas Visitas</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <CalendarDays className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{proximasVisitas.length}</p>
          <span className="text-[10px] text-purple-700 font-medium">Nos próximos dias</span>
        </div>

        {/* 2. Aguardando Baixa (Atenção) */}
        <div 
          onClick={() => setActiveTab('aguardando_baixa')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'aguardando_baixa'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200 shadow-2xs'
          }`}
        >
          {aguardandoBaixa.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aguardando Baixa</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{aguardandoBaixa.length}</p>
          <span className={`text-[10px] font-semibold ${aguardandoBaixa.length > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {aguardandoBaixa.length > 0 ? '⚠️ Horário expirou! Dar baixa' : 'Tudo em dia'}
          </span>
        </div>

        {/* 3. Realizadas */}
        <div 
          onClick={() => setActiveTab('realizadas')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'realizadas'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Visitas Realizadas</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{realizadasVisitas.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Clientes no estande</span>
        </div>

        {/* 4. Não Compareceu / Reagendar */}
        <div 
          onClick={() => setActiveTab('nao_compareceu')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'nao_compareceu'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Não Compareceu</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{naoCompareceuVisitas.length}</p>
          <span className="text-[10px] text-rose-700 font-medium">Faltou ou reagendada</span>
        </div>

      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('proximas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'proximas'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Próximas ({proximasVisitas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('aguardando_baixa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'aguardando_baixa'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>⏳ Aguardando Baixa</span>
            {aguardandoBaixa.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'aguardando_baixa' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {aguardandoBaixa.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('realizadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'realizadas'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ✅ Realizadas ({realizadasVisitas.length})
          </button>

          <button
            onClick={() => setActiveTab('nao_compareceu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'nao_compareceu'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ❌ Não Compareceu ({naoCompareceuVisitas.length})
          </button>

          <button
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'todas'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas ({visits.length})
          </button>
        </div>

        {/* Search & Empreendimento Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente ou estande..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800"
            />
          </div>

          <div className="relative">
            <select
              value={selectedFilterEmp}
              onChange={(e) => setSelectedFilterEmp(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-700 cursor-pointer"
            >
              <option value="all">Todos os Estandes</option>
              {empreendimentos.map(emp => (
                <option key={emp.id} value={emp.nome}>{emp.nome}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Visits List */}
      <div className="space-y-3.5">
        {isLoading ? (
          /* Skeleton Screen for Visits List */
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse shadow-2xs">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-44" />
                    <div className="h-3 bg-slate-100 rounded w-64" />
                    <div className="h-3 bg-slate-100 rounded w-36" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                  <div className="h-9 w-24 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredVisits.map(visit => {
          const visitDate = new Date(visit.dataHora);
          const isPast = visitDate < now;
          const isPendingOutcome = visit.realizada === null && isPast;

          // Find lead object if available
          const leadObj = leads.find(l => l.id === visit.leadId);

          return (
            <div
              key={visit.id}
              className={`bg-white rounded-3xl border transition-all shadow-2xs hover:shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isPendingOutcome
                  ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                  : visit.realizada === true
                  ? 'border-emerald-200/80'
                  : visit.realizada === false
                  ? 'border-rose-200/80 bg-rose-50/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Left Column: Date & Time Box */}
              <div className="flex items-start sm:items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 text-center shadow-xs ${
                  visit.realizada === true
                    ? 'bg-emerald-500 text-white'
                    : visit.realizada === false
                    ? 'bg-rose-500 text-white'
                    : isPendingOutcome
                    ? 'bg-amber-500 text-white'
                    : 'bg-purple-600 text-white'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                    {visitDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                  <span className="text-xl font-black leading-none my-0.5">
                    {visitDate.getDate()}
                  </span>
                  <span className="text-[10px] font-semibold opacity-90">
                    {visitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Details Column */}
                <div className="space-y-1">
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {visit.realizada === true && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Visita Realizada
                      </span>
                    )}
                    {visit.realizada === false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Não Compareceu
                      </span>
                    )}
                    {visit.realizada === null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isPendingOutcome
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {isPendingOutcome ? 'Aguardando Desfecho' : 'Agendada'}
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      {visitDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                  </div>

                  {/* Lead Name & Phone */}
                  <div className="flex items-center gap-2">
                    <h3 
                      onClick={() => leadObj && onSelectLead && onSelectLead(leadObj)}
                      className={`text-sm font-bold text-slate-900 ${leadObj && onSelectLead ? 'hover:text-purple-600 cursor-pointer underline-offset-2 hover:underline' : ''}`}
                    >
                      {visit.leadNome}
                    </h3>
                    {visit.leadTelefone && (
                      <span className="text-xs text-slate-500 font-medium">
                        • {visit.leadTelefone}
                      </span>
                    )}
                  </div>

                  {/* Empreendimento & Stand Address */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-brand-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-brand-500" />
                      <span>{visit.empreendimentoNome}</span>
                    </span>

                    {visit.enderecoPlantao && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(visit.enderecoPlantao)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-xs">{visit.enderecoPlantao}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Observações / Non-attendance reason */}
                  {visit.motivoNaoComparecimento && (
                    <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg mt-1 inline-block">
                      <strong>Motivo:</strong> {visit.motivoNaoComparecimento}
                    </p>
                  )}

                  {visit.observacoes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      "{visit.observacoes}"
                    </p>
                  )}

                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                
                {/* CASE 1: Past visit needing outcome confirmation */}
                {isPendingOutcome ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleMarkRealizada(visit)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Visita Realizada</span>
                    </button>

                    <button
                      onClick={() => setRescheduleTargetVisit(visit)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Reagendar / Falta</span>
                    </button>
                  </div>
                ) : (
                  /* CASE 2: Normal visit actions */
                  <div className="flex items-center gap-1.5 flex-wrap">
                    
                    {/* WhatsApp Confirmation */}
                    <button
                      onClick={() => handleOpenWhatsApp(visit)}
                      title="Enviar confirmação e localização no WhatsApp"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Google Calendar Link */}
                    <a
                      href={visitsService.getGoogleCalendarUrl(visit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Adicionar à Google Agenda"
                      className="p-2 bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span className="hidden lg:inline text-[11px]">Google</span>
                    </a>

                    {/* Apple Calendar Download */}
                    <button
                      onClick={() => visitsService.downloadIcsFile(visit)}
                      title="Baixar evento para Apple Calendar / iCloud (.ics)"
                      className="p-2 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden lg:inline text-[11px]">Apple</span>
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Reagendar button */}
                    <button
                      onClick={() => setRescheduleTargetVisit(visit)}
                      title="Reagendar horário da visita"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-slate-500" />
                      <span>Reagendar</span>
                    </button>

                    {/* Direct mark as realizada if upcoming */}
                    {visit.realizada === null && (
                      <button
                        onClick={() => handleMarkRealizada(visit)}
                        title="Marcar como realizada"
                        className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredVisits.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Nenhuma visita encontrada nesta categoria
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Agende visitas aos estandes com seus clientes para apresentar apartamentos decorados e fechar propostas.
              </p>
            </div>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Agendar Primeira Visita
            </button>
          </div>
        )}
      </>
    )}
  </div>

      {/* Modal: Schedule New Visit */}
      {isScheduleModalOpen && (
        <ScheduleVisitModal
          leads={leads}
          empreendimentos={empreendimentos}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={() => {
            loadVisits();
            if (onLeadStatusChanged) onLeadStatusChanged();
          }}
        />
      )}

      {/* Modal: Reschedule / Outcome */}
      {rescheduleTargetVisit && (
        <RescheduleVisitModal
          visit={rescheduleTargetVisit}
          onClose={() => setRescheduleTargetVisit(null)}
          onSuccess={() => {
            loadVisits();
            if (onLeadStatusChanged) onLeadStatusChanged();
          }}
        />
      )}

    </div>
  );
};

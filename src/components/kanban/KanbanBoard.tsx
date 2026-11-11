import React, { useState } from 'react';
import { Lead, FunnelStage } from '../../types';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Building2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLead: (lead: Lead) => void;
  onNewLead: () => void;
  onMoveLead: (leadId: string, newStatus: FunnelStage) => void;
}

interface ColumnConfig {
  id: FunnelStage;
  title: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'novo_lead',
    title: 'Novo Lead',
    color: 'border-blue-200',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'em_atendimento',
    title: 'Em Atendimento',
    color: 'border-orange-200',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-brand-700',
    dotColor: 'bg-brand-500'
  },
  {
    id: 'visita_agendada',
    title: 'Visita Agendada',
    color: 'border-purple-200',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    dotColor: 'bg-purple-500'
  },
  {
    id: 'aguardando_docs',
    title: 'Aguardando Docs',
    color: 'border-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'analise_credito',
    title: 'Análise de Crédito',
    color: 'border-cyan-200',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    dotColor: 'bg-cyan-500'
  },
  {
    id: 'proposta',
    title: 'Proposta',
    color: 'border-indigo-200',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    dotColor: 'bg-indigo-500'
  },
  {
    id: 'venda_fechada',
    title: 'Venda Fechada 🏆',
    color: 'border-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'descartado',
    title: 'Descartado',
    color: 'border-slate-200',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    dotColor: 'bg-slate-400'
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  isLoading,
  onRefresh,
  onSelectLead,
  onNewLead,
  onMoveLead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterEmp, setSelectedFilterEmp] = useState('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Filter leads based on search and development
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      (lead.cpf && lead.cpf.includes(searchTerm)) ||
      (lead.empreendimentoInteresse && lead.empreendimentoInteresse.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEmp = selectedFilterEmp === 'all' || lead.empreendimentoInteresse === selectedFilterEmp;

    return matchesSearch && matchesEmp;
  });

  // Extract unique developments for filter dropdown
  const uniqueEmps = Array.from(new Set(leads.map(l => l.empreendimentoInteresse).filter(Boolean)));

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: FunnelStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onMoveLead(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  const getNextStage = (current: FunnelStage): FunnelStage | null => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    if (idx !== -1 && idx < COLUMNS.length - 2) {
      return COLUMNS[idx + 1].id;
    }
    return null;
  };

  const getPrevStage = (current: FunnelStage): FunnelStage | null => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    if (idx > 0 && current !== 'descartado') {
      return COLUMNS[idx - 1].id;
    }
    return null;
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá ${name}! Sou da 3C Imobiliária.`);
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
      
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Funil de Vendas do Corretor</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-700 border border-orange-200">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Arraste os cards para avançar as etapas da negociação ou clique para ver a ficha completa
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56 sm:w-64 shadow-2xs transition-all"
            />
          </div>

          {/* Development Filter */}
          <div className="relative">
            <select
              value={selectedFilterEmp}
              onChange={(e) => setSelectedFilterEmp(e.target.value)}
              className="pl-2.5 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700 shadow-2xs cursor-pointer"
            >
              <option value="all">🏢 Todos Empreendimentos</option>
              {uniqueEmps.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Atualizar leads"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-brand-600 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
          </button>

          {/* New Lead Button */}
          <button
            onClick={onNewLead}
            className="px-3.5 py-1.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD CONTAINER (Horizontal Scroll) */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex items-start gap-3.5 min-w-[1600px] h-full">

          {COLUMNS.map(column => {
            const columnLeads = filteredLeads.filter(lead => lead.statusFunil === column.id);

            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`w-72 flex-shrink-0 bg-slate-100/70 rounded-2xl p-3 border ${column.color} flex flex-col max-h-[calc(100vh-175px)] shadow-2xs transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                    <span className="text-xs font-bold text-slate-800">{column.title}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200 ${column.badgeBg} ${column.badgeText}`}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards List (Vertical Scroll) */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnLeads.map(lead => {
                    const next = getNextStage(lead.statusFunil);
                    const prev = getPrevStage(lead.statusFunil);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => onSelectLead(lead)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group select-none relative"
                      >
                        {/* Card Top: Origem & Data */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{lead.origemLead}</span>
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {new Date(lead.ultimaInteracaoAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        {/* Client Name */}
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-tight">
                          {lead.nome}
                        </h4>

                        {/* Development Interest */}
                        <p className="text-[11px] text-brand-600 font-medium mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.empreendimentoInteresse}</span>
                        </p>

                        {/* Financial Information (Renda + FGTS) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Renda:</span>
                            <strong className="text-slate-800">
                              {lead.rendaMensal > 0 ? `R$ ${lead.rendaMensal.toLocaleString('pt-BR')}` : 'A definir'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">FGTS:</span>
                            <strong className="text-emerald-600">
                              {lead.fgtsValor > 0 ? `R$ ${lead.fgtsValor.toLocaleString('pt-BR')}` : 'R$ 0'}
                            </strong>
                          </div>
                        </div>

                        {/* Document Checklist & Credit Rejection Status on Card */}
                        {lead.checklistProgress && (
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            {lead.checklistProgress.temRejeitado ? (
                              <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                ❌ Doc Recusado
                              </span>
                            ) : (
                              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                📑 {lead.checklistProgress.coletados}/{lead.checklistProgress.total} Docs Coletados
                              </span>
                            )}

                            {lead.checklistProgress.aprovados > 0 && (
                              <span className="text-emerald-600 font-semibold">
                                ✓ {lead.checklistProgress.aprovados} Aprovados
                              </span>
                            )}
                          </div>
                        )}

                        {lead.motivoRejeicaoCredito && (
                          <div className="mt-2 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-800 leading-tight">
                            <strong>Recusa Caixa:</strong> {lead.motivoRejeicaoCredito}
                          </div>
                        )}

                        {/* Card Bottom: Quick Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={(e) => openWhatsApp(e, lead.telefone, lead.nome)}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Fast Move Buttons */}
                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onMoveLead(lead.id, prev); }}
                                title="Voltar etapa"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {next && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onMoveLead(lead.id, next); }}
                                title="Avançar etapa"
                                className="p-1 text-brand-600 hover:text-brand-700 hover:bg-orange-50 rounded-md font-bold transition-colors"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 rounded-xl text-center p-3">
                      <p className="text-[11px] text-slate-400 font-medium">Nenhum lead nesta etapa</p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
};

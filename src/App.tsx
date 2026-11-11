import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginCard } from './components/auth/LoginCard';
import { AppLayout } from './components/layout/AppLayout';
import { WelcomeDashboard } from './components/dashboard/WelcomeDashboard';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { LeadModal } from './components/leads/LeadModal';
import { NewLeadModal } from './components/leads/NewLeadModal';
import { EmpreendimentosManager } from './components/empreendimentos/EmpreendimentosManager';
import { AgendaView } from './components/agenda/AgendaView';
import { ScheduleVisitModal } from './components/agenda/ScheduleVisitModal';
import { Lead, FunnelStage } from './types';
import { leadsService } from './services/leadsService';
import { Empreendimento, empreendimentosService } from './services/empreendimentosService';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'empreendimentos' | 'agenda' | 'whatsapp'>('kanban');

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Visit scheduling state
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [leadForVisit, setLeadForVisit] = useState<Lead | null>(null);

  const handleOpenScheduleVisit = (lead?: Lead) => {
    setLeadForVisit(lead || null);
    setIsScheduleVisitOpen(true);
  };

  // Empreendimentos state
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);

  // Load leads and developments
  const loadData = async () => {
    setIsLeadsLoading(true);
    try {
      const [leadsData, empsData] = await Promise.all([
        leadsService.getLeads(),
        empreendimentosService.getEmpreendimentos()
      ]);
      setLeads(leadsData);
      setEmpreendimentos(empsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLeadsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Lead actions
  const handleMoveLead = async (leadId: string, newStatus: FunnelStage) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, statusFunil: newStatus } : l));
    try {
      await leadsService.updateLeadStatus(leadId, newStatus);
    } catch (err) {
      console.error('Failed to update lead status:', err);
      // Rollback
      loadData();
    }
  };

  const handleSaveLead = async (updated: Partial<Lead>) => {
    if (!selectedLead) return;
    try {
      await leadsService.updateLead(selectedLead.id, updated);
      await loadData();
      setSelectedLead(null);
    } catch (err) {
      console.error('Failed to save lead:', err);
      throw err;
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadsService.deleteLead(leadId);
      await loadData();
      setSelectedLead(null);
    } catch (err) {
      console.error('Failed to delete lead:', err);
      throw err;
    }
  };

  const handleCreateLead = async (newLead: Partial<Lead>) => {
    try {
      await leadsService.createLead(newLead);
      await loadData();
      setIsNewLeadModalOpen(false);
    } catch (err) {
      console.error('Failed to create lead:', err);
      throw err;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-3">
          <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-600">Carregando CRM Grupo 3C...</p>
      </div>
    );
  }

  // Not authenticated: Show Clean Login Screen
  if (!user) {
    return <LoginCard />;
  }

  // Authenticated: Show CRM Layout
  return (
    <AppLayout activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)}>
      
      {/* 1. VISÃO GERAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <WelcomeDashboard 
          onGoToKanban={() => setActiveTab('kanban')}
          onGoToAgenda={() => setActiveTab('agenda')}
          onGoToWhatsApp={() => setActiveTab('whatsapp')}
        />
      )}

      {/* 2. FUNIL KANBAN DE VENDAS */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          leads={leads}
          isLoading={isLeadsLoading}
          onRefresh={loadData}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onNewLead={() => setIsNewLeadModalOpen(true)}
          onMoveLead={handleMoveLead}
          onScheduleVisit={handleOpenScheduleVisit}
        />
      )}

      {/* 3. CATÁLOGO E GESTÃO DE EMPREENDIMENTOS */}
      {activeTab === 'empreendimentos' && (
        <EmpreendimentosManager
          empreendimentos={empreendimentos}
          onRefresh={loadData}
        />
      )}

      {/* 4. AGENDA DE VISITAS (Sprint 4) */}
      {activeTab === 'agenda' && (
        <AgendaView
          leads={leads}
          empreendimentos={empreendimentos}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onLeadStatusChanged={loadData}
        />
      )}

      {/* 5. WHATSAPP INBOX (Sprint 5) */}
      {activeTab === 'whatsapp' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              📱
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conexão WhatsApp & Inbox Espelhada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Emparelhamento de WhatsApp via QR Code e Inbox espelhada de conversas programado para a <strong>Sprint 5</strong>.
            </p>
            <button
              onClick={() => setActiveTab('kanban')}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
            >
              Ir para o Funil Kanban
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          empreendimentos={empreendimentos}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          onScheduleVisit={handleOpenScheduleVisit}
        />
      )}

      {/* New Lead Modal */}
      {isNewLeadModalOpen && (
        <NewLeadModal
          empreendimentos={empreendimentos}
          onClose={() => setIsNewLeadModalOpen(false)}
          onCreate={handleCreateLead}
        />
      )}

      {/* Schedule Visit Modal */}
      {isScheduleVisitOpen && (
        <ScheduleVisitModal
          lead={leadForVisit}
          leads={leads}
          empreendimentos={empreendimentos}
          onClose={() => {
            setIsScheduleVisitOpen(false);
            setLeadForVisit(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

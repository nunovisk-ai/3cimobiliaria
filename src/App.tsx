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
import { WhatsAppInboxView } from './components/whatsapp/WhatsAppInboxView';
import { WhatsAppConnectModal } from './components/whatsapp/WhatsAppConnectModal';
import { UserManagerView } from './components/users/UserManagerView';
import { FirstAccessModal } from './components/auth/FirstAccessModal';
import { Lead, FunnelStage, WhatsAppInstance } from './types';
import { leadsService } from './services/leadsService';
import { empreendimentosService, Empreendimento } from './services/empreendimentosService';
import { whatsappService } from './services/whatsappService';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, isFirstAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'empreendimentos' | 'agenda' | 'whatsapp' | 'usuarios'>('kanban');

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Visit scheduling state
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [leadForVisit, setLeadForVisit] = useState<Lead | null>(null);

  // WhatsApp state
  const [whatsappInstance, setWhatsappInstance] = useState<WhatsAppInstance | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [chatTargetLeadId, setChatTargetLeadId] = useState<string | null>(null);
  const [newLeadInitialValues, setNewLeadInitialValues] = useState<Partial<Lead> | undefined>(undefined);

  const handleOpenScheduleVisit = (lead?: Lead) => {
    setLeadForVisit(lead || null);
    setIsScheduleVisitOpen(true);
  };

  const handleOpenChatForLead = (leadId: string) => {
    setChatTargetLeadId(leadId);
    setActiveTab('whatsapp');
  };

  const handleOpenCreateLead = (initial?: Partial<Lead>) => {
    setNewLeadInitialValues(initial);
    setIsNewLeadModalOpen(true);
  };

  const handleQuickUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await leadsService.updateLead(leadId, updates);
    await loadData();
  };

  const loadWhatsAppInstance = async () => {
    if (!user?.email) return;
    try {
      const inst = await whatsappService.getInstanceStatus(user.email);
      setWhatsappInstance(inst);
    } catch (err) {
      console.error('Failed to load WhatsApp instance:', err);
    }
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
      loadWhatsAppInstance();
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
    <AppLayout 
      activeTab={activeTab} 
      onTabChange={(tab: any) => setActiveTab(tab)}
      isWhatsAppConnected={whatsappInstance?.status === 'connected'}
      whatsappPhone={whatsappInstance?.phoneNumber}
      onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
    >
      
      {/* 1. VISÃO GERAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <WelcomeDashboard 
          onGoToKanban={() => setActiveTab('kanban')}
          onGoToAgenda={() => setActiveTab('agenda')}
          onGoToWhatsApp={() => setActiveTab('whatsapp')}
        />
      )}

      {/* 2. FUNIL DE VENDAS */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          leads={leads}
          isLoading={isLeadsLoading}
          onRefresh={loadData}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onNewLead={() => setIsNewLeadModalOpen(true)}
          onMoveLead={handleMoveLead}
          onScheduleVisit={handleOpenScheduleVisit}
          onOpenChat={handleOpenChatForLead}
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

      {/* 5. WHATSAPP INBOX ESPELHADA (Sprint 5) */}
      {activeTab === 'whatsapp' && (
        <WhatsAppInboxView
          leads={leads}
          initialSelectedLeadId={chatTargetLeadId}
          instance={whatsappInstance}
          empreendimentos={empreendimentos}
          onSelectLeadForCRM={(lead) => setSelectedLead(lead)}
          onScheduleVisit={handleOpenScheduleVisit}
          onLeadStageChange={handleMoveLead}
          onOpenConnectModal={() => setIsWhatsAppModalOpen(true)}
          onOpenCreateLead={handleOpenCreateLead}
          onUpdateLead={handleQuickUpdateLead}
        />
      )}

      {/* 6. GESTÃO DE USUÁRIOS & EQUIPE (Sprint 6 - Produção Admin) */}
      {activeTab === 'usuarios' && (
        <UserManagerView />
      )}

      {/* First Access Password Change Modal */}
      {isFirstAccess && (
        <FirstAccessModal />
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
          onOpenChat={handleOpenChatForLead}
        />
      )}

      {/* New Lead Modal */}
      {isNewLeadModalOpen && (
        <NewLeadModal
          empreendimentos={empreendimentos}
          initialValues={newLeadInitialValues}
          onClose={() => {
            setIsNewLeadModalOpen(false);
            setNewLeadInitialValues(undefined);
          }}
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

      {/* WhatsApp Connect QR Code Modal */}
      {isWhatsAppModalOpen && user && (
        <WhatsAppConnectModal
          instance={whatsappInstance}
          corretorEmail={user.email}
          onClose={() => setIsWhatsAppModalOpen(false)}
          onStatusChanged={loadWhatsAppInstance}
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

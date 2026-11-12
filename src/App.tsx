import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginCard } from './components/auth/LoginCard';
import { AppLayout } from './components/layout/AppLayout';
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
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import { Lead, FunnelStage, WhatsAppInstance } from './types';
import { leadsService } from './services/leadsService';
import { empreendimentosService, Empreendimento } from './services/empreendimentosService';
import { whatsappService } from './services/whatsappService';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, isFirstAccess, isPasswordRecoveryMode } = useAuth();
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
  const [pendingWhatsAppLid, setPendingWhatsAppLid] = useState<string | null>(null);
  const [unreadWhatsAppCount, setUnreadWhatsAppCount] = useState<number>(0);

  const handleOpenScheduleVisit = (lead?: Lead) => {
    setLeadForVisit(lead || null);
    setIsScheduleVisitOpen(true);
  };

  const handleOpenChatForLead = (leadId: string) => {
    setChatTargetLeadId(leadId);
    setActiveTab('whatsapp');
  };

  const handleOpenCreateLead = (initial?: Partial<Lead> & { sourceLidJid?: string }) => {
    if (initial) {
      const { sourceLidJid, ...leadInitial } = initial;
      setPendingWhatsAppLid(sourceLidJid && sourceLidJid.includes('@lid') ? sourceLidJid : null);
      setNewLeadInitialValues(leadInitial);
    } else {
      setPendingWhatsAppLid(null);
      setNewLeadInitialValues(undefined);
    }
    setIsNewLeadModalOpen(true);
  };

  const handleQuickUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await leadsService.updateLead(leadId, updates);
    await loadData();
  };

  const loadWhatsAppInstance = async () => {
    if (!user?.email) return;
    try {
      const inst = await whatsappService.getInstanceStatus(user.email, user.id);
      setWhatsappInstance(inst);
      if (inst.status !== 'connected') {
        setUnreadWhatsAppCount(0);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp instance:', err);
    }
  };

  // Empreendimentos state
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);

  // Load leads and developments
  const loadData = async () => {
    if (!user) return;
    setIsLeadsLoading(true);
    try {
      const [leadsData, empsData] = await Promise.all([
        leadsService.getLeads(user.id, user.role),
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

  // Background unread messages polling when on initial/other tabs
  useEffect(() => {
    if (!whatsappInstance || whatsappInstance.status !== 'connected' || activeTab === 'whatsapp') {
      return;
    }

    const session = whatsappInstance.sessionName;
    const checkUnread = async () => {
      try {
        const chats = await whatsappService.getRealChats(session);
        let readTsMap: Record<string, number> = {};
        try {
          const raw = localStorage.getItem(`3c_read_v3_${session}`);
          if (raw) readTsMap = JSON.parse(raw);
        } catch {
          // ignore
        }

        const isFirstSeed = Object.keys(readTsMap).length === 0;
        const ownDigits = (whatsappInstance.phoneNumber || '').replace(/\D/g, '');
        let seedModified = false;
        let count = 0;

        for (const chat of chats) {
          const cleanChatDigits = (chat.rawPhone || '').replace(/\D/g, '');
          if (ownDigits && cleanChatDigits && ownDigits.length >= 8 && cleanChatDigits.slice(-8) === ownDigits.slice(-8)) {
            continue;
          }
          const msgTs = new Date(chat.lastMessageTimestamp || 0).getTime();
          const hasExplicitRealUnread =
            typeof chat.rawUnreadCount === 'number' &&
            chat.rawUnreadCount >= 1 &&
            chat.rawUnreadCount <= 20 &&
            !chat.lastFromMe;

          if (isFirstSeed && !hasExplicitRealUnread) {
            readTsMap[chat.remoteJid] = msgTs;
            seedModified = true;
          }

          const matchedLead = leads.find(l => {
            const leadDigits = (l.telefone || '').replace(/\D/g, '');
            if (leadDigits.length < 8 || cleanChatDigits.length < 8) return false;
            return leadDigits.slice(-8) === cleanChatDigits.slice(-8);
          });
          const chatKey = matchedLead ? matchedLead.id : chat.remoteJid;
          const lastReadTs = Math.max(readTsMap[chatKey] || 0, readTsMap[chat.remoteJid] || 0);

          if (chat.rawUnreadCount === 0 || chat.lastFromMe) {
            if (msgTs > (readTsMap[chat.remoteJid] || 0)) {
              readTsMap[chat.remoteJid] = msgTs;
              seedModified = true;
            }
          } else if (!chat.lastFromMe && msgTs > lastReadTs) {
            count += hasExplicitRealUnread ? chat.rawUnreadCount : 1;
          }
        }

        if (seedModified) {
          try {
            localStorage.setItem(`3c_read_v3_${session}`, JSON.stringify(readTsMap));
          } catch {
            // ignore
          }
        }

        setUnreadWhatsAppCount(count);
      } catch {
        // ignore
      }
    };

    checkUnread();
    const timer = setInterval(checkUnread, 15000);
    return () => clearInterval(timer);
  }, [whatsappInstance?.status, whatsappInstance?.sessionName, activeTab, leads]);

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
      const created = await leadsService.createLead(newLead, user?.id);
      if (pendingWhatsAppLid && whatsappInstance?.sessionName && (created?.telefone || newLead.telefone)) {
        whatsappService.registerLidMapping(
          whatsappInstance.sessionName,
          pendingWhatsAppLid,
          created?.telefone || newLead.telefone || ''
        );
      }
      setPendingWhatsAppLid(null);
      if (created?.id) {
        setChatTargetLeadId(created.id);
      }
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

  // 1. Password Recovery Mode (user opened magic recovery link from email)
  if (isPasswordRecoveryMode) {
    return <ResetPasswordModal />;
  }

  // 2. Not authenticated: Show Clean Login Screen
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
      unreadWhatsAppCount={unreadWhatsAppCount}
      onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
    >


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
          isLoading={isLeadsLoading}
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
          onUnreadCountChange={setUnreadWhatsAppCount}
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
            setPendingWhatsAppLid(null);
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

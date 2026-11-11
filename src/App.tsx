import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginCard } from './components/auth/LoginCard';
import { AppLayout } from './components/layout/AppLayout';
import { WelcomeDashboard } from './components/dashboard/WelcomeDashboard';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'agenda' | 'whatsapp'>('dashboard');

  if (isLoading) {
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
      {activeTab === 'dashboard' && (
        <WelcomeDashboard 
          onGoToKanban={() => setActiveTab('kanban')}
          onGoToAgenda={() => setActiveTab('agenda')}
          onGoToWhatsApp={() => setActiveTab('whatsapp')}
        />
      )}

      {activeTab === 'kanban' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 text-brand-600 flex items-center justify-center text-2xl font-bold">
              📊
            </div>
            <h3 className="text-lg font-bold text-slate-900">Módulo do Funil Kanban</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A fundação e a tela de login (Sprint 1) estão prontas. Este módulo será completamente estruturado com drag-and-drop na <strong>Sprint 2</strong>!
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
            >
              Voltar à Visão Geral
            </button>
          </div>
        </div>
      )}

      {activeTab === 'agenda' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold">
              📅
            </div>
            <h3 className="text-lg font-bold text-slate-900">Módulo de Agenda de Visitas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Controle de visitas, integração Google Calendar e Apple Calendar programado para a <strong>Sprint 4</strong>.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
            >
              Voltar à Visão Geral
            </button>
          </div>
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              📱
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conexão WhatsApp & Inbox Espelhada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Emparelhamento via QR Code e Inbox de conversas programado para a <strong>Sprint 5</strong>.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
            >
              Voltar à Visão Geral
            </button>
          </div>
        </div>
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

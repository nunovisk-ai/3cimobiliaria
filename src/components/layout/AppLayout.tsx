import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Columns3, 
  CalendarDays, 
  MessageSquare, 
  Building2,
  LogOut, 
  Smartphone, 
  Bell,
  Menu,
  X
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { user, logout, isManager } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Badge */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('kanban')} 
              className="flex items-center gap-2 focus:outline-none cursor-pointer"
            >
              <img 
                src="/logo-dark.png" 
                alt="Grupo 3C Imobiliária" 
                className="h-9 w-auto object-contain"
              />
            </button>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-brand-700 border border-orange-200">
              {isManager ? 'Gestão 3C' : 'CRM Corretor'}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium">
            <button
              onClick={() => onTabChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-white text-brand-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Funil Kanban</span>
            </button>

            <button
              onClick={() => onTabChange('empreendimentos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'empreendimentos'
                  ? 'bg-white text-brand-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Empreendimentos</span>
            </button>

            <button
              onClick={() => onTabChange('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-white text-brand-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Agenda de Visitas</span>
            </button>

            <button
              onClick={() => onTabChange('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-brand-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Inbox</span>
            </button>

            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-brand-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            
            {/* WhatsApp Live Status Pill */}
            <div 
              onClick={() => onTabChange('whatsapp')}
              className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Smartphone className="w-3 h-3" />
              <span>WhatsApp Pareado</span>
            </div>

            {/* Notification Bell */}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name?.slice(0, 2).toUpperCase() || '3C'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 leading-none">
                  {user?.role === 'gerente' ? 'Gerência Comercial' : `CRECI: ${user?.creci || '241.980-F'}`}
                </p>
              </div>

              <button
                onClick={logout}
                title="Sair do CRM"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { onTabChange('kanban'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'kanban' ? 'bg-orange-50 text-brand-600' : 'text-slate-700'
              }`}
            >
              <Columns3 className="w-4 h-4" />
              <span>Funil Kanban</span>
            </button>

            <button
              onClick={() => { onTabChange('empreendimentos'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'empreendimentos' ? 'bg-orange-50 text-brand-600' : 'text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Empreendimentos</span>
            </button>

            <button
              onClick={() => { onTabChange('agenda'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'agenda' ? 'bg-orange-50 text-brand-600' : 'text-slate-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agenda de Visitas</span>
            </button>

            <button
              onClick={() => { onTabChange('whatsapp'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'whatsapp' ? 'bg-orange-50 text-brand-600' : 'text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Inbox</span>
            </button>

            <button
              onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'dashboard' ? 'bg-orange-50 text-brand-600' : 'text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>

    </div>
  );
};

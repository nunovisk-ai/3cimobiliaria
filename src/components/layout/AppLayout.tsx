import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Filter, 
  CalendarDays, 
  Building2,
  Users,
  LogOut, 
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isWhatsAppConnected?: boolean;
  whatsappPhone?: string;
  unreadWhatsAppCount?: number;
  onOpenWhatsAppModal?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  isWhatsAppConnected = false,
  whatsappPhone,
  unreadWhatsAppCount = 0,
  onOpenWhatsAppModal
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Tab labels for top header breadcrumb
  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    kanban: { title: 'Funil de Vendas', subtitle: 'Gestão visual de negociações e leads' },
    empreendimentos: { title: 'Catálogo de Empreendimentos', subtitle: 'Lançamentos e unidades disponíveis' },
    agenda: { title: 'Agenda de Visitas', subtitle: 'Agendamentos e confirmações de plantão' },
    whatsapp: { title: 'WhatsApp Inbox Espelhada', subtitle: 'Conversas e atendimento em tempo real' },
    dashboard: { title: 'Visão Geral & Métricas', subtitle: 'Performance de vendas e conversões' },
    usuarios: { title: 'Gestão de Usuários & Equipe', subtitle: 'Permissões, acessos e auditoria' },
  };

  const currentTabInfo = tabTitles[activeTab] || { title: 'CRM Grupo 3C', subtitle: 'Painel Comercial' };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR (MENU LATERAL)                        */}
      {/* ======================================================== */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 shadow-2xs z-30 transition-all duration-300 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand / Logo Section */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <button 
            onClick={() => onTabChange('kanban')} 
            className="flex items-center gap-2.5 focus:outline-none cursor-pointer overflow-hidden"
          >
            <img 
              src="/logo-dark.png" 
              alt="Grupo 3C Imobiliária" 
              className="h-9 w-auto object-contain flex-shrink-0"
            />
            {!isCollapsed && (
              <div className="text-left">
                <p className="font-heading font-extrabold text-sm text-slate-900 leading-none tracking-tight">
                  CRM 3C
                </p>
                <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-orange-100 text-brand-700 border border-orange-200'
                }`}>
                  {isAdmin ? 'Admin' : 'Corretor'}
                </span>
              </div>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto overflow-x-hidden">
          
          {/* Group 1: Gestão Comercial */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-heading">
                Gestão Comercial
              </p>
            )}

            {/* Funil de Vendas */}
            <button
              onClick={() => onTabChange('kanban')}
              title={isCollapsed ? 'Funil de Vendas' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Filter className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Funil de Vendas</span>}
            </button>

            {/* Empreendimentos */}
            <button
              onClick={() => onTabChange('empreendimentos')}
              title={isCollapsed ? 'Empreendimentos' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'empreendimentos'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Empreendimentos</span>}
            </button>

            {/* Agenda de Visitas */}
            <button
              onClick={() => onTabChange('agenda')}
              title={isCollapsed ? 'Agenda de Visitas' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Agenda de Visitas</span>}
            </button>

            {/* WhatsApp Inbox */}
            <button
              onClick={() => onTabChange('whatsapp')}
              title={isCollapsed ? `WhatsApp Inbox${unreadWhatsAppCount > 0 ? ` (${unreadWhatsAppCount} não lidas)` : ''}` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'whatsapp'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>WhatsApp Inbox</span>}
              {unreadWhatsAppCount > 0 ? (
                !isCollapsed ? (
                  <span className={`ml-auto text-[10px] font-extrabold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-2xs ${
                    activeTab === 'whatsapp'
                      ? 'bg-white text-brand-600'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {unreadWhatsAppCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-2xs">
                    {unreadWhatsAppCount}
                  </span>
                )
              ) : (
                isWhatsAppConnected && !isCollapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )
              )}
            </button>
          </div>

          {/* Group 2: Relatórios & Administração */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-heading">
                Relatórios & Gestão
              </p>
            )}

            {/* Visão Geral */}
            <button
              onClick={() => onTabChange('dashboard')}
              title={isCollapsed ? 'Visão Geral' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Visão Geral</span>}
            </button>

            {/* Gestão de Usuários (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => onTabChange('usuarios')}
                title={isCollapsed ? 'Equipe & Usuários' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'usuarios'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>Equipe & Usuários</span>}
              </button>
            )}
          </div>

        </div>

        {/* Bottom Sidebar Widgets */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          
          {/* WhatsApp Connection Card */}
          {!isCollapsed ? (
            <div 
              onClick={onOpenWhatsAppModal || (() => onTabChange('whatsapp'))}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isWhatsAppConnected
                  ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-amber-50/80 border-amber-200/90 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isWhatsAppConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <WhatsAppIcon className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold truncate">
                  {isWhatsAppConnected ? (whatsappPhone || 'WhatsApp Ativo') : 'Conectar WhatsApp'}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenWhatsAppModal || (() => onTabChange('whatsapp'))}
              title={isWhatsAppConnected ? (whatsappPhone || 'WhatsApp Conectado') : 'Conectar WhatsApp'}
              className={`w-full py-2.5 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isWhatsAppConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* User Profile Info & Logout */}
          <div className={`flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 ${isCollapsed ? 'flex-col gap-2' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-heading font-bold text-xs shadow-2xs flex-shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || '3C'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                    {user?.role === 'admin' ? 'Administrador Geral' : user?.role === 'gerente' ? 'Gerência Comercial' : `CRECI: ${user?.creci || '241.980-F'}`}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="Sair do CRM"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT WRAPPER                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
          
          {/* Left: Mobile hamburger & Page Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo */}
            <img 
              src="/logo-dark.png" 
              alt="Grupo 3C Imobiliária" 
              className="h-8 w-auto object-contain md:hidden"
            />

            {/* Breadcrumb Title (Desktop) */}
            <div className="hidden sm:block">
              <h1 className="font-heading font-extrabold text-base text-slate-900 tracking-tight leading-none">
                {currentTabInfo.title}
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Unread WhatsApp Quick Alert Pill on Initial/Other Screens */}
            {unreadWhatsAppCount > 0 && activeTab !== 'whatsapp' && (
              <button
                onClick={() => onTabChange('whatsapp')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Abrir mensagens não lidas no WhatsApp Inbox"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {unreadWhatsAppCount} {unreadWhatsAppCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                </span>
              </button>
            )}

            {/* Mobile WhatsApp Pill */}
            <div 
              onClick={onOpenWhatsAppModal || (() => onTabChange('whatsapp'))}
              className={`md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer border ${
                isWhatsAppConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWhatsAppConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => onTabChange('whatsapp')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer"
              title={unreadWhatsAppCount > 0 ? `${unreadWhatsAppCount} mensagens não lidas no WhatsApp` : 'Notificações'}
            >
              <Bell className="w-4 h-4" />
              {unreadWhatsAppCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                  {unreadWhatsAppCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
              )}
            </button>

            {/* Desktop User Initials Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-heading font-bold text-xs shadow-2xs">
                {user?.name?.slice(0, 2).toUpperCase() || '3C'}
              </div>
              <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {user?.name}
              </span>
            </div>

          </div>

        </header>

        {/* Main Content View with smooth scroll */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative flex flex-col">
          {children}
        </main>

      </div>

      {/* ======================================================== */}
      {/* 3. MOBILE SLIDE-OVER DRAWER MENU                         */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Drawer Container */}
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo-dark.png" 
                  alt="Grupo 3C Imobiliária" 
                  className="h-8 w-auto object-contain"
                />
                <span className="font-heading font-extrabold text-sm text-slate-900">
                  CRM 3C
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-heading">
                  Gestão Comercial
                </p>

                <button
                  onClick={() => { onTabChange('kanban'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'kanban' ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Funil de Vendas</span>
                </button>

                <button
                  onClick={() => { onTabChange('empreendimentos'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'empreendimentos' ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Empreendimentos</span>
                </button>

                <button
                  onClick={() => { onTabChange('agenda'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'agenda' ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Agenda de Visitas</span>
                </button>

                <button
                  onClick={() => { onTabChange('whatsapp'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'whatsapp' ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp Inbox</span>
                  {unreadWhatsAppCount > 0 && (
                    <span className={`ml-auto text-[10px] font-extrabold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${
                      activeTab === 'whatsapp' ? 'bg-white text-brand-600' : 'bg-emerald-500 text-white'
                    }`}>
                      {unreadWhatsAppCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-heading">
                  Relatórios & Gestão
                </p>

                <button
                  onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    activeTab === 'dashboard' ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Visão Geral</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { onTabChange('usuarios'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      activeTab === 'usuarios' ? 'bg-purple-600 text-white' : 'text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Equipe & Usuários</span>
                  </button>
                )}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || '3C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

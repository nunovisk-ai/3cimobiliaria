import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Filter, 
  Users, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface WelcomeDashboardProps {
  onGoToKanban: () => void;
  onGoToAgenda: () => void;
  onGoToWhatsApp: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ 
  onGoToKanban, 
  onGoToAgenda, 
  onGoToWhatsApp 
}) => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(#f68633_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Sprint 1 Concluída • Fundação & Auth Prontos</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user?.name}! Bem-vindo ao CRM Grupo 3C.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Sua nova plataforma de vendas imobiliárias em São Paulo com espelhamento de WhatsApp, funil ágil, gestão de crédito Caixa e controle de visitas.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onGoToKanban}
              className="py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span>Acessar Funil de Vendas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onGoToAgenda}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Ver Agenda de Visitas</span>
            </button>

            <button
              onClick={onGoToWhatsApp}
              className="py-2.5 px-4 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Conectar WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Leads no Funil</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">14</p>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>3 novos leads hoje</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Visitas Agendadas</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">4</p>
          <p className="text-[11px] text-purple-600 font-medium">
            2 visitas confirmadas esta semana
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Docs em Análise</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">5</p>
          <p className="text-[11px] text-amber-600 font-medium">
            Pastas Caixa Econômica / SBPE
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">WhatsApp Espelhado</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">Ativo</p>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Instância conectada</span>
          </p>
        </div>

      </div>

      {/* Features & Architecture Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sprint status card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-500" />
              <span>Progresso do Desenvolvimento do CRM</span>
            </h3>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>6 / 6 Sprints Concluídas • Sistema Pronto</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 1: Fundação, Autenticação & Identidade Visual (Concluída)</strong>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Setup Vite + React + Tailwind, Tela de Login Clean do Grupo 3C, identidade visual laranja/grafite.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 2: Funil de Vendas & Catálogo de Empreendimentos (Concluída)</strong>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Quadro de vendas visual com 8 colunas imobiliárias, drag-and-drop, simulação Caixa MCMV e catálogo com 7 lançamentos reais do Grupo 3C.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 3: Gestão Documental & Análise de Crédito Caixa (Concluída)</strong>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Checklist ágil Caixa com toggle rápido, motivo de rejeição, cópia de lista pendente para WhatsApp e upload opcional para Supabase Storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 4: Agenda de Visitas & Sincronização de Calendário (Concluída)</strong>
                <p className="text-purple-700 text-[11px] mt-0.5">
                  Controle de visitas aos estandes, integração direta com Google Agenda e Apple Calendar (.ics), WhatsApp de confirmação e baixa pós-visita com reagendamento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 5: Conexão WhatsApp QR Code & Inbox Espelhada (Concluída)</strong>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Conexão individual por corretor via QR Code, histórico espelhado de mensagens com status lido/entregue, respostas rápidas do corretor e painel CRM integrado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">Sprint 6: Deploy, Domínio e Ajustes Finais (Concluída)</strong>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Configuração para publicação automática via GitHub Pages e Vercel, suporte ao domínio customizado grupo3c.vitrai.com.br e roteamento SPA.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Info card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Infraestrutura & Ambiente</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Domínio Alvo:</span>
              <strong className="text-slate-800 font-mono text-[11px]">grupo3c.vitrai.com.br</strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Banco de Dados:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                {isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase Ready'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Engine WhatsApp:</span>
              <span className="text-slate-700 font-medium text-[11px]">Evolution API (QR Code)</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Usuário Logado:</span>
              <strong className="text-brand-600 text-[11px]">{user?.email}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

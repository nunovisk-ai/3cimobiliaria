import React, { useState, useEffect } from 'react';
import { WhatsAppInstance } from '../../types';
import { whatsappService } from '../../services/whatsappService';
import { 
  X, 
  CheckCircle2, 
  RotateCw, 
  QrCode, 
  LogOut, 
  Wifi, 
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface WhatsAppConnectModalProps {
  instance: WhatsAppInstance | null;
  corretorEmail: string;
  onClose: () => void;
  onStatusChanged: () => void;
}

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
  instance,
  corretorEmail,
  onClose,
  onStatusChanged
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isConnecting, setIsConnecting] = useState(false);
  const [customPhone, setCustomPhone] = useState('(11) 98765-4321');
  const [liveQrCode, setLiveQrCode] = useState<string | null>(instance?.qrcodeBase64 || null);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  const isConnected = instance?.status === 'connected';

  // Fetch live QR code from Evolution API
  const fetchFreshQr = async () => {
    setIsRefreshingQr(true);
    const session = instance?.sessionName || '3c_vendedor';
    try {
      const qr = await whatsappService.fetchLiveQrCode(session);
      if (qr) {
        setLiveQrCode(qr);
      }
    } catch (err) {
      console.warn('Erro ao atualizar QR Code:', err);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Timer countdown and live polling
  useEffect(() => {
    if (isConnected) return;

    fetchFreshQr();

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchFreshQr();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    // Periodically check if phone scanned the QR Code
    const connectionPoll = setInterval(async () => {
      const session = instance?.sessionName || '3c_vendedor';
      try {
        const state = await whatsappService.checkLiveConnectionState(session);
        if (state === 'open') {
          if (instance?.id) {
            await whatsappService.setInstanceConnected(instance.id, instance.phoneNumber || '(11) 98765-4321');
          }
          onStatusChanged();
        }
      } catch (err) {
        console.warn('Erro ao checar status de conexao:', err);
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      clearInterval(connectionPoll);
    };
  }, [isConnected, instance?.sessionName]);

  // Handle Demo Connect
  const handleDemoConnect = async () => {
    if (!instance) return;
    setIsConnecting(true);
    try {
      await whatsappService.setInstanceConnected(instance.id, customPhone);
      onStatusChanged();
    } catch (err) {
      console.error('Falha ao conectar WhatsApp demo:', err);
      alert('Erro ao conectar WhatsApp.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!instance) return;
    if (confirm('Tem certeza que deseja desconectar sua conta de WhatsApp deste CRM?')) {
      setIsConnecting(true);
      try {
        await whatsappService.disconnectInstance(instance.id);
        onStatusChanged();
      } catch (err) {
        console.error('Erro ao desconectar WhatsApp:', err);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <WhatsAppIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Conexão WhatsApp Web (Multi-Corretor)</h3>
              <p className="text-xs text-emerald-100">
                {corretorEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {isConnected ? (
            /* CONNECTED STATE */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Conexão Ativa e Espelhada
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2">
                  {instance?.phoneNumber || '(11) 98765-4321'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conectado como sessão ativa do corretor <strong>Grupo 3C</strong>
                </p>
              </div>

              {/* Status Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-left max-w-md mx-auto">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Status da Sessão:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Sincronizado
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Última Sincronização:</span>
                  <strong className="text-slate-800">Agora mesmo</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Segurança:</span>
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Criptografia Ponta a Ponta
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="px-4 py-2.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Desconectar Este Número</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            /* DISCONNECTED / SCAN QR CODE STATE */
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Left Instructions */}
                <div className="space-y-3.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Para usar o WhatsApp no CRM:
                  </h4>
                  
                  <ol className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                        1
                      </span>
                      <span>Abra o <strong>WhatsApp</strong> no seu smartphone.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                        2
                      </span>
                      <span>
                        Toque no menu <strong>Mais opções (⋮)</strong> no Android ou <strong>Configurações (⚙️)</strong> no iPhone.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                        3
                      </span>
                      <span>
                        Selecione <strong>Aparelhos Conectados</strong> e depois <strong>Conectar um aparelho</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                        4
                      </span>
                      <span>Aponte a câmera do seu celular para o QR Code ao lado.</span>
                    </li>
                  </ol>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>
                      Todas as conversas enviadas pelo CRM ou pelo celular aparecerão <strong>espelhadas em tempo real</strong> para você não perder nenhum lead!
                    </p>
                  </div>
                </div>

                {/* Right QR Code Box */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl relative">
                  
                  {/* Real QR Code or Fallback */}
                  <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center min-h-[200px] min-w-[200px]">
                    {liveQrCode ? (
                      <img 
                        src={liveQrCode} 
                        alt="QR Code WhatsApp Oficial" 
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    ) : (
                      <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
                        <rect width="100" height="100" fill="white" rx="4" />
                        <rect x="6" y="6" width="28" height="28" fill="#1E293B" rx="2" />
                        <rect x="10" y="10" width="20" height="20" fill="white" rx="1" />
                        <rect x="14" y="14" width="12" height="12" fill="#F68633" rx="1" />
                        <rect x="66" y="6" width="28" height="28" fill="#1E293B" rx="2" />
                        <rect x="70" y="10" width="20" height="20" fill="white" rx="1" />
                        <rect x="74" y="14" width="12" height="12" fill="#F68633" rx="1" />
                        <rect x="6" y="66" width="28" height="28" fill="#1E293B" rx="2" />
                        <rect x="10" y="70" width="20" height="20" fill="white" rx="1" />
                        <rect x="14" y="74" width="12" height="12" fill="#F68633" rx="1" />
                        <rect x="38" y="10" width="4" height="4" fill="#1E293B" />
                        <rect x="46" y="10" width="4" height="4" fill="#1E293B" />
                        <rect x="54" y="10" width="4" height="4" fill="#1E293B" />
                        <rect x="38" y="18" width="4" height="4" fill="#1E293B" />
                        <rect x="50" y="18" width="4" height="4" fill="#1E293B" />
                        <rect x="10" y="38" width="4" height="4" fill="#1E293B" />
                        <rect x="10" y="46" width="4" height="4" fill="#1E293B" />
                        <rect x="10" y="54" width="4" height="4" fill="#1E293B" />
                        <rect x="18" y="38" width="4" height="4" fill="#1E293B" />
                        <rect x="18" y="50" width="4" height="4" fill="#1E293B" />
                        <rect x="38" y="38" width="6" height="6" fill="#1E293B" />
                        <rect x="48" y="36" width="4" height="4" fill="#1E293B" />
                        <rect x="56" y="38" width="6" height="6" fill="#1E293B" />
                        <rect x="66" y="36" width="6" height="6" fill="#1E293B" />
                        <rect x="76" y="38" width="4" height="4" fill="#1E293B" />
                        <rect x="84" y="36" width="4" height="4" fill="#1E293B" />
                        <rect x="36" y="48" width="4" height="4" fill="#1E293B" />
                        <rect x="62" y="48" width="4" height="4" fill="#1E293B" />
                        <rect x="72" y="46" width="6" height="6" fill="#1E293B" />
                        <rect x="82" y="48" width="4" height="4" fill="#1E293B" />
                        <rect x="38" y="58" width="6" height="6" fill="#1E293B" />
                        <rect x="48" y="56" width="4" height="4" fill="#1E293B" />
                        <rect x="56" y="58" width="6" height="6" fill="#1E293B" />
                        <rect x="66" y="56" width="4" height="4" fill="#1E293B" />
                        <rect x="84" y="58" width="4" height="4" fill="#1E293B" />
                        <circle cx="50" cy="50" r="10" fill="white" stroke="#F68633" strokeWidth="2" />
                        <text x="50" y="53" textAnchor="middle" fill="#F68633" fontSize="8" fontWeight="bold">3C</text>
                      </svg>
                    )}
                  </div>

                  {/* Refresh indicator */}
                  <button
                    type="button"
                    onClick={fetchFreshQr}
                    disabled={isRefreshingQr}
                    className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-700 mt-3 transition-colors cursor-pointer"
                    title="Clique para forçar novo QR Code"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshingQr ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingQr ? 'Gerando novo QR Code...' : `Atualiza em ${timeLeft}s (clique p/ renovar)`}</span>
                  </button>
                </div>

              </div>

              {/* DEMO FAST-CONNECT SECTION */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">
                      Conexão Rápida para Avaliação / Demonstração
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
                    1-Clique
                  </span>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Para testar o espelhamento de conversas e o envio direto pelo CRM sem precisar escanear com um celular físico agora, clique no botão abaixo para ativar a sessão de demonstração:
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Seu telefone ex: (11) 98765-4321"
                    className="w-full sm:w-48 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleDemoConnect}
                    disabled={isConnecting}
                    className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isConnecting ? 'Conectando...' : 'Escanear QR Code Demo'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

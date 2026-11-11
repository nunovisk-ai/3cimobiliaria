import React, { useState, useEffect, useRef } from 'react';
import { Lead, FunnelStage, WhatsAppMessage, WhatsAppInstance } from '../../types';
import { whatsappService } from '../../services/whatsappService';
import { 
  Search, 
  Send, 
  Paperclip, 
  Building2, 
  Calendar, 
  FileCheck2, 
  CheckCheck, 
  Sparkles, 
  Bot, 
  User, 
  Info, 
  ChevronRight, 
  Wifi, 
  WifiOff, 
  UserPlus, 
  Edit3, 
  AlertCircle, 
  Play, 
  Pause, 
  Mic, 
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface WhatsAppInboxViewProps {
  leads: Lead[];
  initialSelectedLeadId?: string | null;
  instance: WhatsAppInstance | null;
  empreendimentos?: { id: string; nome: string }[];
  onSelectLeadForCRM?: (lead: Lead) => void;
  onScheduleVisit?: (lead: Lead) => void;
  onLeadStageChange?: (leadId: string, newStage: FunnelStage) => void;
  onOpenConnectModal: () => void;
  onOpenCreateLead?: (initial?: Partial<Lead>) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => Promise<void>;
}

const STAGE_CONFIG: Record<FunnelStage, { label: string; color: string; badge: string }> = {
  novo_lead: { label: 'Novo Lead', color: 'border-blue-300 text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  em_atendimento: { label: 'Em Atendimento', color: 'border-orange-300 text-brand-700', badge: 'bg-orange-100 text-brand-800' },
  visita_agendada: { label: 'Visita Agendada', color: 'border-purple-300 text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  aguardando_docs: { label: 'Aguardando Docs', color: 'border-amber-300 text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  analise_credito: { label: 'Análise Crédito', color: 'border-cyan-300 text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
  proposta: { label: 'Proposta', color: 'border-indigo-300 text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
  venda_fechada: { label: 'Venda Fechada', color: 'border-emerald-300 text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  descartado: { label: 'Descartado', color: 'border-slate-300 text-slate-700', badge: 'bg-slate-100 text-slate-800' },
};

interface UnlinkedContact {
  id: string; // canonical remoteJid
  remoteJid: string;
  allJids: string[];
  nome: string;
  telefone: string;
  rawPhone: string;
  mensagem: string;
  enviadaAt: string;
  unreadCount?: number;
  profilePicUrl?: string;
}

/**
 * Embedded Audio Message Player with progressive playback & time format
 */
const AudioMessagePlayer: React.FC<{ message: WhatsAppMessage; sessionName: string }> = ({ message, sessionName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.audioDuration || 0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = async () => {
    if (!audioRef.current) {
      setIsLoadingAudio(true);
      try {
        let src = message.audioUrl;
        if (!src || !src.startsWith('data:')) {
          const media = await whatsappService.getMediaBase64(sessionName, message.id);
          if (media?.base64) {
            src = `data:${media.mimetype};base64,${media.base64}`;
          }
        }
        if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          audio.onloadedmetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
              setDuration(Math.round(audio.duration));
            }
          };
          audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
          };
          audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
          };
          await audio.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn('Erro ao reproduzir áudio:', err);
      } finally {
        setIsLoadingAudio(false);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px]">
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoadingAudio}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          message.fromMe
            ? 'bg-white text-emerald-700 hover:bg-emerald-50'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isLoadingAudio ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 bg-black/15 rounded-full overflow-hidden cursor-pointer">
          <div 
            className={`h-full rounded-full transition-all ${message.fromMe ? 'bg-white' : 'bg-emerald-600'}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className={`flex justify-between items-center text-[10px] mt-1 font-mono ${
          message.fromMe ? 'text-emerald-100' : 'text-slate-500'
        }`}>
          <span>{isPlaying ? formatSec(currentTime) : formatSec(duration)}</span>
          <span className="flex items-center gap-0.5 font-sans">
            <Mic className="w-3 h-3" />
            Áudio
          </span>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppInboxView: React.FC<WhatsAppInboxViewProps> = ({
  leads,
  initialSelectedLeadId,
  instance,
  empreendimentos = [],
  onSelectLeadForCRM,
  onScheduleVisit,
  onLeadStageChange,
  onOpenConnectModal,
  onOpenCreateLead,
  onUpdateLead
}) => {
  const isConnected = instance?.status === 'connected';
  const session = instance?.sessionName || '3c_vendedor';

  const [unlinkedContacts, setUnlinkedContacts] = useState<UnlinkedContact[]>([]);
  const [realChatMap, setRealChatMap] = useState<Map<string, any>>(new Map());
  const [brokenPics, setBrokenPics] = useState<Record<string, boolean>>({});
  const recentSentMessagesRef = useRef<Array<{ chatKey: string; msg: WhatsAppMessage; sentAt: number }>>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialSelectedLeadId || (leads[0]?.id || null)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // States to feed the lead's profile from chat (Alimentar Perfil)
  const [editRenda, setEditRenda] = useState<number | ''>('');
  const [editFgts, setEditFgts] = useState<number | ''>('');
  const [editEmpreendimento, setEditEmpreendimento] = useState('');
  const [editStatusFunil, setEditStatusFunil] = useState<FunnelStage>('novo_lead');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedLead = isConnected ? (leads.find(l => l.id === selectedLeadId) || null) : null;
  const unlinkedContact = isConnected ? (unlinkedContacts.find(c => c.id === selectedLeadId) || null) : null;
  const isUnlinked = Boolean(unlinkedContact && !selectedLead);

  // Load real chats from Evolution API
  const loadChats = async () => {
    if (!isConnected) {
      setUnlinkedContacts([]);
      setRealChatMap(new Map());
      return;
    }

    try {
      const chats = await whatsappService.getRealChats(session);
      const unlinkedList: UnlinkedContact[] = [];
      const chatMap = new Map<string, any>();

      for (const chat of chats) {
        const cleanChatDigits = (chat.rawPhone || '').replace(/\D/g, '');
        const matchedLead = leads.find(l => {
          const leadDigits = (l.telefone || '').replace(/\D/g, '');
          if (!leadDigits || !cleanChatDigits) return false;
          return leadDigits.slice(-8) === cleanChatDigits.slice(-8);
        });

        if (matchedLead) {
          chatMap.set(matchedLead.id, chat);
        } else {
          unlinkedList.push({
            id: chat.remoteJid,
            remoteJid: chat.remoteJid,
            allJids: chat.allJids && chat.allJids.length > 0 ? chat.allJids : [chat.remoteJid],
            nome: chat.pushName || chat.name || chat.phone,
            telefone: chat.phone,
            rawPhone: chat.rawPhone,
            mensagem: chat.lastMessage || 'Conversa iniciada via WhatsApp',
            enviadaAt: chat.lastMessageTimestamp || new Date().toISOString(),
            unreadCount: chat.unreadCount,
            profilePicUrl: chat.profilePicUrl,
          });
        }
      }

      setRealChatMap(chatMap);
      setUnlinkedContacts(unlinkedList);

      // Auto-select first contact if none selected
      if (!selectedLeadId) {
        if (leads.length > 0 && chatMap.has(leads[0].id)) {
          setSelectedLeadId(leads[0].id);
        } else if (unlinkedList.length > 0) {
          setSelectedLeadId(unlinkedList[0].id);
        }
      }

      // Background enrichment for missing profile pictures on visible chats
      const missingPicJids = chats
        .slice(0, 35)
        .filter(c => !c.profilePicUrl && c.remoteJid)
        .map(c => c.remoteJid);

      if (missingPicJids.length > 0) {
        whatsappService.fetchProfilePicturesBatch(session, missingPicJids).then(picMap => {
          if (Object.keys(picMap).length === 0) return;
          setUnlinkedContacts(prev =>
            prev.map(c => {
              const pic = picMap[c.remoteJid] || (c.rawPhone ? picMap[c.rawPhone] : undefined);
              return pic && !c.profilePicUrl ? { ...c, profilePicUrl: pic } : c;
            })
          );
          setRealChatMap(prev => {
            const next = new Map(prev);
            for (const [leadId, chatObj] of next.entries()) {
              const pic = picMap[chatObj.remoteJid] || (chatObj.rawPhone ? picMap[chatObj.rawPhone] : undefined);
              if (pic && !chatObj.profilePicUrl) {
                next.set(leadId, { ...chatObj, profilePicUrl: pic });
              }
            }
            return next;
          });
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Erro ao carregar chats reais:', err);
    }
  };

  // Sync edit form state when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      setEditRenda(selectedLead.rendaMensal || '');
      setEditFgts(selectedLead.fgtsValor || '');
      setEditEmpreendimento(selectedLead.empreendimentoInteresse || (empreendimentos[0]?.nome || 'Link Itaquera'));
      setEditStatusFunil(selectedLead.statusFunil);
      setEditObservacoes(selectedLead.observacoes || '');
    }
  }, [selectedLead?.id, selectedLead?.updatedAt]);

  const handleSaveProfile = async () => {
    if (!selectedLead || !onUpdateLead) return;
    setIsSavingProfile(true);
    try {
      await onUpdateLead(selectedLead.id, {
        rendaMensal: editRenda === '' ? 0 : Number(editRenda),
        fgtsValor: editFgts === '' ? 0 : Number(editFgts),
        empreendimentoInteresse: editEmpreendimento || selectedLead.empreendimentoInteresse,
        statusFunil: editStatusFunil,
        observacoes: editObservacoes,
      });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Erro ao atualizar perfil do lead:', err);
      alert('Erro ao salvar informações no perfil do lead.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Load messages whenever selected lead changes
  const loadMessages = async (leadIdOrJid: string, isContactUnlinked: boolean = false, isSilent: boolean = false) => {
    if (!isConnected) {
      setMessages([]);
      return;
    }

    if (!isSilent) setIsLoadingMessages(true);
    try {
      let targetJids: string[] = [];
      let leadId: string | undefined = undefined;

      if (isContactUnlinked) {
        const contact = unlinkedContacts.find(c => c.id === leadIdOrJid);
        if (contact) {
          targetJids = contact.allJids && contact.allJids.length > 0 ? contact.allJids : [contact.remoteJid];
        } else {
          targetJids = [leadIdOrJid];
        }
      } else {
        const lead = leads.find(l => l.id === leadIdOrJid);
        if (lead) {
          leadId = lead.id;
          const realChat = realChatMap.get(lead.id);
          if (realChat?.allJids && realChat.allJids.length > 0) {
            targetJids = realChat.allJids;
          } else if (realChat?.remoteJid) {
            targetJids = [realChat.remoteJid];
          } else {
            const clean = lead.telefone.replace(/\D/g, '');
            const ddi = clean.startsWith('55') ? clean : `55${clean}`;
            targetJids = [`${ddi}@s.whatsapp.net`];
          }
        }
      }

      if (targetJids.length > 0) {
        const msgs = await whatsappService.getRealMessages(session, targetJids, leadId);

        if (isContactUnlinked) {
          const discoveredName = [...msgs].reverse().find(m => !m.fromMe && m.senderName)?.senderName;
          if (discoveredName) {
            setUnlinkedContacts(prev =>
              prev.map(c =>
                c.id === leadIdOrJid && /^\+?[\d\s().-]+$/.test(c.nome.trim())
                  ? { ...c, nome: discoveredName }
                  : c
              )
            );
          }
        }

        // Preserve recently sent optimistic/audio messages not yet indexed or keep local base64 audioUrl
        const now = Date.now();
        recentSentMessagesRef.current = recentSentMessagesRef.current.filter(item => now - item.sentAt < 25000);
        const recentForChat = recentSentMessagesRef.current.filter(item => item.chatKey === leadIdOrJid);

        const merged = msgs.map(m => {
          const matchingRecent = recentForChat.find(r => r.msg.id === m.id && r.msg.audioUrl);
          return matchingRecent ? { ...m, audioUrl: matchingRecent.msg.audioUrl } : m;
        });

        for (const recent of recentForChat) {
          const alreadyPresent = merged.some(
            m =>
              m.id === recent.msg.id ||
              (m.fromMe &&
                m.text === recent.msg.text &&
                Math.abs(new Date(m.timestamp).getTime() - new Date(recent.msg.timestamp).getTime()) < 15000)
          );
          if (!alreadyPresent) {
            merged.push(recent.msg);
          }
        }

        setMessages(merged);
      } else if (leadId) {
        const msgs = await whatsappService.getMessages(leadId);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Falha ao carregar mensagens:', err);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
    }
  };

  // Initial load and periodic synchronization (mirroring)
  useEffect(() => {
    loadChats();
  }, [isConnected, session, leads]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      loadChats();
      if (selectedLeadId) {
        const isCurUnlinked = unlinkedContacts.some(c => c.id === selectedLeadId);
        loadMessages(selectedLeadId, isCurUnlinked, true);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isConnected, session, selectedLeadId, unlinkedContacts]);

  useEffect(() => {
    if (selectedLeadId && isConnected) {
      const isCurUnlinked = unlinkedContacts.some(c => c.id === selectedLeadId);
      loadMessages(selectedLeadId, isCurUnlinked, false);
    } else {
      setMessages([]);
    }
  }, [selectedLeadId, isConnected]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      alert('Permissão de microfone necessária para gravar mensagens de áudio.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const finishAndSendAudio = async () => {
    if (!mediaRecorderRef.current || (!selectedLead && !unlinkedContact)) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const duration = recordingSeconds;
    const recorder = mediaRecorderRef.current;
    const currentChatKey = selectedLead?.id || unlinkedContact?.id || '';

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach((track) => track.stop());
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        if (!base64Audio) return;

        const targetPhone = isUnlinked && unlinkedContact 
          ? (unlinkedContact.rawPhone || unlinkedContact.remoteJid || unlinkedContact.telefone)
          : selectedLead?.telefone;

        if (!targetPhone) return;

        const tempId = `optimistic-audio-${Date.now()}`;
        const optimisticMsg: WhatsAppMessage = {
          id: tempId,
          leadId: currentChatKey,
          fromMe: true,
          text: '🎤 Mensagem de áudio',
          mediaType: 'audio',
          audioUrl: base64Audio,
          audioDuration: duration,
          timestamp: new Date().toISOString(),
          status: 'delivered',
        };
        recentSentMessagesRef.current.push({ chatKey: currentChatKey, msg: optimisticMsg, sentAt: Date.now() });
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
          const sentMsg = await whatsappService.sendAudioMessage(
            session,
            targetPhone,
            base64Audio,
            selectedLead?.corretorId,
            selectedLead?.id,
            duration
          );
          if (!sentMsg) {
            throw new Error('Evolution API rejected audio message');
          }
          const updatedMsg: WhatsAppMessage = {
            ...optimisticMsg,
            id: sentMsg.id || tempId,
            audioUrl: base64Audio,
          };
          recentSentMessagesRef.current = recentSentMessagesRef.current.map(item =>
            item.msg.id === tempId ? { ...item, msg: updatedMsg, sentAt: Date.now() } : item
          );
          setMessages((prev) => prev.map((m) => (m.id === tempId ? updatedMsg : m)));
        } catch (err) {
          console.error('Falha ao enviar áudio:', err);
          recentSentMessagesRef.current = recentSentMessagesRef.current.filter(item => item.msg.id !== tempId);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          alert('Erro ao enviar áudio.');
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.stop();
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedLeadId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (isUnlinked && unlinkedContact) {
      const tempId = `unlinked-msg-${Date.now()}`;
      const optimisticMsg: WhatsAppMessage = {
        id: tempId,
        leadId: unlinkedContact.id,
        fromMe: true,
        text: textToSend,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      recentSentMessagesRef.current.push({ chatKey: unlinkedContact.id, msg: optimisticMsg, sentAt: Date.now() });
      setMessages(prev => [...prev, optimisticMsg]);

      try {
        await whatsappService.sendMessage(
          unlinkedContact.rawPhone || unlinkedContact.remoteJid,
          textToSend,
          session,
          undefined,
          undefined,
          unlinkedContact.rawPhone || unlinkedContact.telefone
        );
      } catch (err) {
        console.error('Falha ao enviar mensagem para contato não vinculado:', err);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (selectedLead) {
      const tempId = `lead-msg-${Date.now()}`;
      const optimisticMsg: WhatsAppMessage = {
        id: tempId,
        leadId: selectedLead.id,
        fromMe: true,
        text: textToSend,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      recentSentMessagesRef.current.push({ chatKey: selectedLead.id, msg: optimisticMsg, sentAt: Date.now() });
      setMessages(prev => [...prev, optimisticMsg]);

      try {
        await whatsappService.sendMessage(
          selectedLead.id,
          textToSend,
          session,
          selectedLead.corretorId,
          undefined,
          selectedLead.telefone
        );
        if (onUpdateLead) {
          onUpdateLead(selectedLead.id, { ultimaInteracaoAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Falha ao enviar mensagem:', err);
        alert('Erro ao enviar mensagem.');
        setInputText(textToSend); // restore
      } finally {
        setIsSending(false);
      }
    }
  };

  // Simulate an incoming response from the lead (useful for testing real-time interaction)
  const handleSimulateIncoming = async () => {
    if (!selectedLeadId || !selectedLead) return;
    const simResponses = [
      'Perfeito! Vou verificar com a minha esposa e já te confirmo.',
      'Você consegue me enviar a simulação da parcela por favor?',
      'Acabei de separar os holerites e o comprovante de endereço. Já te envio!',
      'Gostei muito do projeto. O estande abre amanhã em qual horário?',
      'Ótimo! Obrigado pelo retorno rápido.'
    ];
    const randomResp = simResponses[Math.floor(Math.random() * simResponses.length)];
    try {
      const simMsg = await whatsappService.simulateIncomingMessage(selectedLeadId, randomResp);
      setMessages(prev => [...prev, simMsg]);
    } catch (err) {
      console.error('Erro ao simular resposta:', err);
    }
  };

  // Use quick response snippet
  const handleApplyTemplate = (texto: string) => {
    setInputText(texto);
  };

  // Filter conversations
  const filteredLeads = isConnected 
    ? leads.filter(lead => {
        const matchesSearch = 
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.telefone.includes(searchTerm) ||
          (lead.empreendimentoInteresse && lead.empreendimentoInteresse.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStage = stageFilter === 'all' || lead.statusFunil === stageFilter;

        return matchesSearch && matchesStage;
      })
    : [];

  const quickTemplates = whatsappService.getQuickTemplates(selectedLead);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-slate-100 overflow-hidden">
      
      {/* Top Connection Banner if disconnected */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>
              <strong>WhatsApp Desconectado:</strong> Conecte sua conta via QR Code para habilitar o envio e espelhamento em tempo real.
            </span>
          </div>
          <button
            onClick={onOpenConnectModal}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            Conectar QR Code
          </button>
        </div>
      )}

      {/* Main Inbox Workspace (3 Columns) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMN 1: CONVERSATIONS LIST (LEFT PANE)                  */}
        {/* ========================================================= */}
        <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10">
          
          {/* Header & Status */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Conversas WhatsApp</h3>
              </div>

              {/* Status Badge */}
              <button
                onClick={onOpenConnectModal}
                title="Configurar Conexão WhatsApp"
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isConnected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-600" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Conectar</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, telefone ou projeto..."
                disabled={!isConnected}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Stage Filter Chips */}
            {isConnected && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
                <button
                  onClick={() => setStageFilter('all')}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    stageFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({leads.length + unlinkedContacts.length})
                </button>
                <button
                  onClick={() => setStageFilter('sem_lead')}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    stageFilter === 'sem_lead'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sem Lead ({unlinkedContacts.length})
                </button>
                <button
                  onClick={() => setStageFilter('novo_lead')}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    stageFilter === 'novo_lead'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Novos
                </button>
                <button
                  onClick={() => setStageFilter('visita_agendada')}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    stageFilter === 'visita_agendada'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Visitas
                </button>
                <button
                  onClick={() => setStageFilter('aguardando_docs')}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    stageFilter === 'aguardando_docs'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Docs
                </button>
              </div>
            )}
          </div>

          {/* Conversations List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {!isConnected ? (
              /* Disconnected Empty State */
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                  <WifiOff className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">WhatsApp Desconectado</h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[220px] leading-relaxed">
                  Conecte seu WhatsApp via QR Code para visualizar suas conversas e contatos nesta tela.
                </p>
                <button
                  onClick={onOpenConnectModal}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Conectar Agora
                </button>
              </div>
            ) : (
              <>
                {/* Unlinked contacts without a lead in the sales funnel */}
                {(stageFilter === 'all' || stageFilter === 'sem_lead') && unlinkedContacts.map(contact => {
                  const isSelected = contact.id === selectedLeadId;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedLeadId(contact.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                        isSelected 
                          ? 'bg-amber-50/80 border-l-4 border-l-amber-500' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative">
                        {contact.profilePicUrl && !brokenPics[contact.profilePicUrl] ? (
                          <img 
                            src={contact.profilePicUrl} 
                            alt={contact.nome} 
                            onError={() => setBrokenPics(prev => ({ ...prev, [contact.profilePicUrl!]: true }))}
                            className="w-10 h-10 rounded-2xl object-cover shadow-xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                            {contact.nome.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'WA'}
                          </div>
                        )}
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {contact.nome}
                          </h4>
                          <span className="text-[10px] text-amber-600 font-semibold">
                            {contact.enviadaAt ? new Date(contact.enviadaAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">
                          {contact.mensagem}
                        </p>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            ● Sem Lead no Funil
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {contact.telefone}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stageFilter !== 'sem_lead' && filteredLeads.map(lead => {
                  const isSelected = lead.id === selectedLeadId;
                  const stageConf = STAGE_CONFIG[lead.statusFunil] || STAGE_CONFIG.novo_lead;
                  const realChat = realChatMap.get(lead.id);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                        isSelected 
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Lead Avatar */}
                      <div className="relative">
                        {realChat?.profilePicUrl && !brokenPics[realChat.profilePicUrl] ? (
                          <img 
                            src={realChat.profilePicUrl}
                            alt={lead.nome}
                            onError={() => setBrokenPics(prev => ({ ...prev, [realChat.profilePicUrl]: true }))}
                            className="w-10 h-10 rounded-2xl object-cover shadow-xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                            {lead.nome.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'LD'}
                          </div>
                        )}
                        {realChat ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" title="WhatsApp Ativo" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                        )}
                      </div>

                      {/* Info Column */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {lead.nome}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {realChat?.lastMessageTimestamp 
                              ? new Date(realChat.lastMessageTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              : new Date(lead.ultimaInteracaoAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        {/* Empreendimento or Last WhatsApp Message */}
                        {realChat?.lastMessage ? (
                          <p className="text-[11px] text-slate-500 truncate">
                            {realChat.lastMessage}
                          </p>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-brand-600 font-medium">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.empreendimentoInteresse}</span>
                          </div>
                        )}

                        {/* Stage Badge & Phone */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stageConf.badge}`}>
                            {stageConf.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lead.telefone}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredLeads.length === 0 && unlinkedContacts.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhuma conversa encontrada
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: ACTIVE CHAT WINDOW (CENTER PANE)               */}
        {/* ========================================================= */}
        {isConnected && (selectedLead || unlinkedContact) ? (
          <div className="flex-1 flex flex-col bg-[#F0F2F5] relative overflow-hidden">
            
            {/* Chat Top Header */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-2xs z-10 gap-3">
              {/* Left: Avatar & Contact Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  {(() => {
                    const headerPic = isUnlinked ? unlinkedContact?.profilePicUrl : realChatMap.get(selectedLead?.id || '')?.profilePicUrl;
                    const headerName = isUnlinked ? unlinkedContact!.nome : selectedLead!.nome;
                    if (headerPic && !brokenPics[headerPic]) {
                      return (
                        <img 
                          src={headerPic}
                          alt={headerName}
                          onError={() => setBrokenPics(prev => ({ ...prev, [headerPic]: true }))}
                          className="w-9 h-9 rounded-2xl object-cover shadow-xs"
                        />
                      );
                    }
                    return (
                      <div className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                        isUnlinked 
                          ? 'bg-gradient-to-tr from-amber-600 to-orange-500' 
                          : 'bg-gradient-to-tr from-brand-600 to-amber-500'
                      }`}>
                        {headerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'WA'}
                      </div>
                    );
                  })()}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {isUnlinked ? unlinkedContact!.nome : selectedLead!.nome}
                    </h3>
                    {isUnlinked ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex-shrink-0">
                        ● Sem Card no Funil
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        online
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                    <span>{isUnlinked ? unlinkedContact!.telefone : selectedLead!.telefone}</span>
                    {selectedLead?.empreendimentoInteresse && (
                      <>
                        <span>•</span>
                        <span className="text-brand-600 font-medium truncate flex items-center gap-0.5">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {selectedLead.empreendimentoInteresse}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: Chat Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isUnlinked ? (
                  /* Action to generate lead for unlinked contact */
                  <button
                    onClick={() => onOpenCreateLead?.({
                      nome: unlinkedContact!.nome,
                      telefone: unlinkedContact!.telefone,
                      origemLead: 'whatsapp',
                      empreendimentoInteresse: empreendimentos[0]?.nome || 'Link Itaquera'
                    })}
                    className="px-3 py-1.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Gerar Lead</span>
                  </button>
                ) : (
                  <>
                    {/* Live Funnel Stage Selector */}
                    <div className="relative">
                      <select
                        value={selectedLead!.statusFunil}
                        onChange={(e) => onLeadStageChange && onLeadStageChange(selectedLead!.id, e.target.value as FunnelStage)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                      >
                        <option value="novo_lead">Novo Lead</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="visita_agendada">Visita Agendada</option>
                        <option value="aguardando_docs">Aguardando Docs</option>
                        <option value="analise_credito">Análise Crédito</option>
                        <option value="proposta">Proposta</option>
                        <option value="venda_fechada">Venda Fechada</option>
                        <option value="descartado">Descartado</option>
                      </select>
                    </div>

                    {/* Direct Button: Alimentar Perfil */}
                    <button
                      onClick={() => setShowRightDrawer(true)}
                      title="Alimentar informações coletadas no perfil do lead"
                      className="p-1.5 sm:px-2.5 sm:py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                      <span className="hidden md:inline">Perfil</span>
                    </button>

                    {/* Direct Schedule Visit */}
                    {onScheduleVisit && (
                      <button
                        onClick={() => onScheduleVisit(selectedLead!)}
                        title="Agendar Visita ao Estande"
                        className="p-1.5 sm:px-2.5 sm:py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Visita</span>
                      </button>
                    )}

                    {/* Direct View Lead CRM / Docs */}
                    {onSelectLeadForCRM && (
                      <button
                        onClick={() => onSelectLeadForCRM(selectedLead!)}
                        title="Ver Ficha Completa e Documentos Caixa"
                        className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Ficha</span>
                      </button>
                    )}
                  </>
                )}

                {/* Toggle Right CRM Drawer */}
                <button
                  onClick={() => setShowRightDrawer(prev => !prev)}
                  title="Alternar painel de dados do lead"
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    showRightDrawer 
                      ? 'bg-slate-800 text-white border-slate-800' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Date Header Separator */}
              <div className="flex justify-center my-2">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-200/80 text-slate-600 shadow-2xs">
                  Histórico Espelhado com WhatsApp Oficial
                </span>
              </div>

              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : (
                messages.map(msg => {
                  const contactOrLeadName = isUnlinked ? unlinkedContact?.nome : selectedLead?.nome;
                  const isContactNameNumeric = contactOrLeadName ? /^\+?[\d\s().-]+$/.test(contactOrLeadName.trim()) : true;
                  const senderDisplay = !isContactNameNumeric
                    ? contactOrLeadName
                    : (msg.senderName || undefined);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-100`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-xs relative text-xs leading-relaxed ${
                          msg.fromMe
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
                        {/* Sender Name if incoming */}
                        {!msg.fromMe && senderDisplay && (
                          <p className="text-[10px] font-bold text-emerald-700 mb-1">
                            {senderDisplay}
                          </p>
                        )}

                        {/* Message Content or Audio Message Player */}
                        {msg.mediaType === 'audio' || msg.text?.includes('🎤') ? (
                          <AudioMessagePlayer message={msg} sessionName={session} />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Footer: Timestamp & Double Check */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          msg.fromMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.fromMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Responses Bar */}
            <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Modelos:
              </span>

              {quickTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl.texto)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-brand-700 hover:border-orange-200 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {tpl.titulo}
                </button>
              ))}

              <button
                onClick={handleSimulateIncoming}
                title="Simular cliente respondendo agora (teste de espelhamento)"
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 ml-auto cursor-pointer"
              >
                <Bot className="w-3 h-3" />
                <span>Simular Resposta</span>
              </button>
            </div>

            {/* Input Bar with Voice Recording & Quick Typing */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              {isRecording ? (
                /* Active Audio Recording Bar */
                <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2">
                  <div className="flex items-center gap-2 text-rose-700 font-medium text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>Gravando áudio:</span>
                    <strong className="font-mono text-xs">{formatSec(recordingSeconds)}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      title="Cancelar gravação"
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={finishAndSendAudio}
                      title="Enviar áudio gravado"
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Text & Mic Bar */
                <>
                  <button
                    type="button"
                    title="Anexar arquivo ou simulação"
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Digite uma mensagem (Enter para enviar)..."
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 resize-none max-h-24 shadow-inner"
                  />

                  {inputText.trim() ? (
                    <button
                      type="submit"
                      disabled={isSending}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      title="Gravar mensagem de áudio"
                      className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-2xl border border-slate-200 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-3">
              <WhatsAppIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-700">
              {!isConnected ? 'WhatsApp Desconectado' : 'Selecione uma conversa'}
            </h4>
            <p className="text-xs max-w-sm mt-1">
              {!isConnected 
                ? 'Conecte sua conta do WhatsApp via QR Code para visualizar as mensagens e atender seus clientes em tempo real.'
                : 'Escolha um lead na lista ao lado para ver o histórico espelhado de mensagens do WhatsApp.'}
            </p>
            {!isConnected && (
              <button
                onClick={onOpenConnectModal}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Conectar Agora
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* COLUMN 3: QUICK CRM LEAD DRAWER (RIGHT PANE)             */}
        {/* ========================================================= */}
        {isConnected && (selectedLead || unlinkedContact) && showRightDrawer && (
          <div className="w-80 bg-white border-l border-slate-200 p-5 overflow-y-auto space-y-5 flex-shrink-0 animate-in slide-in-from-right-10 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                <span>{isUnlinked ? 'Contato do WhatsApp' : 'Ficha & Alimentação do Lead'}</span>
              </h4>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isUnlinked ? (
              /* UNLINKED CONTACT STATE */
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Contato Sem Lead no Funil</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Esta conversa foi iniciada pelo WhatsApp, mas o contato ainda não possui um card correspondente no Funil de Vendas do Grupo 3C.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Nome:</span>
                    <strong className="text-slate-900 font-bold text-sm">{unlinkedContact!.nome}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Telefone:</span>
                    <span className="text-slate-800 font-medium">{unlinkedContact!.telefone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCreateLead?.({
                    nome: unlinkedContact!.nome,
                    telefone: unlinkedContact!.telefone,
                    origemLead: 'whatsapp',
                    empreendimentoInteresse: empreendimentos[0]?.nome || 'Link Itaquera'
                  })}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Gerar Lead no Funil Agora</span>
                </button>
              </div>
            ) : selectedLead ? (
              /* LINKED LEAD - ALIMENTAR PERFIL DO LEAD FORM */
              <div className="space-y-4">

                {/* Form: Alimentar Perfil com Dados da Conversa */}
                <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                      Alimentar Perfil do Lead
                    </span>
                    <span className="text-[10px] text-brand-700 font-medium">
                      Dados do Chat
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    Atualize os dados e anotações obtidas durante a conversa diretamente no CRM:
                  </p>

                  {/* Renda Mensal */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Renda Bruta Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={editRenda}
                      onChange={(e) => setEditRenda(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 3500"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Parcela Máx (30%): <strong className="text-brand-700">R$ {((Number(editRenda) || 0) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  {/* Saldo FGTS */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Saldo FGTS (R$)
                    </label>
                    <input
                      type="number"
                      value={editFgts}
                      onChange={(e) => setEditFgts(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 12000"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 font-semibold"
                    />
                  </div>

                  {/* Empreendimento */}
                  {empreendimentos.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Empreendimento de Interesse
                      </label>
                      <select
                        value={editEmpreendimento}
                        onChange={(e) => setEditEmpreendimento(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-medium"
                      >
                        {empreendimentos.map(emp => (
                          <option key={emp.id} value={emp.nome}>{emp.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Etapa no Funil */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Etapa no Funil de Vendas
                    </label>
                    <select
                      value={editStatusFunil}
                      onChange={(e) => setEditStatusFunil(e.target.value as FunnelStage)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-semibold"
                    >
                      <option value="novo_lead">Novo Lead</option>
                      <option value="em_atendimento">Em Atendimento</option>
                      <option value="visita_agendada">Visita Agendada</option>
                      <option value="aguardando_docs">Aguardando Documentação</option>
                      <option value="analise_credito">Análise de Crédito</option>
                      <option value="proposta">Proposta & Negociação</option>
                      <option value="venda_fechada">Venda Fechada</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  {/* Anotações da Conversa */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Anotações da Conversa / Observações
                    </label>
                    <textarea
                      value={editObservacoes}
                      onChange={(e) => setEditObservacoes(e.target.value)}
                      rows={3}
                      placeholder="Informações colhidas no chat (ex: casado, entrada facilitada em 36x, FGTS ativo)..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 resize-none"
                    />
                  </div>

                  {/* Botão Salvar Perfil */}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Salvando...' : 'Salvar no Perfil do Lead'}</span>
                  </button>

                  {/* Feedback Mensagem de Sucesso */}
                  {saveSuccessMsg && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Perfil atualizado com sucesso no CRM!</span>
                    </div>
                  )}
                </div>

                {/* Document Checklist Summary */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Documentos Caixa</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {selectedLead.checklistProgress ? `${selectedLead.checklistProgress.coletados}/${selectedLead.checklistProgress.total}` : '0/6'}
                    </span>
                  </div>

                  {selectedLead.checklistProgress?.temRejeitado && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 font-semibold">
                      ⚠️ Documento recusado pela assessoria
                    </div>
                  )}

                  {selectedLead.motivoRejeicaoCredito && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800">
                      <strong>Recusa:</strong> {selectedLead.motivoRejeicaoCredito}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500">
                    Acompanhe o checklist documental completo ou envie a lista de pendências direto pelo chat.
                  </p>
                </div>

                {/* Button to open full modal */}
                {onSelectLeadForCRM && (
                  <button
                    type="button"
                    onClick={() => onSelectLeadForCRM(selectedLead)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Abrir Ficha Completa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>
            ) : null}

          </div>
        )}

      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Lead, FunnelStage, WhatsAppMessage, WhatsAppInstance } from '../../types';
import { whatsappService, formatWhatsAppTimestamp } from '../../services/whatsappService';
import { formatCPF, isValidCPF } from '../../utils/cpfValidator';
import { 
  Search, 
  Send, 
  Paperclip, 
  Building2, 
  Calendar, 
  FileCheck2, 
  CheckCheck, 
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
  Check,
  ListFilter,
  Image as ImageIcon,
  FileText,
  Download,
  X
} from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface WhatsAppInboxViewProps {
  leads: Lead[];
  initialSelectedLeadId?: string | null;
  instance: WhatsAppInstance | null;
  empreendimentos?: { id: string; nome: string; construtora?: string; regiaoSp?: string }[];
  onSelectLeadForCRM?: (lead: Lead) => void;
  onScheduleVisit?: (lead: Lead) => void;
  onLeadStageChange?: (leadId: string, newStage: FunnelStage) => void;
  onOpenConnectModal: () => void;
  onOpenCreateLead?: (initial?: Partial<Lead>) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onUnreadCountChange?: (count: number) => void;
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
  unreadMessageKeys?: Array<{ id: string; fromMe: boolean; remoteJid: string }>;
  profilePicUrl?: string;
  lastFromMe?: boolean;
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
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

/**
 * Embedded Image Message Viewer with lazy Base64 loading
 */
const ImageMessageViewer: React.FC<{ message: WhatsAppMessage; sessionName: string }> = ({ message, sessionName }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(message.mediaUrl || null);
  const [isLoadingImg, setIsLoadingImg] = useState(false);

  useEffect(() => {
    if (message.mediaUrl) {
      setImgSrc(message.mediaUrl);
      return;
    }
    let mounted = true;
    setIsLoadingImg(true);
    whatsappService.getMediaBase64(sessionName, message.id)
      .then(media => {
        if (mounted && media?.base64) {
          const mime = media.mimetype && media.mimetype.startsWith('image/') ? media.mimetype : 'image/jpeg';
          setImgSrc(`data:${mime};base64,${media.base64}`);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingImg(false);
      });
    return () => { mounted = false; };
  }, [message.id, message.mediaUrl, sessionName]);

  const caption = message.text && message.text !== '📷 Imagem' ? message.text : '';

  return (
    <div className="space-y-1.5 my-0.5">
      {imgSrc ? (
        <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-black/10">
          <img
            src={imgSrc}
            alt={caption || 'Imagem do WhatsApp'}
            className="max-h-64 w-auto object-cover rounded-xl hover:opacity-95 transition-opacity"
          />
        </a>
      ) : isLoadingImg ? (
        <div className="w-48 h-36 rounded-xl bg-black/10 animate-pulse flex items-center justify-center text-[11px]">
          Carregando imagem...
        </div>
      ) : (
        <div className="flex items-center gap-1.5 py-1">
          <ImageIcon className="w-4 h-4 flex-shrink-0" />
          <span>{message.text || '📷 Imagem'}</span>
        </div>
      )}
      {caption && <p className="whitespace-pre-wrap pt-0.5">{caption}</p>}
    </div>
  );
};

/**
 * Embedded Document Message Viewer with download support
 */
const DocumentMessageViewer: React.FC<{ message: WhatsAppMessage; sessionName: string }> = ({ message, sessionName }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const docName = message.mediaName || (message.text?.startsWith('📄') ? message.text.replace(/^📄\s*/, '') : 'Documento');
  const caption = message.text && !message.text.startsWith('📄') && message.text !== docName ? message.text : '';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let dataUrl = message.mediaUrl;
      if (!dataUrl || !dataUrl.startsWith('data:')) {
        const media = await whatsappService.getMediaBase64(sessionName, message.id);
        if (media?.base64) {
          dataUrl = `data:${media.mimetype || 'application/octet-stream'};base64,${media.base64}`;
        }
      }
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = docName || 'documento';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Não foi possível baixar o documento.');
      }
    } catch {
      alert('Erro ao baixar documento.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-1.5 my-0.5">
      <div
        onClick={handleDownload}
        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition-colors border ${
          message.fromMe
            ? 'bg-emerald-700/60 hover:bg-emerald-700/80 border-emerald-500/40 text-white'
            : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            message.fromMe ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate max-w-[180px] sm:max-w-[220px]">{docName}</p>
            <span className={`text-[10px] ${message.fromMe ? 'text-emerald-100' : 'text-slate-500'}`}>
              {isDownloading ? 'Baixando arquivo...' : 'Clique para baixar'}
            </span>
          </div>
        </div>
        <Download className="w-4 h-4 flex-shrink-0 opacity-80" />
      </div>
      {caption && <p className="whitespace-pre-wrap pt-0.5">{caption}</p>}
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
  onUpdateLead,
  onUnreadCountChange
}) => {
  const isConnected = instance?.status === 'connected';
  const session = instance?.sessionName || '3c_vendedor';

  const [unlinkedContacts, setUnlinkedContacts] = useState<UnlinkedContact[]>([]);
  const [realChatMap, setRealChatMap] = useState<Map<string, any>>(new Map());
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [brokenPics, setBrokenPics] = useState<Record<string, boolean>>({});
  const recentSentMessagesRef = useRef<Array<{ chatKey: string; msg: WhatsAppMessage; sentAt: number }>>([]);
  const readTimestampsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`3c_read_v3_${session}`);
      readTimestampsRef.current = raw ? JSON.parse(raw) : {};
    } catch {
      readTimestampsRef.current = {};
    }
  }, [session]);

  const markConversationRead = (
    chatId: string,
    allJids?: string[],
    unreadMessageKeys?: Array<{ id: string; fromMe: boolean; remoteJid: string }>
  ) => {
    const now = Date.now();
    readTimestampsRef.current[chatId] = now;
    if (allJids) {
      for (const j of allJids) {
        readTimestampsRef.current[j] = now;
      }
    }
    try {
      localStorage.setItem(`3c_read_v3_${session}`, JSON.stringify(readTimestampsRef.current));
    } catch {
      // ignore
    }

    setUnlinkedContacts(prev =>
      prev.map(c => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
    setRealChatMap(prev => {
      if (!prev.has(chatId)) return prev;
      const next = new Map(prev);
      const cur = next.get(chatId);
      if (cur) next.set(chatId, { ...cur, unreadCount: 0 });
      return next;
    });

    if (allJids && allJids.length > 0) {
      whatsappService.markChatAsRead(session, allJids, unreadMessageKeys);
    }
  };

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialSelectedLeadId || (leads[0]?.id || null)
  );

  // Sync selectedLeadId whenever initialSelectedLeadId changes (e.g., after creating a lead via Gerar Lead)
  useEffect(() => {
    if (initialSelectedLeadId) {
      setSelectedLeadId(initialSelectedLeadId);
    }
  }, [initialSelectedLeadId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isStageFilterOpen, setIsStageFilterOpen] = useState(false);
  const stageFilterMenuRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  // Attachment States
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    fileName: string;
    mimeType: string;
    base64: string;
    size: number;
    isImage: boolean;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stageFilterMenuRef.current && !stageFilterMenuRef.current.contains(e.target as Node)) {
        setIsStageFilterOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectConversation = (
    id: string,
    allJids?: string[],
    unreadMessageKeys?: Array<{ id: string; fromMe: boolean; remoteJid: string }>
  ) => {
    setSelectedLeadId(id);
    markConversationRead(id, allJids, unreadMessageKeys);
  };

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // States for Lead Profile Drawer (matching exact structure & order of NewLeadModal)
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editCpfError, setEditCpfError] = useState<string | null>(null);
  const [editRenda, setEditRenda] = useState<number | ''>('');
  const [editFgts, setEditFgts] = useState<number | ''>('');
  const [editEmpreendimento, setEditEmpreendimento] = useState('');
  const [editOrigem, setEditOrigem] = useState<'whatsapp' | 'zap' | 'meta' | 'google' | 'indicacao'>('whatsapp');
  const [editStatusFunil, setEditStatusFunil] = useState<FunnelStage>('novo_lead');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedLead = isConnected ? (leads.find(l => l.id === selectedLeadId) || null) : null;
  const unlinkedContact = isConnected ? (unlinkedContacts.find(c => c.id === selectedLeadId) || null) : null;
  const isUnlinked = Boolean(unlinkedContact && !selectedLead);

  const applyFetchedPictures = (picMap: Record<string, string>) => {
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
  };

  // Load real chats from Evolution API
  const loadChats = async () => {
    if (!isConnected) {
      setUnlinkedContacts([]);
      setRealChatMap(new Map());
      onUnreadCountChange?.(0);
      setIsLoadingChats(false);
      return;
    }

    try {
      const chats = await whatsappService.getRealChats(session);
      const unlinkedList: UnlinkedContact[] = [];
      const chatMap = new Map<string, any>();

      const ownDigits = (instance?.phoneNumber || '').replace(/\D/g, '');
      const isFirstSeed = Object.keys(readTimestampsRef.current).length === 0;
      let seedModified = false;
      let transitionedLeadId: string | null = null;

      for (const chat of chats) {
        const cleanChatDigits = (chat.rawPhone || '').replace(/\D/g, '');
        // Skip broker's own number self-chat if present
        if (ownDigits && cleanChatDigits && ownDigits.length >= 8 && cleanChatDigits.slice(-8) === ownDigits.slice(-8)) {
          continue;
        }

        const msgTs = new Date(chat.lastMessageTimestamp || 0).getTime();
        const hasExplicitRealUnread =
          !chat.isReadOnPhone &&
          typeof chat.rawUnreadCount === 'number' &&
          chat.rawUnreadCount >= 1 &&
          chat.rawUnreadCount <= 20 &&
          !chat.lastFromMe;

        // On first initialization of this session, mark existing chats as read unless Evolution reports 1..20 unread messages
        if (isFirstSeed && !hasExplicitRealUnread && (!chat.unreadMessageKeys || chat.unreadMessageKeys.length === 0 || chat.isReadOnPhone)) {
          readTimestampsRef.current[chat.remoteJid] = msgTs;
          seedModified = true;
        }

        const matchedLead = leads.find(l => {
          const leadDigits = (l.telefone || '').replace(/\D/g, '');
          if (!leadDigits || !cleanChatDigits) return false;
          return leadDigits.slice(-8) === cleanChatDigits.slice(-8);
        });

        // If the user just generated a lead for the currently selected unlinked contact, seamlessly transition selection to the new lead ID
        if (
          matchedLead &&
          selectedLeadId &&
          (selectedLeadId === chat.remoteJid || chat.allJids?.includes(selectedLeadId))
        ) {
          transitionedLeadId = matchedLead.id;
        }

        const chatKey = matchedLead ? matchedLead.id : chat.remoteJid;
        const isCurrentlySelected = chatKey === selectedLeadId || chatKey === transitionedLeadId;
        const lastReadTs = Math.max(
          readTimestampsRef.current[chatKey] || 0,
          readTimestampsRef.current[chat.remoteJid] || 0
        );

        let effectiveUnread = 0;
        if (chat.isReadOnPhone || chat.rawUnreadCount === 0 || chat.lastFromMe) {
          effectiveUnread = 0;
          if (msgTs > (readTimestampsRef.current[chat.remoteJid] || 0)) {
            readTimestampsRef.current[chat.remoteJid] = msgTs;
            seedModified = true;
          }
        } else if (isCurrentlySelected) {
          effectiveUnread = 0;
          if (msgTs > (readTimestampsRef.current[chat.remoteJid] || 0)) {
            readTimestampsRef.current[chat.remoteJid] = msgTs;
            seedModified = true;
          }
          // Synchronize read status back to WhatsApp on phone since the conversation is open in CRM
          if (chat.allJids && chat.allJids.length > 0) {
            whatsappService.markChatAsRead(session, chat.allJids, chat.unreadMessageKeys);
          }
        } else if (!chat.lastFromMe && msgTs > lastReadTs) {
          if (hasExplicitRealUnread) {
            effectiveUnread = chat.rawUnreadCount;
          } else if (chat.unreadMessageKeys && chat.unreadMessageKeys.length > 0) {
            // Count unique message IDs
            const uniqueIds = new Set(chat.unreadMessageKeys.map((k: any) => k.id));
            effectiveUnread = uniqueIds.size || 1;
          } else {
            effectiveUnread = 1;
          }
        }

        const enrichedChat = {
          ...chat,
          unreadCount: effectiveUnread,
        };

        if (matchedLead) {
          chatMap.set(matchedLead.id, enrichedChat);
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
            unreadCount: effectiveUnread,
            unreadMessageKeys: chat.unreadMessageKeys,
            profilePicUrl: chat.profilePicUrl,
            lastFromMe: chat.lastFromMe,
            lastMessageStatus: chat.lastMessageStatus,
          });
        }
      }

      if (seedModified) {
        try {
          localStorage.setItem(`3c_read_v3_${session}`, JSON.stringify(readTimestampsRef.current));
        } catch {
          // ignore
        }
      }

      if (transitionedLeadId && transitionedLeadId !== selectedLeadId) {
        setSelectedLeadId(transitionedLeadId);
      }

      setRealChatMap(chatMap);
      setUnlinkedContacts(unlinkedList);

      // Auto-select first contact if none selected
      if (!selectedLeadId && !transitionedLeadId) {
        if (leads.length > 0 && chatMap.has(leads[0].id)) {
          setSelectedLeadId(leads[0].id);
        } else if (unlinkedList.length > 0) {
          setSelectedLeadId(unlinkedList[0].id);
        }
      }

      // Progressive background enrichment for missing profile pictures across the conversation list
      const missingPicJids = chats
        .slice(0, 180)
        .filter(c => !c.profilePicUrl && c.remoteJid)
        .map(c => c.remoteJid);

      if (missingPicJids.length > 0) {
        whatsappService.fetchProfilePicturesBatch(session, missingPicJids)
          .then(picMap => {
            applyFetchedPictures(picMap);
            if (missingPicJids.length > 25) {
              return whatsappService.fetchProfilePicturesBatch(session, missingPicJids.slice(25));
            }
            return {};
          })
          .then(picMap2 => {
            if (picMap2 && Object.keys(picMap2).length > 0) {
              applyFetchedPictures(picMap2);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.warn('Erro ao carregar chats reais:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Sync edit form state when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      setEditNome(selectedLead.nome || '');
      setEditTelefone(selectedLead.telefone || '');
      setEditEmail(selectedLead.email || '');
      setEditCpf(selectedLead.cpf ? formatCPF(selectedLead.cpf) : '');
      setEditCpfError(null);
      setEditRenda(selectedLead.rendaMensal || '');
      setEditFgts(selectedLead.fgtsValor || '');
      setEditEmpreendimento(selectedLead.empreendimentoInteresse || (empreendimentos[0]?.nome || 'A definir'));
      const validOrigens = ['whatsapp', 'zap', 'meta', 'google', 'indicacao'];
      setEditOrigem(validOrigens.includes(selectedLead.origemLead) ? (selectedLead.origemLead as any) : 'whatsapp');
      setEditStatusFunil(selectedLead.statusFunil);
      setEditObservacoes(selectedLead.observacoes || '');
    }
  }, [selectedLead?.id, selectedLead?.updatedAt]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLead || !onUpdateLead) return;
    if (!editNome.trim() || !editTelefone.trim()) {
      alert('Nome e telefone são obrigatórios.');
      return;
    }
    if (editCpf && !isValidCPF(editCpf)) {
      setEditCpfError('CPF inválido. Verifique os dígitos ou deixe em branco.');
      alert('O CPF informado é inválido. Por favor, verifique os dígitos ou deixe o campo em branco (opcional).');
      return;
    }

    setIsSavingProfile(true);
    try {
      await onUpdateLead(selectedLead.id, {
        nome: editNome.trim(),
        telefone: editTelefone.trim(),
        email: editEmail.trim() || undefined,
        cpf: editCpf.trim() || undefined,
        rendaMensal: editRenda === '' ? 0 : Number(editRenda),
        fgtsValor: editFgts === '' ? 0 : Number(editFgts),
        empreendimentoInteresse: editEmpreendimento || selectedLead.empreendimentoInteresse,
        origemLead: editOrigem,
        statusFunil: editStatusFunil,
        observacoes: editObservacoes.trim() || undefined,
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
          if (!contact.profilePicUrl && contact.remoteJid) {
            whatsappService.fetchProfilePicture(session, contact.remoteJid).then(url => {
              if (url) applyFetchedPictures({ [contact.remoteJid]: url });
            }).catch(() => {});
          }
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
          if (realChat && !realChat.profilePicUrl && realChat.remoteJid) {
            whatsappService.fetchProfilePicture(session, realChat.remoteJid).then(url => {
              if (url) applyFetchedPictures({ [realChat.remoteJid]: url });
            }).catch(() => {});
          }
        }
      }

      if (targetJids.length > 0) {
        const msgs = await whatsappService.getRealMessages(session, targetJids, leadId);

        // When opening or viewing a conversation, mark incoming messages as read in WhatsApp
        if (!isSilent) {
          whatsappService.markChatAsRead(session, targetJids);
        }

        if (isContactUnlinked) {
          const discoveredName = [...msgs].reverse().find(m => !m.fromMe && m.senderName)?.senderName;
          if (discoveredName) {
            setUnlinkedContacts(prev =>
              prev.map(c =>
                c.id === leadIdOrJid &&
                (c.nome === 'Contato WhatsApp' || /^\+?[\d\s().-]+$/.test(c.nome.trim()))
                  ? { ...c, nome: discoveredName }
                  : c
              )
            );
          }
        }

        // Preserve recently sent optimistic/audio/media messages not yet indexed or keep local base64 urls
        const now = Date.now();
        recentSentMessagesRef.current = recentSentMessagesRef.current.filter(item => now - item.sentAt < 25000);
        const recentForChat = recentSentMessagesRef.current.filter(item => item.chatKey === leadIdOrJid);

        const merged = msgs.map(m => {
          const matchingRecent = recentForChat.find(r => r.msg.id === m.id && (r.msg.audioUrl || r.msg.mediaUrl));
          return matchingRecent
            ? { ...m, audioUrl: matchingRecent.msg.audioUrl || m.audioUrl, mediaUrl: matchingRecent.msg.mediaUrl || m.mediaUrl }
            : m;
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

        const lastMsg = merged[merged.length - 1];
        if (lastMsg?.fromMe && lastMsg.status) {
          if (isContactUnlinked) {
            setUnlinkedContacts(prev =>
              prev.map(c => (c.id === leadIdOrJid ? { ...c, lastMessageStatus: lastMsg.status } : c))
            );
          } else if (leadId) {
            setRealChatMap(prev => {
              const cur = prev.get(leadId);
              if (!cur) return prev;
              const next = new Map(prev);
              next.set(leadId, { ...cur, lastMessageStatus: lastMsg.status });
              return next;
            });
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

  // Handle File Selection for Attachment (Photos & Documents)
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIsAttachMenuOpen(false);
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite de 25MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (base64) {
        setPendingAttachment({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64,
          size: file.size,
          isImage: file.type.startsWith('image/'),
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
    const currentJids = isUnlinked ? unlinkedContact?.allJids : realChatMap.get(selectedLead?.id || '')?.allJids;
    if (currentChatKey) {
      markConversationRead(currentChatKey, currentJids);
    }

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

  // Send text or media attachment message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !pendingAttachment) || !selectedLeadId) return;

    const textToSend = inputText.trim();
    const attachmentToSend = pendingAttachment;
    setInputText('');
    setPendingAttachment(null);
    setIsSending(true);

    const currentChatKey = isUnlinked && unlinkedContact ? unlinkedContact.id : (selectedLead?.id || selectedLeadId);
    const currentJids = isUnlinked && unlinkedContact
      ? unlinkedContact.allJids
      : realChatMap.get(selectedLead?.id || '')?.allJids;

    markConversationRead(currentChatKey, currentJids);

    // Handle Media Attachment Send (Photo or Document)
    if (attachmentToSend) {
      const targetPhone = isUnlinked && unlinkedContact
        ? (unlinkedContact.rawPhone || unlinkedContact.remoteJid || unlinkedContact.telefone)
        : selectedLead?.telefone;

      if (!targetPhone) {
        setIsSending(false);
        return;
      }

      const tempId = `optimistic-media-${Date.now()}`;
      const displayText = textToSend || (attachmentToSend.isImage ? '📷 Imagem' : `📄 ${attachmentToSend.fileName}`);
      const optimisticMsg: WhatsAppMessage = {
        id: tempId,
        leadId: currentChatKey,
        fromMe: true,
        text: displayText,
        mediaType: attachmentToSend.isImage ? 'image' : 'document',
        mediaName: attachmentToSend.fileName,
        mediaUrl: attachmentToSend.base64,
        timestamp: new Date().toISOString(),
        status: 'delivered',
      };
      recentSentMessagesRef.current.push({ chatKey: currentChatKey, msg: optimisticMsg, sentAt: Date.now() });
      setMessages(prev => [...prev, optimisticMsg]);

      try {
        const sentMsg = await whatsappService.sendMediaMessage(
          session,
          targetPhone,
          attachmentToSend.base64,
          attachmentToSend.fileName,
          attachmentToSend.mimeType,
          textToSend,
          selectedLead?.corretorId,
          selectedLead?.id
        );
        if (!sentMsg) {
          throw new Error('Evolution API rejected media attachment');
        }
        const updatedMsg: WhatsAppMessage = {
          ...optimisticMsg,
          id: sentMsg.id || tempId,
          mediaUrl: attachmentToSend.base64,
        };
        recentSentMessagesRef.current = recentSentMessagesRef.current.map(item =>
          item.msg.id === tempId ? { ...item, msg: updatedMsg, sentAt: Date.now() } : item
        );
        setMessages(prev => prev.map(m => (m.id === tempId ? updatedMsg : m)));
        if (selectedLead && onUpdateLead) {
          onUpdateLead(selectedLead.id, { ultimaInteracaoAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Falha ao enviar anexo:', err);
        recentSentMessagesRef.current = recentSentMessagesRef.current.filter(item => item.msg.id !== tempId);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert('Erro ao enviar arquivo anexado.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Handle Text Message Send
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

  // Total unread conversations/messages count
  const totalUnreadCount = isConnected
    ? unlinkedContacts.reduce((acc, c) => acc + ((c.unreadCount || 0) > 0 ? (c.unreadCount || 0) : 0), 0) +
      leads.reduce((acc, l) => acc + ((realChatMap.get(l.id)?.unreadCount || 0) > 0 ? realChatMap.get(l.id).unreadCount : 0), 0)
    : 0;

  useEffect(() => {
    onUnreadCountChange?.(totalUnreadCount);
  }, [totalUnreadCount]);

  // Filter unlinked contacts
  const filteredUnlinkedContacts = isConnected
    ? unlinkedContacts.filter(contact => {
        const matchesSearch =
          !searchTerm.trim() ||
          contact.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.telefone.includes(searchTerm) ||
          contact.rawPhone.includes(searchTerm);

        const matchesRead = readFilter === 'all' || (contact.unreadCount || 0) > 0;
        const matchesStage = stageFilter === 'all' || stageFilter === 'sem_lead';

        return matchesSearch && matchesRead && matchesStage;
      })
    : [];

  // Filter linked leads
  const filteredLeads = isConnected 
    ? leads.filter(lead => {
        const matchesSearch = 
          !searchTerm.trim() ||
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.telefone.includes(searchTerm) ||
          (lead.empreendimentoInteresse && lead.empreendimentoInteresse.toLowerCase().includes(searchTerm.toLowerCase()));

        if (stageFilter === 'sem_lead') return false;

        const unread = realChatMap.get(lead.id)?.unreadCount || 0;
        const matchesRead = readFilter === 'all' || unread > 0;
        const matchesStage = stageFilter === 'all' || lead.statusFunil === stageFilter;

        return matchesSearch && matchesRead && matchesStage;
      })
    : [];

  // Unified chronological conversation list (merging linked leads and unlinked contacts by latest timestamp)
  const unifiedConversations = [
    ...filteredUnlinkedContacts.map(contact => ({
      type: 'unlinked' as const,
      id: contact.id,
      timestamp: new Date(contact.enviadaAt || 0).getTime(),
      contact,
    })),
    ...filteredLeads.map(lead => {
      const realChat = realChatMap.get(lead.id);
      const tsStr = realChat?.lastMessageTimestamp || lead.ultimaInteracaoAt || lead.createdAt;
      return {
        type: 'lead' as const,
        id: lead.id,
        timestamp: new Date(tsStr || 0).getTime(),
        lead,
        realChat,
      };
    }),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const stageFilterOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Todas as Etapas' },
    { value: 'sem_lead', label: 'Sem Lead no Funil' },
    { value: 'novo_lead', label: 'Novo Lead' },
    { value: 'em_atendimento', label: 'Em Atendimento' },
    { value: 'visita_agendada', label: 'Visita Agendada' },
    { value: 'aguardando_docs', label: 'Aguardando Docs' },
    { value: 'analise_credito', label: 'Análise Crédito' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'venda_fechada', label: 'Venda Fechada' },
    { value: 'descartado', label: 'Descartado' },
  ];

  const activeStageLabel = stageFilterOptions.find(o => o.value === stageFilter)?.label;

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

            {/* Two Tabs ("Todos" and "Não lidas") + Funnel Stage Filter Icon */}
            {isConnected && (
              <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReadFilter('all')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                      readFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({leads.length + unlinkedContacts.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setReadFilter('unread')}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      readFilter === 'unread'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : totalUnreadCount > 0
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-100'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Não lidas</span>
                    {totalUnreadCount > 0 && (
                      <span className={`px-1.5 py-0 rounded-full text-[10px] font-bold ${
                        readFilter === 'unread' ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white'
                      }`}>
                        {totalUnreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Funnel Stage Filter Icon & Dropdown */}
                <div className="relative flex items-center gap-1" ref={stageFilterMenuRef}>
                  {stageFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-brand-800 border border-orange-200 text-[10px] font-bold flex items-center gap-1 max-w-[115px]">
                      <span className="truncate">{activeStageLabel}</span>
                      <button
                        type="button"
                        onClick={() => setStageFilter('all')}
                        className="hover:text-brand-950 cursor-pointer flex-shrink-0"
                        title="Limpar filtro de etapa"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsStageFilterOpen(prev => !prev)}
                    title="Filtrar conversas por etapa do funil"
                    className={`p-1.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                      stageFilter !== 'all' || isStageFilterOpen
                        ? 'bg-brand-500 text-white border-brand-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                  </button>

                  {isStageFilterOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Filtrar Etapa do Funil
                      </div>
                      {stageFilterOptions.map(opt => {
                        const isSelected = stageFilter === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setStageFilter(opt.value);
                              setIsStageFilterOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-orange-50 text-brand-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Conversations List Scroll */}
          <div className="flex-1 overflow-y-auto">
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
            ) : isLoadingChats ? (
              /* Skeleton Screen for Conversations List */
              <div className="p-3 space-y-2.5">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="p-3 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 animate-pulse shadow-2xs">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="h-3.5 bg-slate-200 rounded-md w-32" />
                      </div>
                      <div className="h-3 bg-slate-100 rounded-md w-44" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-2.5 bg-slate-100 rounded-md w-20" />
                        <div className="h-2.5 bg-slate-200 rounded-md w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : unifiedConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Nenhuma conversa encontrada</p>
                <p className="text-[11px] text-slate-400 mt-1">Tente ajustar seus filtros de busca.</p>
              </div>
            ) : (
              <>
                {unifiedConversations.map(item => {
                  if (item.type === 'unlinked') {
                    const contact = item.contact;
                    const isSelected = contact.id === selectedLeadId;
                    const unreadCount = contact.unreadCount || 0;
                    const hasUnread = unreadCount > 0;
                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleSelectConversation(contact.id, contact.allJids, contact.unreadMessageKeys)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative border-b border-slate-100 ${
                          isSelected 
                            ? 'bg-amber-50/80' 
                            : hasUnread
                              ? 'bg-emerald-50/30 hover:bg-slate-50'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        )}

                        <div className="relative flex-shrink-0">
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
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs truncate ${hasUnread ? 'font-extrabold text-slate-950' : 'font-bold text-slate-900'}`}>
                              {contact.nome}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[11px] truncate flex items-center gap-1 ${hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                              {contact.lastFromMe && (
                                contact.lastMessageStatus === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                ) : contact.lastMessageStatus === 'sent' ? (
                                  <Check className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                )
                              )}
                              <span className="truncate">{contact.mensagem}</span>
                            </p>
                            {hasUnread && (
                              <span className="bg-emerald-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-2xs flex-shrink-0">
                                {unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              ● Sem Lead no Funil
                            </span>
                            <span className={`text-[10px] flex-shrink-0 font-medium ${hasUnread ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {formatWhatsAppTimestamp(contact.enviadaAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const { lead, realChat } = item;
                  const isSelected = lead.id === selectedLeadId;
                  const stageConf = STAGE_CONFIG[lead.statusFunil] || STAGE_CONFIG.novo_lead;
                  const unreadCount = realChat?.unreadCount || 0;
                  const hasUnread = unreadCount > 0;

                  return (
                    <div
                      key={lead.id}
                      onClick={() => handleSelectConversation(lead.id, realChat?.allJids, realChat?.unreadMessageKeys)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative border-b border-slate-100 ${
                        isSelected 
                          ? 'bg-amber-50/80' 
                          : hasUnread
                            ? 'bg-emerald-50/30 hover:bg-slate-50'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                      )}

                      {/* Lead Avatar */}
                      <div className="relative flex-shrink-0">
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
                      </div>

                      {/* Info Column */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs truncate ${hasUnread ? 'font-extrabold text-slate-950' : 'font-bold text-slate-900'}`}>
                            {lead.nome}
                          </h4>
                        </div>

                        {/* Empreendimento or Last WhatsApp Message */}
                        <div className="flex items-center justify-between gap-2">
                          {realChat?.lastMessage ? (
                            <p className={`text-[11px] truncate flex items-center gap-1 ${hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                              {realChat.lastFromMe && (
                                realChat.lastMessageStatus === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                ) : realChat.lastMessageStatus === 'sent' ? (
                                  <Check className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                )
                              )}
                              <span className="truncate">{realChat.lastMessage}</span>
                            </p>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-brand-600 font-medium truncate">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.empreendimentoInteresse}</span>
                            </div>
                          )}
                          {hasUnread && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-2xs flex-shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Stage Badge & Timestamp */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stageConf.badge}`}>
                            {stageConf.label}
                          </span>
                          <span className={`text-[10px] flex-shrink-0 font-medium ${hasUnread ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            {formatWhatsAppTimestamp(realChat?.lastMessageTimestamp || lead.ultimaInteracaoAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {isUnlinked ? unlinkedContact!.nome : selectedLead!.nome}
                    </h3>
                    {isUnlinked ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex-shrink-0">
                        ● Sem Lead no Funil
                      </span>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        (STAGE_CONFIG[selectedLead!.statusFunil] || STAGE_CONFIG.novo_lead).badge
                      }`}>
                        {(STAGE_CONFIG[selectedLead!.statusFunil] || STAGE_CONFIG.novo_lead).label}
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
                    <span>Gerar Lead</span>
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
                      title="Editar informações no perfil do lead"
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
                /* Skeleton Screen for Chat Messages */
                <div className="space-y-4 py-4 animate-pulse">
                  {/* Incoming bubble skeleton */}
                  <div className="flex justify-start">
                    <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 shadow-2xs space-y-2 w-64">
                      <div className="h-3 bg-slate-200 rounded w-20" />
                      <div className="h-3.5 bg-slate-100 rounded w-48" />
                      <div className="h-3 bg-slate-100 rounded w-32" />
                    </div>
                  </div>
                  {/* Outgoing bubble skeleton */}
                  <div className="flex justify-end">
                    <div className="p-3.5 rounded-2xl rounded-tr-xs bg-emerald-600/10 border border-emerald-200/60 shadow-2xs space-y-2 w-56">
                      <div className="h-3.5 bg-emerald-200/70 rounded w-40" />
                      <div className="h-3 bg-emerald-100/70 rounded w-28" />
                    </div>
                  </div>
                  {/* Incoming bubble skeleton */}
                  <div className="flex justify-start">
                    <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 shadow-2xs space-y-2 w-72">
                      <div className="h-3 bg-slate-200 rounded w-24" />
                      <div className="h-3.5 bg-slate-100 rounded w-60" />
                      <div className="h-3 bg-slate-100 rounded w-40" />
                    </div>
                  </div>
                  {/* Outgoing audio message bubble skeleton */}
                  <div className="flex justify-end">
                    <div className="p-3.5 rounded-2xl rounded-tr-xs bg-emerald-600/10 border border-emerald-200/60 shadow-2xs flex items-center gap-3 w-56">
                      <div className="w-8 h-8 rounded-full bg-emerald-200/80 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 bg-emerald-200/70 rounded-full w-full" />
                        <div className="h-2 bg-emerald-100/70 rounded w-14" />
                      </div>
                    </div>
                  </div>
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

                        {/* Message Content: Audio, Image, Document, or Text */}
                        {msg.mediaType === 'audio' || msg.text?.includes('🎤') ? (
                          <AudioMessagePlayer message={msg} sessionName={session} />
                        ) : msg.mediaType === 'image' ? (
                          <ImageMessageViewer message={msg} sessionName={session} />
                        ) : msg.mediaType === 'document' ? (
                          <DocumentMessageViewer message={msg} sessionName={session} />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Footer: Timestamp & Read Receipt Checkmarks */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          msg.fromMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.fromMe && (
                            msg.status === 'read' ? (
                              <span title="Mensagem lida (Confirmação de leitura)" className="inline-flex items-center">
                                <CheckCheck className="w-4 h-4 text-sky-300 stroke-[2.5] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                              </span>
                            ) : msg.status === 'sent' ? (
                              <span title="Mensagem enviada" className="inline-flex items-center">
                                <Check className="w-3.5 h-3.5 text-emerald-100/75" />
                              </span>
                            ) : (
                              <span title="Mensagem entregue" className="inline-flex items-center">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-100/75" />
                              </span>
                            )
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

            {/* Pending Attachment Preview Bar */}
            {pendingAttachment && (
              <div className="px-4 py-2.5 bg-emerald-50/90 border-t border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in duration-100">
                <div className="flex items-center gap-3 min-w-0">
                  {pendingAttachment.isImage ? (
                    <img
                      src={pendingAttachment.base64}
                      alt={pendingAttachment.fileName}
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-300 shadow-2xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[240px] sm:max-w-[360px]">
                      {pendingAttachment.fileName}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {pendingAttachment.isImage ? 'Foto / Imagem' : 'Documento'} • {formatFileSize(pendingAttachment.size)} — Digite uma legenda opcional abaixo ou clique em Enviar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  title="Remover anexo"
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hidden File Inputs for Photos & Documents */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              className="hidden"
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,application/*"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Input Bar with Attachment Menu, Voice Recording & Quick Typing */}
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
                /* Standard Attachment, Text & Mic Bar */
                <>
                  <div className="relative flex-shrink-0" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsAttachMenuOpen(prev => !prev)}
                      title="Anexar foto ou documento"
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isAttachMenuOpen || pendingAttachment
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {isAttachMenuOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <span>Fotos e Imagens</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => docInputRef.current?.click()}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span>Documento / Arquivo</span>
                        </button>
                      </div>
                    )}
                  </div>

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
                    placeholder={
                      pendingAttachment
                        ? 'Adicione uma legenda opcional (Enter para enviar)...'
                        : 'Digite uma mensagem (Enter para enviar)...'
                    }
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 resize-none max-h-24 shadow-inner"
                  />

                  {inputText.trim() || pendingAttachment ? (
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
          <div className="w-80 sm:w-88 bg-white border-l border-slate-200 p-5 overflow-y-auto space-y-5 flex-shrink-0 animate-in slide-in-from-right-10 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                <span>{isUnlinked ? 'Contato do WhatsApp' : 'Perfil do Lead'}</span>
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
                  <span>Gerar Lead</span>
                </button>
              </div>
            ) : selectedLead ? (
              /* LINKED LEAD - PERFIL DO LEAD (SAME STRUCTURE & ORDER AS NEW LEAD MODAL) */
              <div className="space-y-4 text-xs">
                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  
                  {/* 1. Nome Completo */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      placeholder="Ex: Juliana Mendes"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900"
                    />
                  </div>

                  {/* 2. Telefone WhatsApp & E-mail */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={editTelefone}
                        onChange={(e) => setEditTelefone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* 3. CPF */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">CPF</label>
                      <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                    </div>
                    <input
                      type="text"
                      maxLength={14}
                      value={editCpf}
                      onChange={(e) => {
                        const masked = formatCPF(e.target.value);
                        setEditCpf(masked);
                        if (masked && masked.replace(/\D/g, '').length === 11) {
                          if (!isValidCPF(masked)) {
                            setEditCpfError('CPF inválido. Verifique os dígitos.');
                          } else {
                            setEditCpfError(null);
                          }
                        } else {
                          setEditCpfError(null);
                        }
                      }}
                      onBlur={() => {
                        if (editCpf && !isValidCPF(editCpf)) {
                          setEditCpfError('CPF inválido. Verifique os dígitos.');
                        } else {
                          setEditCpfError(null);
                        }
                      }}
                      placeholder="000.000.000-00"
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                        editCpfError
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                          : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20 text-slate-900'
                      }`}
                    />
                    {editCpfError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{editCpfError}</p>
                    )}
                  </div>

                  {/* 4. Renda Bruta (R$) & Saldo FGTS (R$) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Renda Bruta (R$)</label>
                      <input
                        type="number"
                        step="100"
                        value={editRenda}
                        onChange={(e) => setEditRenda(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Ex: 5000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Saldo FGTS (R$)</label>
                      <input
                        type="number"
                        step="500"
                        value={editFgts}
                        onChange={(e) => setEditFgts(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Ex: 25000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>

                  {/* 5. Empreendimento de Interesse */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Empreendimento de Interesse</label>
                    <select
                      value={editEmpreendimento}
                      onChange={(e) => setEditEmpreendimento(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                    >
                      <option value="A definir">A definir / Em qualificação</option>
                      {empreendimentos.map(emp => (
                        <option key={emp.id} value={emp.nome}>
                          {emp.construtora ? `${emp.nome} (${emp.construtora})` : emp.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Origem do Lead & Etapa no Funil */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Origem do Lead</label>
                      <select
                        value={editOrigem}
                        onChange={(e) => setEditOrigem(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                      >
                        <option value="whatsapp">WhatsApp Direto</option>
                        <option value="zap">Portal Zap / VivaReal</option>
                        <option value="meta">Anúncio Meta (Instagram/Facebook)</option>
                        <option value="google">Google Ads</option>
                        <option value="indicacao">Indicação de Cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Etapa Inicial / Atual</label>
                      <select
                        value={editStatusFunil}
                        onChange={(e) => setEditStatusFunil(e.target.value as FunnelStage)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  </div>

                  {/* 7. Observações */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Observações</label>
                    <textarea
                      rows={2}
                      value={editObservacoes}
                      onChange={(e) => setEditObservacoes(e.target.value)}
                      placeholder="Informações adicionais do lead..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 resize-none"
                    />
                  </div>

                  {/* Botão Salvar Perfil */}
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>

                  {/* Feedback Mensagem de Sucesso */}
                  {saveSuccessMsg && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Perfil atualizado com sucesso no CRM!</span>
                    </div>
                  )}
                </form>

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
                    Acompanhe o checklist documental completo na ficha do lead.
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


export type UserRole = 'corretor' | 'gerente' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo?: string;
  phone?: string;
  creci?: string;
  avatarUrl?: string;
  whatsappConnected?: boolean;
  status?: 'ativo' | 'inativo';
  primeiroAcesso?: boolean;
  ultimoAcesso?: string | null;
  createdAt?: string;
}

export type FunnelStage = 
  | 'novo_lead'
  | 'em_atendimento'
  | 'visita_agendada'
  | 'aguardando_docs'
  | 'analise_credito'
  | 'proposta'
  | 'venda_fechada'
  | 'descartado';

export interface ChecklistItem {
  id: string;
  leadId: string;
  codigoDoc: string;
  titulo: string;
  descricao?: string;
  obrigatorio: boolean;
  coletado: boolean;
  statusAnalise: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  motivoRejeicao?: string;
  arquivoUrl?: string;
  nomeArquivo?: string;
  updatedAt: string;
}

export interface LeadDocument {
  id: string;
  leadId: string;
  name: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'other';
  status: 'pendente' | 'aprovado' | 'reprovado';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface Lead {
  id: string;
  corretorId: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf: string;
  dataNascimento: string;
  rendaMensal: number;
  fgtsValor: number;
  fgtsAprovado: boolean;
  empreendimentoInteresse: string;
  statusFunil: FunnelStage;
  origemLead: 'zap' | 'vivareal' | 'meta' | 'google' | 'indicacao' | 'whatsapp' | 'outro' | '';
  motivoDescarte?: string;
  motivoRejeicaoCredito?: string;
  observacaoRejeicao?: string;
  observacoes?: string;
  checklistProgress?: {
    coletados: number;
    total: number;
    aprovados: number;
    temRejeitado: boolean;
  };
  createdAt: string;
  updatedAt: string;
  ultimaInteracaoAt: string;
}

export interface Visit {
  id: string;
  leadId: string;
  leadNome?: string;
  leadTelefone?: string;
  corretorId?: string;
  empreendimentoNome: string;
  enderecoPlantao?: string;
  dataHora: string;
  realizada: boolean | null; // null = agendada/pendente, true = realizada, false = não realizada/faltou
  motivoNaoComparecimento?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  corretorId?: string;
  fromMe: boolean;
  text: string;
  senderName?: string;
  mediaUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  mediaType?: 'image' | 'pdf' | 'audio' | 'document' | 'sticker' | 'video' | 'gif';
  mediaName?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface WhatsAppInstance {
  id: string;
  corretorId?: string;
  sessionName: string;
  phoneNumber?: string;
  status: 'disconnected' | 'qrcode_ready' | 'connecting' | 'connected';
  qrcodeBase64?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}


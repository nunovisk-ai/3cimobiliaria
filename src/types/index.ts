export type UserRole = 'corretor' | 'gerente' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  creci?: string;
  avatarUrl?: string;
  whatsappConnected?: boolean;
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
  origemLead: 'zap' | 'vivareal' | 'meta' | 'google' | 'indicacao' | 'whatsapp' | 'outro';
  motivoDescarte?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  ultimaInteracaoAt: string;
}

export interface Visit {
  id: string;
  leadId: string;
  leadNome: string;
  corretorId: string;
  empreendimento: string;
  enderecoStand: string;
  dataHora: string;
  realizada?: boolean;
  observacoes?: string;
}

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS - CRM GRUPO 3C IMOBILIÁRIA (SÃO PAULO)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/pktlcipbprqvzkeouyfq/sql
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMERAÇÕES DO FUNIL IMOBILIÁRIO E DOCUMENTAL
DO $$ BEGIN
    CREATE TYPE funil_etapa AS ENUM (
        'novo_lead',
        'em_atendimento',
        'visita_agendada',
        'aguardando_docs',
        'analise_credito',
        'proposta',
        'venda_fechada',
        'descartado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE doc_status AS ENUM (
        'pendente',
        'aprovado',
        'reprovado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE PERFIS DE USUÁRIOS (CORRETORES E GERENTES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    creci TEXT,
    cargo TEXT NOT NULL DEFAULT 'corretor' CHECK (cargo IN ('corretor', 'gerente', 'admin')),
    whatsapp_conectado BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE EMPREENDIMENTOS IMOBILIÁRIOS (SÃO PAULO)
CREATE TABLE IF NOT EXISTS public.empreendimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    construtora TEXT NOT NULL,
    regiao_sp TEXT NOT NULL,
    endereco_plantao TEXT NOT NULL,
    faixa_preco_de NUMERIC(12, 2),
    faixa_preco_ate NUMERIC(12, 2),
    link_book_pdf TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corretor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    cpf VARCHAR(14),
    data_nascimento DATE,
    renda_bruta_mensal NUMERIC(12, 2) DEFAULT 0.00,
    fgts_saldo NUMERIC(12, 2) DEFAULT 0.00,
    fgts_aprovado BOOLEAN DEFAULT false,
    empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
    empreendimento_nome TEXT,
    status_funil funil_etapa DEFAULT 'novo_lead' NOT NULL,
    origem TEXT DEFAULT 'whatsapp',
    motivo_descarte TEXT,
    observacoes TEXT,
    ultima_interacao_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE DOCUMENTOS DO LEAD (CAIXA / BANCOS)
CREATE TABLE IF NOT EXISTS public.lead_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    tipo_documento TEXT NOT NULL, -- 'rg_cnh', 'comprovante_residencia', 'holerites', 'extrato_fgts', 'certidao_civil', 'imposto_renda'
    nome_arquivo TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    status doc_status DEFAULT 'pendente' NOT NULL,
    motivo_rejeicao TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    avaliado_at TIMESTAMP WITH TIME ZONE,
    avaliado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7. TABELA DE VISITAS AGENDADAS
CREATE TABLE IF NOT EXISTS public.visitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    corretor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    empreendimento_nome TEXT NOT NULL,
    endereco_plantao TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    realizada BOOLEAN DEFAULT NULL, -- NULL = agendada, TRUE = realizada, FALSE = não compareceu
    motivo_nao_comparecimento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE TAREFAS E LEMBRETES DE FOLLOW-UP
CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    corretor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA DE MENSAGENS DO WHATSAPP ESPELHADAS
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    corretor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    remetente_tipo TEXT NOT NULL CHECK (remetente_tipo IN ('lead', 'corretor')),
    mensagem TEXT NOT NULL,
    midia_url TEXT,
    enviada_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- DADOS INICIAIS DE DEMONSTRAÇÃO (EMPREENDIMENTOS DE SÃO PAULO)
-- ==============================================================================
INSERT INTO public.empreendimentos (nome, construtora, regiao_sp, endereco_plantao, faixa_preco_de, faixa_preco_ate)
VALUES 
    ('Vibe Pinheiros', 'Cyrela', 'Pinheiros - Zona Oeste', 'Rua dos Pinheiros, 850 - Pinheiros, SP', 380000.00, 650000.00),
    ('Today Moema', 'Canopus', 'Moema - Zona Sul', 'Av. Moaci, 420 - Moema, SP', 420000.00, 780000.00),
    ('Vivaz Estação Tatuapé', 'Vivaz', 'Tatuapé - Zona Leste', 'Rua Tuiuti, 1200 - Tatuapé, SP', 240000.00, 360000.00),
    ('Cury Metrô Belém', 'Cury', 'Belém - Zona Leste', 'Av. Celso Garcia, 1800 - Belém, SP', 215000.00, 320000.00),
    ('Plano&Ipiranga', 'Plano&Plano', 'Ipiranga - Zona Sul', 'Rua Silva Bueno, 1500 - Ipiranga, SP', 190000.00, 290000.00)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- STORAGE BUCKET PARA DOCUMENTOS DOS LEADS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-leads', 'documentos-leads', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA E PRIVACIDADE
-- ==============================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura/escrita aberta temporariamente durante desenvolvimento ou restrita por corretor
CREATE POLICY "Leitura pública de empreendimentos" ON public.empreendimentos FOR SELECT USING (true);
CREATE POLICY "Acesso completo a leads para usuários autenticados" ON public.leads FOR ALL USING (true);
CREATE POLICY "Acesso completo a documentos" ON public.lead_documents FOR ALL USING (true);
CREATE POLICY "Acesso completo a visitas" ON public.visitas FOR ALL USING (true);
CREATE POLICY "Acesso completo a tarefas" ON public.tarefas FOR ALL USING (true);

-- Notificação de atualização de timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_visitas_updated_at
    BEFORE UPDATE ON public.visitas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela para armazenar cada conversa
CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova Conversa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela para armazenar cada mensagem dentro de uma conversa
CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para a tabela `chats`
CREATE POLICY "Usuários podem ver e gerenciar seus próprios chats"
ON public.chats
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas de Segurança para a tabela `chat_messages`
CREATE POLICY "Usuários podem ver e gerenciar mensagens de seus próprios chats"
ON public.chat_messages
FOR ALL
USING (
    (SELECT user_id FROM public.chats WHERE id = chat_id) = auth.uid()
);
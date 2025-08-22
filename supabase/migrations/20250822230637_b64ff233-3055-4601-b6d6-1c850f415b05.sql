
-- Primeiro, vamos corrigir o relacionamento entre clients e profiles
-- Adicionar foreign key constraint entre clients.user_id e profiles.user_id
ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Atualizar todos os leads existentes onde utm_source=meta para origem "Meta Ads"
UPDATE public.leads 
SET origin = 'Meta Ads'
WHERE website_url ~* '[?&]utm_source=meta(&|$)' 
AND origin != 'Meta Ads';

-- Também vamos criar um índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

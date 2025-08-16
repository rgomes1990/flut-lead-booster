-- Adicionar foreign key constraint para user_id na tabela sites
ALTER TABLE public.sites 
ADD CONSTRAINT sites_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
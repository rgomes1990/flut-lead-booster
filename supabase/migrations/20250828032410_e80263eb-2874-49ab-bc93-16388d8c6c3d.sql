
-- Adicionar coluna website_domain na tabela profiles para armazenar o site do usuário
ALTER TABLE public.profiles 
ADD COLUMN website_domain text;

-- Remover a coluna company_name da tabela clients
ALTER TABLE public.clients DROP COLUMN IF EXISTS company_name;
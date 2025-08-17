-- Primeiro, vamos identificar e remover clientes duplicados, mantendo apenas o mais recente para cada user_id
WITH clients_ranked AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM clients
),
clients_to_delete AS (
  SELECT id FROM clients_ranked WHERE rn > 1
)
-- Remove os planos dos clientes que serão deletados
DELETE FROM subscription_plans 
WHERE client_id IN (SELECT id FROM clients_to_delete);

-- Remove os clientes duplicados (mantém apenas o mais recente)
WITH clients_ranked AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM clients
)
DELETE FROM clients 
WHERE id IN (
  SELECT id FROM clients_ranked WHERE rn > 1
);

-- Cria constraint para prevenir múltiplos clients por user_id
ALTER TABLE clients 
ADD CONSTRAINT unique_user_per_client 
UNIQUE (user_id);
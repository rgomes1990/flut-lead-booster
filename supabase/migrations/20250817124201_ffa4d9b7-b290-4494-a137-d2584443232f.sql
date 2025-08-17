-- Remove a constraint atual que está causando problemas
ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS unique_active_plan_per_client;

-- Cria uma constraint parcial que só se aplica quando is_active = true
-- Isso permite múltiplos planos inativos, mas apenas um ativo por cliente
CREATE UNIQUE INDEX unique_active_plan_per_client 
ON subscription_plans (client_id) 
WHERE is_active = true;
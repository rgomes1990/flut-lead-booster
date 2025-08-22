
-- Remover a constraint que impede múltiplos planos ativos por cliente
-- pois agora queremos permitir apenas um plano ativo por cliente independente de quantos sites ele tenha
DROP INDEX IF EXISTS unique_active_plan_per_client;

-- Criar uma constraint única que garante apenas um plano ativo por cliente
-- (independente de quantos sites ele tenha)
CREATE UNIQUE INDEX unique_active_plan_per_client 
ON subscription_plans (client_id) 
WHERE is_active = true;

-- Atualizar todos os planos existentes para ficarem ativos
UPDATE subscription_plans SET is_active = true;

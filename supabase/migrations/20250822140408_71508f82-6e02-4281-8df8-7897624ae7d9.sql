
-- 1) Remover planos duplicados, mantendo apenas o mais recente por cliente
WITH ranked_plans AS (
  SELECT id, client_id, 
         ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at DESC) as rn
  FROM subscription_plans
)
DELETE FROM subscription_plans 
WHERE id IN (
  SELECT id FROM ranked_plans WHERE rn > 1
);

-- 2) Atualizar todos os planos restantes para assinatura de 1 ano
UPDATE subscription_plans 
SET 
  plan_type = 'one_year',
  end_date = start_date + INTERVAL '1 year',
  is_active = true;

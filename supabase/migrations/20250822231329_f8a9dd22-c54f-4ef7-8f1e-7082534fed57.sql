
-- Atualizar todos os leads existentes onde utm_source=Meta (case insensitive) para origem "Meta Ads"
UPDATE public.leads 
SET origin = 'Meta Ads'
WHERE website_url ~* '[?&]utm_source=meta(&|$)' 
AND origin != 'Meta Ads';

-- Criar função para atualizar planos
CREATE OR REPLACE FUNCTION public.update_subscription_plan(
  plan_id uuid,
  new_plan_type plan_type,
  new_is_active boolean DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem editar planos.';
  END IF;

  -- Atualizar o plano
  UPDATE subscription_plans 
  SET 
    plan_type = new_plan_type,
    end_date = calculate_plan_end_date(new_plan_type, start_date),
    is_active = COALESCE(new_is_active, is_active),
    updated_at = now()
  WHERE id = plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano não encontrado.';
  END IF;
END;
$$;

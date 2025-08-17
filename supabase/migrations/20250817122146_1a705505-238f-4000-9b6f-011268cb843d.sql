-- Criar enum para os tipos de planos
CREATE TYPE plan_type AS ENUM ('free_7_days', 'one_month', 'three_months', 'six_months', 'one_year');

-- Criar tabela de planos
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL DEFAULT 'free_7_days',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans
CREATE POLICY "Admins can manage all subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND user_type = 'admin'
));

CREATE POLICY "Clients can view own subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients 
  WHERE user_id = auth.uid()
));

-- Função para calcular data de expiração baseada no tipo de plano
CREATE OR REPLACE FUNCTION calculate_plan_end_date(plan_type plan_type, start_date TIMESTAMPTZ DEFAULT now())
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
BEGIN
  CASE plan_type
    WHEN 'free_7_days' THEN
      RETURN start_date + INTERVAL '7 days';
    WHEN 'one_month' THEN
      RETURN start_date + INTERVAL '1 month';
    WHEN 'three_months' THEN
      RETURN start_date + INTERVAL '3 months';
    WHEN 'six_months' THEN
      RETURN start_date + INTERVAL '6 months';
    WHEN 'one_year' THEN
      RETURN start_date + INTERVAL '1 year';
    ELSE
      RETURN start_date + INTERVAL '7 days';
  END CASE;
END;
$$;

-- Função para verificar se cliente tem plano ativo
CREATE OR REPLACE FUNCTION client_has_active_plan(client_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscription_plans 
    WHERE client_id = client_uuid 
    AND is_active = true 
    AND end_date > now()
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir plano grátis de 7 dias para todos os clientes existentes
INSERT INTO public.subscription_plans (client_id, plan_type, start_date, end_date)
SELECT 
  id as client_id,
  'free_7_days'::plan_type,
  created_at as start_date,
  calculate_plan_end_date('free_7_days'::plan_type, created_at) as end_date
FROM public.clients
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans sp 
  WHERE sp.client_id = clients.id
);

-- Função para criar plano automático para novos clientes
CREATE OR REPLACE FUNCTION create_default_plan_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.subscription_plans (client_id, plan_type, start_date, end_date)
  VALUES (
    NEW.id,
    'free_7_days'::plan_type,
    now(),
    calculate_plan_end_date('free_7_days'::plan_type, now())
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar plano automático quando cliente é criado
CREATE TRIGGER create_default_plan_trigger
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION create_default_plan_for_client();
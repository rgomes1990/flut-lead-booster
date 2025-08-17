-- Corrigir problemas de segurança adicionando SET search_path
CREATE OR REPLACE FUNCTION calculate_plan_end_date(plan_type plan_type, start_date TIMESTAMPTZ DEFAULT now())
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION client_has_active_plan(client_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION create_default_plan_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscription_plans (client_id, plan_type, start_date, end_date)
  VALUES (
    NEW.id,
    'free_7_days'::plan_type,
    now(),
    calculate_plan_end_date('free_7_days'::plan_type, now())
  );
  RETURN NEW;
END;
$$;
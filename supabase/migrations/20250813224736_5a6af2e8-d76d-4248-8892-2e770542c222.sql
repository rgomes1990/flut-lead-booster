-- Corrigir security warnings das funções
CREATE OR REPLACE FUNCTION generate_script_id()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN FLOOR(RANDOM() * 9000 + 1000)::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_script_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.script_id IS NULL OR NEW.script_id = '' THEN
    NEW.script_id := generate_script_id();
    -- Verificar se já existe e gerar novo se necessário
    WHILE EXISTS (SELECT 1 FROM public.clients WHERE script_id = NEW.script_id) LOOP
      NEW.script_id := generate_script_id();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'client'
  );
  RETURN NEW;
END;
$$;
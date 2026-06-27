CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_rsg_client_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_client_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'clients' THEN
    target_client_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    SELECT c.id INTO target_client_id FROM public.clients c WHERE c.user_id = NEW.user_id LIMIT 1;
  END IF;

  IF target_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/sync-clients-rsg',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXNubmlwZGpxbXhwZ2Z2aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjQ2NzcsImV4cCI6MjA3MDcwMDY3N30.xMOfCDIniXTn5TnlOdcUiQycp-5yPetalylgzm2_VeQ'
    ),
    body := jsonb_build_object('client_id', target_client_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rsg_sync_clients ON public.clients;
CREATE TRIGGER trg_rsg_sync_clients
AFTER INSERT OR UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.notify_rsg_client_change();

DROP TRIGGER IF EXISTS trg_rsg_sync_profiles ON public.profiles;
CREATE TRIGGER trg_rsg_sync_profiles
AFTER UPDATE OF name, email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_rsg_client_change();
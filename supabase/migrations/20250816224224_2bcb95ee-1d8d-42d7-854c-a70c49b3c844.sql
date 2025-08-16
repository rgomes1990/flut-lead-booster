-- Criar tabela de configurações de sites
CREATE TABLE public.site_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  company_name text,
  email text,
  phone text,
  attendant_name text,
  -- Campos que deseja solicitar
  field_phone boolean NOT NULL DEFAULT true,
  field_name boolean NOT NULL DEFAULT true,
  field_email boolean NOT NULL DEFAULT true,
  field_message boolean NOT NULL DEFAULT true,
  field_capture_page boolean NOT NULL DEFAULT true,
  -- Configurações do ícone
  icon_type text NOT NULL DEFAULT 'whatsapp',
  icon_position text NOT NULL DEFAULT 'bottom',
  -- Configurações do widget
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(site_id)
);

-- Habilitar RLS
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all site configs" 
ON public.site_configs 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Users can manage own site configs" 
ON public.site_configs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.sites 
  WHERE sites.id = site_configs.site_id 
  AND sites.user_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_configs_updated_at
BEFORE UPDATE ON public.site_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
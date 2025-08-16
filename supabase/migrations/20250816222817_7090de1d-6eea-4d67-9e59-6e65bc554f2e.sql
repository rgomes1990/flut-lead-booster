-- Criar tabela de sites
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  domain text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sites
CREATE POLICY "Admins can view all sites" 
ON public.sites 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Users can view own sites" 
ON public.sites 
FOR ALL 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
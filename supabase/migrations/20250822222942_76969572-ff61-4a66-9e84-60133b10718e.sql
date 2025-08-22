
-- Atualizar a função de determinação de origem para incluir Instagram e Facebook
CREATE OR REPLACE FUNCTION public.determine_origin_from_url(url text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se a URL for nula ou vazia, retornar 'Tráfego Direto'
  IF url IS NULL OR url = '' THEN
    RETURN 'Tráfego Direto';
  END IF;
  
  -- Verificar Facebook (parâmetro fbclid)
  IF url ~* '[?&]fbclid=' THEN
    RETURN 'Facebook';
  END IF;
  
  -- Verificar Instagram (parâmetro utm_source=instagram) - case insensitive
  IF url ~* '[?&]utm_source=instagram(&|$)' THEN
    RETURN 'Instagram';
  END IF;
  
  -- Verificar Google Orgânico (parâmetro srsltid)
  IF url ~* '[?&]srsltid=' THEN
    RETURN 'Google Orgânico';
  END IF;
  
  -- Verificar Google Ads (parâmetros gad_source ou gclid) - case insensitive
  IF url ~* '[?&](gad_source|gclid)=' THEN
    RETURN 'Google Ads';
  END IF;
  
  -- Verificar Meta Ads (parâmetro utm_source=Meta) - case insensitive
  IF url ~* '[?&]utm_source=(meta|facebook)(&|$)' THEN
    RETURN 'Meta Ads';
  END IF;
  
  -- Verificar outros UTM sources comuns
  IF url ~* '[?&]utm_source=' THEN
    RETURN 'UTM Campaign';
  END IF;
  
  -- Se não tem parâmetros na URL (não contém ? nem &), é tráfego direto
  IF url !~ '[?&]' THEN
    RETURN 'Tráfego Direto';
  END IF;
  
  -- Caso padrão (tem parâmetros mas não identificados)
  RETURN 'Site Orgânico';
END;
$function$;

-- Adicionar coluna status aos planos de assinatura para permitir desativação
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled'));

-- Atualizar planos existentes para ter status 'active'
UPDATE subscription_plans SET status = 'active' WHERE status IS NULL;

-- Atualizar função determine_origin_from_url com as novas regras
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

-- Atualizar TODOS os leads existentes para corrigir a origem com as novas regras
UPDATE leads 
SET origin = determine_origin_from_url(website_url);
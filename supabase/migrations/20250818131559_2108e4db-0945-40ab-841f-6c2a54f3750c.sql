-- Corrigir a função para ter search_path seguro
CREATE OR REPLACE FUNCTION public.determine_origin_from_url(url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a URL for nula ou vazia, retornar 'Site Orgânico'
  IF url IS NULL OR url = '' THEN
    RETURN 'Site Orgânico';
  END IF;
  
  -- Verificar Google Ads (parâmetros gad_source ou gclid)
  IF url ~ '[?&](gad_source|gclid)=' THEN
    RETURN 'Google Ads';
  END IF;
  
  -- Verificar Meta Ads (parâmetro utm_source=Meta)
  IF url ~ '[?&]utm_source=Meta(&|$)' THEN
    RETURN 'Meta Ads';
  END IF;
  
  -- Caso padrão
  RETURN 'Site Orgânico';
END;
$$;
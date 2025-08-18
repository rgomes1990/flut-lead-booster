-- Função para determinar origem com base na URL
CREATE OR REPLACE FUNCTION public.determine_origin_from_url(url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
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

-- Atualizar todos os leads existentes que têm origem 'Site Orgânico' ou 'Não informado'
-- mas que deveriam ter origem 'Google Ads' ou 'Meta Ads' baseado na URL
UPDATE public.leads 
SET origin = public.determine_origin_from_url(website_url)
WHERE origin IN ('Site Orgânico', 'Não informado') 
AND public.determine_origin_from_url(website_url) != 'Site Orgânico';
-- Primeiro vamos verificar a função determine_origin_from_url
-- e melhorar sua lógica

CREATE OR REPLACE FUNCTION public.determine_origin_from_url(url text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se a URL for nula ou vazia, retornar 'Site Orgânico'
  IF url IS NULL OR url = '' THEN
    RETURN 'Site Orgânico';
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
  
  -- Caso padrão
  RETURN 'Site Orgânico';
END;
$function$;

-- Atualizar TODOS os leads existentes para corrigir a origem
UPDATE leads 
SET origin = determine_origin_from_url(website_url)
WHERE website_url IS NOT NULL 
AND website_url != '';

-- Adicionar log para verificar a atualização
INSERT INTO leads (client_id, name, email, phone, message, website_url, origin, status)
SELECT 
  client_id,
  'LOG UPDATE - ' || COUNT(*) || ' leads atualizados',
  'system@log.com',
  '00000000000',
  'Log de atualização das origens dos leads',
  'https://system-log.com',
  'Sistema',
  'read'
FROM leads
WHERE website_url IS NOT NULL 
AND website_url != ''
GROUP BY client_id
LIMIT 1;
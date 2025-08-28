-- Primeiro, criar uma função para normalizar texto removendo acentos
CREATE OR REPLACE FUNCTION public.remove_accents(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
SELECT 
  translate(
    lower(input_text),
    'àáâãäåāăąèéêëēĕėęěìíîïīĭįìòóôõöōŏőùúûüūŭůűųýÿĩũẽã',
    'aaaaaaaaaeeeeeeeeeiiiiiiioooooooouuuuuuuuuyyyiu'
  );
$$;

-- Atualizar campos com problemas de acentuação
UPDATE public.profiles 
SET name = 
  CASE 
    WHEN name ~ '[àáâãäåāăąèéêëēĕėęěìíîïīĭįìòóôõöōŏőùúûüūŭůűųýÿĩũẽã]' THEN
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
          REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,
            'à', 'a'), 'á', 'a'), 'â', 'a'), 'ã', 'a'), 'ä', 'a'), 'å', 'a'), 'ā', 'a'), 'ă', 'a'), 'ą', 'a'),
          'è', 'e'), 'é', 'e'), 'ê', 'e'), 'ë', 'e'), 'ē', 'e'), 'ĕ', 'e'), 'ė', 'e'), 'ę', 'e'), 'ě', 'e'),
        'ì', 'i'), 'í', 'i'), 'î', 'i'), 'ï', 'i'), 'ī', 'i'), 'ĭ', 'i'), 'į', 'i'),
      'ò', 'o'), 'ó', 'o'), 'ô', 'o'), 'õ', 'o'), 'ö', 'o'), 'ō', 'o'), 'ŏ', 'o'), 'ő', 'o'),
    'ù', 'u'), 'ú', 'u'), 'û', 'u'), 'ü', 'u'), 'ū', 'u'), 'ŭ', 'u'), 'ů', 'u'), 'ű', 'u'), 'ų', 'u'),
  'ý', 'y'), 'ÿ', 'y'), 'ĩ', 'i'), 'ũ', 'u'), 'ẽ', 'e'), 'ã', 'a')
    ELSE name
  END;

-- Remover "https://" do início dos campos website_url em clients
UPDATE public.clients 
SET website_url = REGEXP_REPLACE(website_url, '^https?://', '', 'i')
WHERE website_url ~ '^https?://';

-- Atualizar leads que têm email-cliente para relacionar com clients
UPDATE public.leads 
SET 
  client_id = clients.id,
  website_url = clients.website_url,
  status = 'read',
  origin = COALESCE(origin, 'Tráfego Direto')
FROM public.clients 
JOIN public.profiles ON clients.user_id = profiles.user_id
WHERE 
  leads."email-cliente" IS NOT NULL 
  AND leads."email-cliente" != ''
  AND profiles.email = leads."email-cliente";

-- Atualizar leads que têm origin NULL para "Tráfego Direto"
UPDATE public.leads 
SET origin = 'Tráfego Direto'
WHERE origin IS NULL;
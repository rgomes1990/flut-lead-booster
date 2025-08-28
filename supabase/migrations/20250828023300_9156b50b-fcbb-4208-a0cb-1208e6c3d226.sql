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
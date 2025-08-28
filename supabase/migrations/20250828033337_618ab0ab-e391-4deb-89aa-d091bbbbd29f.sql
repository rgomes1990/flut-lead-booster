
-- Atualizar leads com base no email-cliente
UPDATE public.leads 
SET 
  client_id = clients.id,
  website_url = COALESCE(clients.website_url, leads.website_url),
  status = 'read',
  origin = COALESCE(NULLIF(origin, ''), 'Tráfego Direto')
FROM public.clients
INNER JOIN public.profiles ON clients.user_id = profiles.user_id
WHERE leads."email-cliente" = profiles.email 
  AND leads."email-cliente" IS NOT NULL 
  AND leads."email-cliente" != '';

-- Atualizar apenas o campo origin para leads que não têm email-cliente mas têm origin NULL
UPDATE public.leads 
SET origin = 'Tráfego Direto'
WHERE origin IS NULL OR origin = '';

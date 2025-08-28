
-- Atualizar leads do site dermooset.com.br para usuário Dermooset
UPDATE public.leads 
SET client_id = (
    SELECT c.id 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Dermooset'
    LIMIT 1
)
WHERE website_url LIKE '%dermooset.com.br%'
  AND EXISTS (
    SELECT 1 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Dermooset'
  );

-- Atualizar leads do site apresentacao.evolucengenharia.com.br para usuário Evoluc
UPDATE public.leads 
SET client_id = (
    SELECT c.id 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Evoluc'
    LIMIT 1
)
WHERE website_url LIKE '%apresentacao.evolucengenharia.com.br%'
  AND EXISTS (
    SELECT 1 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Evoluc'
  );

-- Atualizar leads do site imobiliaria.morarbemsp.com.br para usuário Morar Bem
UPDATE public.leads 
SET client_id = (
    SELECT c.id 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Morar Bem'
    LIMIT 1
)
WHERE website_url LIKE '%imobiliaria.morarbemsp.com.br%'
  AND EXISTS (
    SELECT 1 
    FROM public.clients c 
    INNER JOIN public.profiles p ON c.user_id = p.user_id 
    WHERE p.name = 'Morar Bem'
  );

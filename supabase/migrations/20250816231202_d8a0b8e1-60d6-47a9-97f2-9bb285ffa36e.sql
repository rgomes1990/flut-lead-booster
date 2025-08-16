-- Inserir dados de teste
-- Primeiro vamos inserir um client de teste se não existir
INSERT INTO public.clients (user_id, website_url, script_id, is_active)
SELECT 
  (SELECT user_id FROM public.profiles WHERE email = 'financeiro@rsgtecnologia.com' LIMIT 1),
  'https://exemplo.com.br',
  '1234',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'financeiro@rsgtecnologia.com' LIMIT 1)
);

-- Agora vamos inserir alguns leads de teste
INSERT INTO public.leads (client_id, name, email, phone, message, website_url, status)
SELECT 
  c.id,
  'João Silva',
  'joao.silva@exemplo.com',
  '(11) 99999-9999',
  'Gostaria de saber mais informações sobre os serviços',
  'https://exemplo.com.br',
  'new'
FROM public.clients c
WHERE c.user_id = (SELECT user_id FROM public.profiles WHERE email = 'financeiro@rsgtecnologia.com' LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM public.leads 
  WHERE email = 'joao.silva@exemplo.com'
);

INSERT INTO public.leads (client_id, name, email, phone, message, website_url, status)
SELECT 
  c.id,
  'Maria Santos',
  'maria.santos@exemplo.com',
  '(11) 88888-8888',
  'Preciso de um orçamento para minha empresa',
  'https://exemplo.com.br',
  'contacted'
FROM public.clients c
WHERE c.user_id = (SELECT user_id FROM public.profiles WHERE email = 'financeiro@rsgtecnologia.com' LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM public.leads 
  WHERE email = 'maria.santos@exemplo.com'
);

INSERT INTO public.leads (client_id, name, email, phone, message, website_url, status)
SELECT 
  c.id,
  'Pedro Oliveira',
  'pedro.oliveira@exemplo.com',
  '(11) 77777-7777',
  'Interessado nos produtos disponíveis',
  'https://exemplo.com.br',
  'qualified'
FROM public.clients c
WHERE c.user_id = (SELECT user_id FROM public.profiles WHERE email = 'financeiro@rsgtecnologia.com' LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM public.leads 
  WHERE email = 'pedro.oliveira@exemplo.com'
);
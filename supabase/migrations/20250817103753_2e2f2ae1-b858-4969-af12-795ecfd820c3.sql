-- Adicionar campo campanha na tabela leads
ALTER TABLE public.leads 
ADD COLUMN campaign TEXT DEFAULT 'Não informado';

-- Atualizar os leads de teste com campanhas de exemplo
UPDATE public.leads 
SET campaign = CASE 
  WHEN email = 'joao.silva@exemplo.com' THEN 'Google Ads'
  WHEN email = 'maria.santos@exemplo.com' THEN 'Facebook'
  WHEN email = 'pedro.oliveira@exemplo.com' THEN 'Site Orgânico'
  ELSE 'Não informado'
END
WHERE campaign = 'Não informado';
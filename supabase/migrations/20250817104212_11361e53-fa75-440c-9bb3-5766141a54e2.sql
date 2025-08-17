-- Adicionar campo origem na tabela leads
ALTER TABLE public.leads 
ADD COLUMN origin TEXT DEFAULT 'Site Orgânico';

-- Atualizar os leads de teste com origens e campanhas de exemplo
UPDATE public.leads 
SET origin = CASE 
  WHEN email = 'joao.silva@exemplo.com' THEN 'Google Ads'
  WHEN email = 'maria.santos@exemplo.com' THEN 'Facebook'
  WHEN email = 'pedro.oliveira@exemplo.com' THEN 'Instagram'
  ELSE 'Site Orgânico'
END,
campaign = CASE 
  WHEN email = 'joao.silva@exemplo.com' THEN 'Campanha Black Friday'
  WHEN email = 'maria.santos@exemplo.com' THEN 'Campanha Lançamento'
  WHEN email = 'pedro.oliveira@exemplo.com' THEN 'Campanha Verão 2025'
  ELSE 'Campanha Orgânica'
END;

-- Adicionar colunas para armazenar dados UTM na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ad_content TEXT DEFAULT 'Não informado',
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'Não informado';

-- Atualizar leads existentes com dados UTM extraídos da URL
UPDATE public.leads 
SET 
  campaign = COALESCE(
    CASE 
      WHEN website_url ~* '[?&]utm_campaign=([^&]*)' 
      THEN url_decode(substring(website_url from '[?&]utm_campaign=([^&]*)'))
      ELSE campaign 
    END, 
    'Não informado'
  ),
  ad_content = COALESCE(
    CASE 
      WHEN website_url ~* '[?&]utm_content=([^&]*)' 
      THEN url_decode(substring(website_url from '[?&]utm_content=([^&]*)'))
      ELSE 'Não informado'
    END, 
    'Não informado'
  ),
  audience = COALESCE(
    CASE 
      WHEN website_url ~* '[?&]utm_medium=([^&]*)' 
      THEN url_decode(substring(website_url from '[?&]utm_medium=([^&]*)'))
      ELSE 'Não informado'
    END, 
    'Não informado'
  )
WHERE website_url IS NOT NULL AND website_url != '';

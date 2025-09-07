-- Remover o campo "Título das Informações" da etapa 2
DELETE FROM landing_profile_fields 
WHERE step_name = 'Informações do Imóvel' 
AND (field_label ILIKE '%título das informações%' OR field_name = 'titulo_informacoes');

-- Atualizar o campo de valor do imóvel para usar máscara monetária
UPDATE landing_profile_fields 
SET field_type = 'text',
    placeholder = 'R$ 0,00'
WHERE step_name = 'Informações do Imóvel' 
AND (field_label ILIKE '%valor%' OR field_name ILIKE '%valor%');

-- Atualizar o campo de área total para aceitar apenas números
UPDATE landing_profile_fields 
SET field_type = 'number',
    placeholder = 'Ex: 85.5'
WHERE step_name = 'Informações do Imóvel' 
AND (field_label ILIKE '%área%' OR field_name ILIKE '%area%');

-- Adicionar campo para upload da imagem do empreendimento na etapa 2
INSERT INTO landing_profile_fields (
  profile_id,
  step_name,
  field_name,
  field_label,
  field_type,
  is_required,
  field_order,
  step_order,
  placeholder
) 
SELECT 
  profile_id,
  'Informações do Imóvel' as step_name,
  'imagem_empreendimento' as field_name,
  'Imagem do Empreendimento' as field_label,
  'image' as field_type,
  false as is_required,
  (SELECT COALESCE(MAX(field_order), 0) + 1 FROM landing_profile_fields WHERE step_name = 'Informações do Imóvel' AND profile_id = lpf.profile_id) as field_order,
  2 as step_order,
  'Faça upload da imagem principal do empreendimento' as placeholder
FROM landing_profile_fields lpf
WHERE step_name = 'Informações do Imóvel'
GROUP BY profile_id
ON CONFLICT DO NOTHING;
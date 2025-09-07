-- Remover o campo "Título das Informações" específico
DELETE FROM landing_profile_fields 
WHERE field_name = 'info_title' AND field_label = 'Título das Informações';

-- Atualizar o campo de valor do imóvel para usar máscara monetária  
UPDATE landing_profile_fields 
SET field_type = 'text',
    placeholder = 'R$ 0,00'
WHERE field_name = 'info_price';

-- Atualizar o campo de área total para aceitar apenas números
UPDATE landing_profile_fields 
SET field_type = 'number',
    placeholder = 'Ex: 85.5'
WHERE field_name = 'info_area';

-- Adicionar campo para upload da imagem do empreendimento na etapa Informações
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
  'Informações' as step_name,
  'imagem_empreendimento' as field_name,
  'Imagem do Empreendimento' as field_label,
  'image' as field_type,
  false as is_required,
  (SELECT COALESCE(MAX(field_order), 0) + 1 FROM landing_profile_fields WHERE step_name = 'Informações' AND profile_id = lpf.profile_id) as field_order,
  3 as step_order,
  'Faça upload da imagem principal do empreendimento' as placeholder
FROM landing_profile_fields lpf
WHERE step_name = 'Informações'
GROUP BY profile_id
ON CONFLICT DO NOTHING;
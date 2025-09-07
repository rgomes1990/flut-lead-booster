-- Adicionar campo "Título da Descrição" na etapa Informações
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
  'titulo_descricao' as field_name,
  'Título da Descrição' as field_label,
  'text' as field_type,
  false as is_required,
  (SELECT COALESCE(MAX(field_order), 0) + 1 FROM landing_profile_fields WHERE step_name = 'Informações' AND profile_id = lpf.profile_id) as field_order,
  2 as step_order,
  'Ex: Conheça nosso novo empreendimento' as placeholder
FROM landing_profile_fields lpf
WHERE step_name = 'Informações'
GROUP BY profile_id
ON CONFLICT DO NOTHING;
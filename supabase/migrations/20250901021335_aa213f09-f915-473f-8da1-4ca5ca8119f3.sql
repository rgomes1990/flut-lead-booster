
-- Atualizar campos existentes e adicionar novos campos para as landing pages

-- Atualizar o campo "Imagem do Banner" para ser do tipo file
UPDATE landing_profile_fields 
SET field_type = 'file', 
    field_label = 'Imagem do Banner*',
    is_required = true
WHERE field_name = 'banner_image' AND field_label LIKE '%Banner%';

-- Atualizar o campo "Subtítulo do Banner" para textarea com limite de caracteres
UPDATE landing_profile_fields 
SET field_type = 'textarea', 
    field_label = 'Subtítulo do Banner',
    placeholder = 'Digite o subtítulo do banner (máximo 122 caracteres)',
    is_required = false
WHERE field_name = 'banner_subtitle';

-- Adicionar campo de Logotipo na primeira etapa (step_order = 1)
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT profile_id, 'Informações Básicas', 'logo_image', 'file', 
       'Logotipo da Landing Page', 'Faça upload do logotipo', false, 3, 1
FROM landing_profile_fields 
WHERE step_order = 1
ON CONFLICT DO NOTHING;

-- Atualizar campo Galeria para aceitar múltiplos uploads
UPDATE landing_profile_fields 
SET field_type = 'multiple_files',
    field_label = 'Galeria',
    placeholder = 'Faça upload de várias fotos do imóvel'
WHERE step_name = 'Galeria' AND field_name LIKE '%galeria%';

-- Atualizar campo Foto do Corretor na sexta etapa
UPDATE landing_profile_fields 
SET field_type = 'file',
    field_label = 'Foto do Corretor*',
    placeholder = 'Faça upload da foto do corretor',
    is_required = true
WHERE step_name = 'Sobre' AND (field_name LIKE '%foto%' OR field_name LIKE '%corretor%');

-- Mover "Subtítulo da Área de Lazer" da etapa 8 para etapa 7
UPDATE landing_profile_fields 
SET step_order = 7,
    step_name = 'Área de Lazer'
WHERE field_name LIKE '%subtitulo_area_lazer%' OR 
      (field_label LIKE '%Subtítulo%' AND field_label LIKE '%Área de Lazer%');

-- Remover campos da etapa 8 (se houver outros além do subtítulo)
DELETE FROM landing_profile_fields 
WHERE step_order = 8 AND step_name != 'Área de Lazer';

-- Reorganizar as ordens das etapas para garantir sequência correta
UPDATE landing_profile_fields 
SET step_order = CASE 
    WHEN step_name = 'Informações Básicas' THEN 1
    WHEN step_name = 'Banner' THEN 2  
    WHEN step_name = 'Propriedade' THEN 3
    WHEN step_name = 'Localização' THEN 4
    WHEN step_name = 'Galeria' THEN 5
    WHEN step_name = 'Sobre' THEN 6
    WHEN step_name = 'Área de Lazer' THEN 7
    ELSE step_order
END;

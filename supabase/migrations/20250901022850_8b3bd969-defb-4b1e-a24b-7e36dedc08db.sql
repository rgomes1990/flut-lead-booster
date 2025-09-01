
-- 1) Mover o campo logotipo para ser o primeiro campo da etapa Banner
UPDATE landing_profile_fields 
SET field_order = 0
WHERE field_name = 'logo_image' AND step_name = 'Banner';

-- Ajustar a ordem dos outros campos da etapa Banner para ficarem depois do logotipo
UPDATE landing_profile_fields 
SET field_order = field_order + 1
WHERE step_name = 'Banner' AND field_name != 'logo_image';

-- 2) Verificar e corrigir o tipo do campo galeria para multiple_files
UPDATE landing_profile_fields 
SET field_type = 'multiple_files'
WHERE field_name = 'galeria_imagens' AND step_name = 'Galeria';

-- 3) Verificar se o campo foto_corretor está configurado corretamente
UPDATE landing_profile_fields 
SET field_type = 'file',
    field_label = 'Foto do Corretor',
    placeholder = 'Faça upload da foto do corretor'
WHERE field_name = 'foto_corretor' AND step_name = 'Sobre';

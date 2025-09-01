
-- 1) Mover o campo logotipo da etapa "Propriedade" para a etapa "Banner" (etapa 1)
UPDATE landing_profile_fields 
SET step_name = 'Banner', step_order = 1, field_order = 10
WHERE field_name = 'logo_image';

-- 2) Transformar o campo "foto_corretor" em um campo de upload de imagem
UPDATE landing_profile_fields 
SET field_type = 'file',
    field_label = 'Foto do Corretor',
    placeholder = 'Faça upload da foto do corretor'
WHERE field_name = 'foto_corretor' AND step_name = 'Sobre';

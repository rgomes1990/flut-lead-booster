
-- Reorganizar as etapas conforme solicitado

-- 1) Mover Banner para etapa 1 e reorganizar as outras
UPDATE landing_profile_fields 
SET step_order = CASE 
    WHEN step_name = 'Banner' THEN 1
    WHEN step_name = 'Informações Básicas' THEN 2
    WHEN step_name = 'Propriedade' THEN 3
    WHEN step_name = 'Localização' THEN 4
    WHEN step_name = 'Galeria' THEN 5
    WHEN step_name = 'Sobre' THEN 6
    WHEN step_name = 'Área de Lazer' THEN 7
    ELSE step_order
END;

-- 2) Mover o campo logotipo da etapa "Informações Básicas" para dentro da etapa "Propriedade"
UPDATE landing_profile_fields 
SET step_name = 'Propriedade', step_order = 3, field_order = 10
WHERE field_name = 'logo_image';

-- 3) Garantir que o campo Galeria seja do tipo multiple_files
UPDATE landing_profile_fields 
SET field_type = 'multiple_files',
    field_label = 'Imagens do Empreendimento',
    placeholder = 'Faça upload de várias imagens do empreendimento'
WHERE step_name = 'Galeria';

-- 4) Criar nova etapa "Rodapé" (etapa 8) com os campos da imagem
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'footer_title',
    'textarea',
    'Título',
    'Digite o título do rodapé',
    false,
    1,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Adicionar campo de Redes Sociais - Facebook
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_facebook_active',
    'checkbox',
    'Facebook Ativo',
    '',
    false,
    2,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Facebook Link
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_facebook_link',
    'text',
    'Link do Facebook',
    'https://www.facebook.com/...',
    false,
    3,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Instagram
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_instagram_active',
    'checkbox',
    'Instagram Ativo',
    '',
    false,
    4,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Instagram Link
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_instagram_link',
    'text',
    'Link do Instagram',
    'https://www.instagram.com/...',
    false,
    5,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- WhatsApp
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_whatsapp_active',
    'checkbox',
    'WhatsApp Ativo',
    '',
    false,
    6,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- WhatsApp Number
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_whatsapp_number',
    'text',
    'Número do WhatsApp',
    '11970620020',
    false,
    7,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- LinkedIn
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_linkedin_active',
    'checkbox',
    'LinkedIn Ativo',
    '',
    false,
    8,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- LinkedIn Link
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'social_linkedin_link',
    'text',
    'Link do LinkedIn',
    'https://www.linkedin.com/in/...',
    false,
    9,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Seção Contatos - WhatsApp
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_whatsapp_active',
    'checkbox',
    'WhatsApp Contato Ativo',
    '',
    false,
    10,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- WhatsApp Contact Number
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_whatsapp_number',
    'text',
    'WhatsApp de Contato',
    '11954542660888888888',
    false,
    11,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Central de Vendas
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_sales_active',
    'checkbox',
    'Central de Vendas Ativa',
    '',
    false,
    12,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Sales Number
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_sales_number',
    'text',
    'Telefone Central de Vendas',
    '1195454266',
    false,
    13,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- E-mail
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_email_active',
    'checkbox',
    'E-mail Ativo',
    '',
    false,
    14,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

-- Email Address
INSERT INTO landing_profile_fields (
    profile_id, step_name, field_name, field_type, field_label, 
    placeholder, is_required, field_order, step_order
)
SELECT DISTINCT 
    profile_id, 
    'Rodapé',
    'contact_email_address',
    'email',
    'E-mail de Contato',
    'bruno.s.xavier@hotmail.com',
    false,
    15,
    8
FROM landing_profile_fields 
WHERE step_order = 1
LIMIT 1;

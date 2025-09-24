-- Remove the asterisk from the "Imagem do Banner" field label
UPDATE landing_profile_fields 
SET field_label = 'Imagem do Banner'
WHERE field_name = 'banner_image' AND field_label = 'Imagem do Banner*';
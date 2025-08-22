
-- Copiar dados do campo phone da tabela site_configs para o campo whatsapp da tabela clients
-- Fazer o match através do user_id que está presente nas duas tabelas via sites
UPDATE clients 
SET whatsapp = site_configs.phone
FROM site_configs
INNER JOIN sites ON sites.id = site_configs.site_id
WHERE clients.user_id = sites.user_id 
AND site_configs.phone IS NOT NULL 
AND site_configs.phone != '';

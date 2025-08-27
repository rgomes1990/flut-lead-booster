-- Atualizar leads relacionando email-cliente com usuarios cadastrados
UPDATE leads 
SET 
  client_id = clients.id,
  website_url = COALESCE(clients.website_url, leads.website_url),
  status = 'read'
FROM clients
INNER JOIN profiles ON profiles.user_id = clients.user_id
WHERE leads."email-cliente" = profiles.email 
  AND leads."email-cliente" IS NOT NULL
  AND leads."email-cliente" != '';
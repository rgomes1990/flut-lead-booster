-- Atualizar leads existentes com a origem correta baseada na URL
UPDATE leads 
SET origin = determine_origin_from_url(website_url)
WHERE origin = 'Site Orgânico' 
AND website_url IS NOT NULL 
AND website_url != '';
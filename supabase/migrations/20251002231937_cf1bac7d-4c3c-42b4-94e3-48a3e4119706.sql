-- Padronizar todas as variações de origens para os nomes corretos

-- Atualizar todas as variações de "Meta Ads"
UPDATE leads 
SET origin = 'Meta Ads' 
WHERE LOWER(origin) IN ('meta', 'meta_ads', 'metaads', 'facebook', 'facebook ads', 'fb', 'instagram ads');

-- Atualizar todas as variações de "Google Ads"
UPDATE leads 
SET origin = 'Google Ads' 
WHERE LOWER(origin) IN ('google', 'googleads', 'google_ads', 'google orgânico', 'google orgãnico');

-- Atualizar todas as variações de "Tráfego Direto"
UPDATE leads 
SET origin = 'Tráfego Direto' 
WHERE origin IN ('Tr�fego Direto', 'Trafego Direto', 'trafego direto');

-- Atualizar todas as variações de "Tráfego Orgânico"  
UPDATE leads 
SET origin = 'Tráfego Orgânico' 
WHERE LOWER(origin) IN ('trafego organico', 'youtube', 'linkbi');

-- Atualizar todas as variações de "Chat GPT"
UPDATE leads 
SET origin = 'Chat GPT' 
WHERE LOWER(origin) IN ('chatgpt.com', 'chatgpt', 'chat gpt');

-- Atualizar leads com origin NULL para "Tráfego Direto"
UPDATE leads 
SET origin = 'Tráfego Direto' 
WHERE origin IS NULL OR origin = '';
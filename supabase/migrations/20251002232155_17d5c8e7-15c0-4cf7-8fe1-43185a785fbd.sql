-- Corrigir as origens que ainda estão incorretas

-- Atualizar "Google Orgânico" para "Tráfego Orgânico"
UPDATE leads 
SET origin = 'Tráfego Orgânico' 
WHERE origin LIKE 'Google Org%';

-- Atualizar leads com origin NULL para "Tráfego Direto"
UPDATE leads 
SET origin = 'Tráfego Direto' 
WHERE origin = 'NULL' OR origin IS NULL OR origin = '';
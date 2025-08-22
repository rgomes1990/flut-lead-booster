
-- Atualizar todos os leads que têm origem "Site Orgânico" para "Tráfego Direto"
UPDATE leads 
SET origin = 'Tráfego Direto' 
WHERE origin = 'Site Orgânico';

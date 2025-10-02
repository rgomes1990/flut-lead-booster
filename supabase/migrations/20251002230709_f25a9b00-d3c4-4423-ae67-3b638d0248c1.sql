-- Atualizar todos os leads com origem 'Instagram' para 'Tráfego Orgânico'
UPDATE leads 
SET origin = 'Tráfego Orgânico' 
WHERE origin = 'Instagram';
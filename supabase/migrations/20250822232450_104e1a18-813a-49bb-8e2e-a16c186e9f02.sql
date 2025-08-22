
-- Atualizar todos os leads que têm origem "Facebook" para "Meta Ads"
UPDATE leads 
SET origin = 'Meta Ads' 
WHERE origin = 'Facebook';

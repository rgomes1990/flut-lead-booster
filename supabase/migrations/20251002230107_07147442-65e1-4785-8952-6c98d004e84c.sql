-- Atualizar todos os leads com origem 'UTM Campaign' para 'Chat GPT'
UPDATE leads 
SET origin = 'Chat GPT' 
WHERE origin = 'UTM Campaign';
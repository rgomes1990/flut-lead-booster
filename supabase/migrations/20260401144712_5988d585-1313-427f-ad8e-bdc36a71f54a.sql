
-- Atualizar todos os WhatsApp de clients que não têm +55
UPDATE clients 
SET whatsapp = format_whatsapp_number(whatsapp),
    updated_at = now()
WHERE whatsapp IS NOT NULL 
  AND whatsapp != '' 
  AND whatsapp NOT LIKE '+55%';

-- Atualizar todos os phones de site_configs que não têm +55
UPDATE site_configs 
SET phone = format_whatsapp_number(phone),
    updated_at = now()
WHERE phone IS NOT NULL 
  AND phone != '' 
  AND phone NOT LIKE '+55%';

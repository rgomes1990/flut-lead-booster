-- Adicionar campo default_message na tabela site_configs para armazenar mensagem padrão configurável
ALTER TABLE site_configs 
ADD COLUMN default_message TEXT DEFAULT 'Olá! Gostaria de mais informações sobre seus produtos/serviços.';
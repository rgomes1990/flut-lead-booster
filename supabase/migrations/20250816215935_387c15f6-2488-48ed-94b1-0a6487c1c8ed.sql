-- Atualizar o usuário financeiro@rsgtecnologia.com para ser administrador
UPDATE public.profiles 
SET user_type = 'admin'
WHERE email = 'financeiro@rsgtecnologia.com';
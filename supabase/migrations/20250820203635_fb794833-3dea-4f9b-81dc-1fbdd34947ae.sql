-- Atualizar o tipo de usuário Wagner para admin
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE email = 'wagner@rsggroup.com.br';
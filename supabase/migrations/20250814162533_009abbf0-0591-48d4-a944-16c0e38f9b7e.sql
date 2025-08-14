-- Criar usuário administrador inicial
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@flut.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Administrador FLUT"}',
  false,
  'authenticated'
);

-- Criar perfil para o administrador
INSERT INTO public.profiles (user_id, email, name, user_type)
SELECT 
  id,
  'admin@flut.com',
  'Administrador FLUT',
  'admin'::user_type
FROM auth.users 
WHERE email = 'admin@flut.com';
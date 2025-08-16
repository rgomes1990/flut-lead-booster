-- Adicionar política para que administradores possam ver todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles admin_profile 
  WHERE admin_profile.user_id = auth.uid() 
  AND admin_profile.user_type = 'admin'
));
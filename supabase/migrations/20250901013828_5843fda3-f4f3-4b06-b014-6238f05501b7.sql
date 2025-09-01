
-- Criar tabela para os perfis de landing pages
CREATE TABLE public.landing_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para os campos padrão de cada perfil
CREATE TABLE public.landing_profile_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.landing_profiles(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, textarea, number, image, select, etc
  field_label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 0,
  step_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para as landing pages dos usuários
CREATE TABLE public.user_landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.landing_profiles(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Criar tabela para os dados das landing pages
CREATE TABLE public.landing_page_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.user_landing_pages(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(landing_page_id, field_name)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.landing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_data ENABLE ROW LEVEL SECURITY;

-- Políticas para landing_profiles
CREATE POLICY "Admins can manage all landing profiles"
  ON public.landing_profiles FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view active landing profiles"
  ON public.landing_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas para landing_profile_fields
CREATE POLICY "Admins can manage all profile fields"
  ON public.landing_profile_fields FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view profile fields"
  ON public.landing_profile_fields FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.landing_profiles 
    WHERE id = profile_id AND is_active = true
  ));

-- Políticas para user_landing_pages
CREATE POLICY "Admins can view all user landing pages"
  ON public.user_landing_pages FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can manage own landing pages"
  ON public.user_landing_pages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para acesso público às landing pages publicadas
CREATE POLICY "Public can view published landing pages"
  ON public.user_landing_pages FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Políticas para landing_page_data
CREATE POLICY "Admins can view all landing page data"
  ON public.landing_page_data FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can manage own landing page data"
  ON public.landing_page_data FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_landing_pages 
    WHERE id = landing_page_id AND user_id = auth.uid()
  ));

-- Política para acesso público aos dados de landing pages publicadas
CREATE POLICY "Public can view published landing page data"
  ON public.landing_page_data FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_landing_pages 
    WHERE id = landing_page_id AND is_published = true
  ));

-- Inserir o perfil "Corretor" com seus campos padrão
INSERT INTO public.landing_profiles (name, description) VALUES 
('Corretor', 'Perfil para corretores de imóveis com campos específicos para venda de propriedades');

-- Inserir os campos padrão do perfil Corretor
WITH profile AS (SELECT id FROM public.landing_profiles WHERE name = 'Corretor')
INSERT INTO public.landing_profile_fields (profile_id, step_name, field_name, field_type, field_label, placeholder, is_required, field_order, step_order) 
SELECT profile.id, step_name, field_name, field_type, field_label, placeholder, is_required, field_order, step_order
FROM profile, (VALUES
  -- Etapa 1: Banner (step_order = 1)
  ('Banner', 'banner_image', 'image', 'Imagem do Banner', 'Selecione a imagem principal', true, 1, 1),
  ('Banner', 'banner_title', 'text', 'Título do Banner', 'Digite o título principal', true, 2, 1),
  ('Banner', 'banner_subtitle', 'text', 'Subtítulo do Banner', 'Digite o subtítulo', false, 3, 1),
  
  -- Etapa 2: Descrição (step_order = 2)
  ('Descrição', 'description_title', 'text', 'Título da Descrição', 'Digite o título da descrição', true, 1, 2),
  ('Descrição', 'description_content', 'textarea', 'Conteúdo da Descrição', 'Descreva o imóvel detalhadamente', true, 2, 2),
  
  -- Etapa 3: Informações Técnicas (step_order = 3)
  ('Informações', 'info_title', 'text', 'Título das Informações', 'Digite o título das informações técnicas', true, 1, 3),
  ('Informações', 'info_price', 'text', 'Valor do Imóvel', 'Ex: R$ 450.000,00', false, 2, 3),
  ('Informações', 'info_rooms', 'number', 'Número de Quartos', 'Ex: 3', false, 3, 3),
  ('Informações', 'info_bathrooms', 'number', 'Número de Banheiros', 'Ex: 2', false, 4, 3),
  ('Informações', 'info_parking', 'number', 'Vagas de Garagem', 'Ex: 2', false, 5, 3),
  ('Informações', 'info_area', 'text', 'Área Total', 'Ex: 120m²', false, 6, 3),
  ('Informações', 'info_type', 'text', 'Tipo do Imóvel', 'Ex: Apartamento', false, 7, 3),
  
  -- Etapa 4: Localização (step_order = 4)
  ('Localização', 'location_title', 'text', 'Título da Localização', 'Digite o título da localização', true, 1, 4),
  ('Localização', 'location_address', 'text', 'Endereço Completo', 'Rua, número, complemento', true, 2, 4),
  ('Localização', 'location_neighborhood', 'text', 'Bairro', 'Nome do bairro', true, 3, 4),
  ('Localização', 'location_city', 'text', 'Cidade', 'Nome da cidade', true, 4, 4),
  ('Localização', 'location_description', 'textarea', 'Descrição da Localização', 'Descreva os pontos importantes da região', false, 5, 4),
  
  -- Etapa 5: Galeria (step_order = 5)
  ('Galeria', 'gallery_images', 'multiple_images', 'Galeria de Imagens', 'Adicione múltiplas imagens do imóvel', false, 1, 5),
  
  -- Etapa 6: Sobre o Corretor (step_order = 6)
  ('Sobre', 'broker_photo', 'image', 'Foto do Corretor', 'Adicione sua foto profissional', true, 1, 6),
  ('Sobre', 'broker_name', 'text', 'Nome do Corretor', 'Seu nome completo', true, 2, 6),
  ('Sobre', 'broker_creci', 'text', 'CRECI', 'Número do seu CRECI', true, 3, 6),
  ('Sobre', 'broker_phone', 'text', 'Telefone', 'Seu telefone de contato', true, 4, 6),
  ('Sobre', 'broker_whatsapp', 'text', 'WhatsApp', 'Seu número do WhatsApp', true, 5, 6),
  ('Sobre', 'broker_email', 'email', 'E-mail', 'Seu e-mail profissional', true, 6, 6),
  ('Sobre', 'broker_description', 'textarea', 'Descrição Profissional', 'Conte sobre sua experiência', false, 7, 6),
  
  -- Etapa 7: Área de Lazer (step_order = 7)
  ('Área de Lazer', 'leisure_title', 'text', 'Título da Área de Lazer', 'Digite o título da área de lazer', true, 1, 7),
  ('Leisure', 'leisure_subtitle', 'text', 'Subtítulo da Área de Lazer', 'Digite o subtítulo', false, 2, 7),
  ('Área de Lazer', 'leisure_items', 'textarea', 'Itens da Área de Lazer', 'Liste as comodidades disponíveis (uma por linha)', false, 3, 7),
  
  -- Etapa 8: Rodapé (step_order = 8)
  ('Rodapé', 'footer_text', 'textarea', 'Texto do Rodapé', 'Informações adicionais ou observações', false, 1, 8)
) AS fields(step_name, field_name, field_type, field_label, placeholder, is_required, field_order, step_order);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_landing_profiles_updated_at 
  BEFORE UPDATE ON public.landing_profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_landing_profile_fields_updated_at 
  BEFORE UPDATE ON public.landing_profile_fields 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_user_landing_pages_updated_at 
  BEFORE UPDATE ON public.user_landing_pages 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_landing_page_data_updated_at 
  BEFORE UPDATE ON public.landing_page_data 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

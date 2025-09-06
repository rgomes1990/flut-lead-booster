
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, MapPin, Calendar, Video, Image as ImageIcon, Play, School, Hospital, ShoppingCart } from "lucide-react";
import PulsatingWhatsAppButton from "@/components/PulsatingWhatsAppButton";

interface LandingPageData {
  [key: string]: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  user_id: string;
}

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [landingData, setLandingData] = useState<LandingPageData>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userSiteId, setUserSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPublicLandingPage();
    }
  }, [slug]);

  useEffect(() => {
    console.log('useEffect do script - userSiteId:', userSiteId);
    if (userSiteId) {
      // Adicionar script do widget dinamicamente
      console.log('Carregando script do widget para siteId:', userSiteId);
      const script = document.createElement('script');
      script.src = `https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/widget-script?siteId=${userSiteId}`;
      script.async = true;
      script.onload = () => {
        console.log('Widget script loaded successfully for siteId:', userSiteId);
      };
      script.onerror = (error) => {
        console.error('Failed to load widget script:', error);
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup - remover script quando componente for desmontado
        try {
          if (script.parentNode) {
            document.body.removeChild(script);
            console.log('Script removido do DOM');
          }
        } catch (error) {
          console.warn('Error removing script:', error);
        }
      };
    } else {
      console.log('userSiteId ainda não definido, aguardando...');
    }
  }, [userSiteId]);

  const loadPublicLandingPage = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da landing page pública
      const { data: pageData, error: pageError } = await supabase
        .from("user_landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (pageError) {
        if (pageError.code === 'PGRST116') {
          setNotFound(true);
        }
        throw pageError;
      }

      setLandingPage(pageData);

      // Buscar site do usuário para usar o script do WhatsApp
      console.log('Buscando site para user_id:', pageData.user_id);
      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", pageData.user_id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      console.log('Site encontrado:', siteData, 'Erro:', siteError);

      if (!siteError && siteData) {
        console.log('Definindo userSiteId:', siteData.id);
        setUserSiteId(siteData.id);
      } else {
        console.warn('Nenhum site ativo encontrado para o usuário');
        // Se não encontrar site, criar um automaticamente para esta landing page
        const domain = `landing.${pageData.slug}.com`;
        
        const { data: newSite, error: createError } = await supabase
          .from("sites")
          .insert({
            user_id: pageData.user_id,
            domain: domain,
            is_active: true
          })
          .select()
          .single();

        if (!createError && newSite) {
          console.log('Site criado automaticamente:', newSite.id);
          setUserSiteId(newSite.id);

          // Buscar dados do perfil do usuário para criar configurações padrão
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("user_id", pageData.user_id)
            .single();

          // Criar configurações padrão do site
          await supabase
            .from("site_configs")
            .insert({
              site_id: newSite.id,
              company_name: userProfile?.name || "Empresa",
              email: userProfile?.email || "",
              phone: "",
              attendant_name: userProfile?.name || "Atendente",
              default_message: "Olá! Vim através da landing page.",
              icon_type: "whatsapp",
              icon_position: "bottom",
              field_name: true,
              field_email: true,
              field_phone: true,
              field_message: true,
              field_capture_page: true,
              is_active: true
            });
        } else {
          console.error('Erro ao criar site automaticamente:', createError);
        }
      }

      // Carregar dados salvos da landing page
      const { data: savedData, error: dataError } = await supabase
        .from("landing_page_data")
        .select("*")
        .eq("landing_page_id", pageData.id);

      if (dataError) throw dataError;
      
      const dataMap: LandingPageData = {};
      savedData?.forEach(item => {
        dataMap[item.field_name] = item.field_value || '';
      });
      setLandingData(dataMap);

    } catch (error: any) {
      console.error("Error loading public landing page:", error);
      if (!notFound) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phone = landingData.broker_whatsapp?.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi seu anúncio da propriedade "${landingPage?.name}" e gostaria de mais informações.`);
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    }
  };

  const handlePhoneClick = () => {
    const phone = landingData.broker_phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmailClick = () => {
    const email = landingData.broker_email;
    const subject = encodeURIComponent(`Interesse na propriedade: ${landingPage?.name}`);
    if (email) {
      window.open(`mailto:${email}?subject=${subject}`, '_self');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (notFound || !landingPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">A landing page solicitada não existe ou não está publicada.</p>
        </div>
      </div>
    );
  }

  const parseImages = (imageField: string) => {
    try {
      return JSON.parse(imageField);
    } catch {
      return imageField ? [imageField] : [];
    }
  };

  // Helper function to get correct image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    
    // Se a imagem já é uma URL completa, retorna como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Se a imagem começa com "uploaded/", é um mock - mapear para uma das imagens existentes
    if (imagePath.startsWith('uploaded/')) {
      // Mapear para imagens existentes no public/lovable-uploads baseado no nome
      const fileName = imagePath.replace('uploaded/', '').replace(/-\d+$/, '');
      
      // Lista de mapeamentos conhecidos
      const imageMappings: Record<string, string> = {
        'logo-flut.svg': '/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png',
        'banner-right.webp': '/lovable-uploads/7e3e4947-1420-463e-9783-4a6efb0c47ca.png', 
        'sobre-left.webp': '/lovable-uploads/f5619431-8313-40c2-84d7-beabfa0ba9cc.png',
        'foto1.webp': '/lovable-uploads/7e3e4947-1420-463e-9783-4a6efb0c47ca.png',
        'foto2.webp': '/lovable-uploads/f5619431-8313-40c2-84d7-beabfa0ba9cc.png',
        'foto3.webp': '/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png'
      };
      
      return imageMappings[fileName] || '/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png';
    }
    
    // Se não tem prefixo, assumir que é do Supabase Storage
    return imagePath;
  };

  const galleryImages = landingData.gallery_images ? parseImages(landingData.gallery_images) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {landingData.logo_image ? (
              <img src={getImageUrl(landingData.logo_image)} alt="Logo" className="h-10 w-auto" />
            ) : (
              <div className="text-xl font-bold text-gray-900">{landingPage.name}</div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#empreendimento" className="text-gray-700 hover:text-gray-900 transition-colors">O Empreendimento</a>
            <a href="#plantas" className="text-gray-700 hover:text-gray-900 transition-colors">Plantas</a>
            <a href="#lazer" className="text-gray-700 hover:text-gray-900 transition-colors">Lazer</a>
            <a href="#localizacao" className="text-gray-700 hover:text-gray-900 transition-colors">Localização</a>
            <a href="#galeria" className="text-gray-700 hover:text-gray-900 transition-colors">Fotos</a>
          </nav>

          {/* CTA Button */}
          <Button className="bg-green-600 hover:bg-green-700 text-white trigger-flut">
            <MessageCircle className="h-4 w-4 mr-2" />
            Fale Conosco
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <div className="bg-gray-900 text-white p-12 rounded-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {landingData.banner_title || landingPage.name}
            </h1>
            {landingData.banner_subtitle && (
              <p className="text-xl mb-8 text-gray-300 leading-relaxed">
                {landingData.banner_subtitle}
              </p>
            )}
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 trigger-flut"
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              Vamos Conversar?
            </Button>
          </div>
          
          {/* Right Side - Image */}
          <div className="relative">
            {landingData.banner_image ? (
              <img 
                src={getImageUrl(landingData.banner_image)} 
                alt="Banner" 
                className="w-full h-[600px] object-cover rounded-lg shadow-xl"
              />
            ) : (
              <div className="w-full h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Imagem do banner</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="empreendimento" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Building Image */}
            <div>
              {landingData.description_image ? (
                <img 
                  src={getImageUrl(landingData.description_image)} 
                  alt="Empreendimento" 
                  className="w-full h-[500px] object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Imagem do empreendimento</p>
                </div>
              )}
            </div>
            
            {/* Right Side - Text */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                {landingData.description_title || `Conheça o novo ${landingPage.name}`}
              </h2>
              {landingData.description_content && (
                <div className="text-lg leading-relaxed text-gray-700 mb-8">
                  {landingData.description_content}
                </div>
              )}
              
              {/* Technical Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                {landingData.info_area && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{landingData.info_area}</div>
                    <div className="text-sm text-gray-600">Metragem</div>
                  </div>
                )}
                {landingData.info_rooms && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{landingData.info_rooms}</div>
                    <div className="text-sm text-gray-600">Suítes</div>
                  </div>
                )}
                {landingData.info_parking && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{landingData.info_parking}</div>
                    <div className="text-sm text-gray-600">Vagas</div>
                  </div>
                )}
                {landingData.info_price && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2 md:col-span-3">
                    <div className="text-2xl font-bold text-green-600">{landingData.info_price}</div>
                    <div className="text-sm text-gray-600">Valor</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Location Section */}
      {landingData.location_address && (
        <section id="localizacao" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Side - Aerial Image */}
              <div>
                {landingData.location_image ? (
                  <img 
                    src={getImageUrl(landingData.location_image)} 
                    alt="Localização" 
                    className="w-full h-[500px] object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Right Side - Text */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  {landingData.location_title || "Conheça mais sobre o bairro"}
                </h2>
                <p className="text-lg text-gray-700 mb-8">
                  {landingData.location_description || "Uma localização privilegiada com tudo por perto."}
                </p>
                
                {/* Conveniences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <School className="h-6 w-6 text-blue-600" />
                    <span className="text-gray-700">Escolas próximas</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Hospital className="h-6 w-6 text-red-600" />
                    <span className="text-gray-700">Hospitais</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                    <span className="text-gray-700">Shopping centers</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-6 w-6 text-purple-600" />
                    <span className="text-gray-700">Parques</span>
                  </div>
                </div>
                
                {/* Address */}
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Endereço</h3>
                  <p className="text-gray-300">
                    {landingData.location_address}
                    {landingData.location_neighborhood && `, ${landingData.location_neighborhood}`}
                    {landingData.location_city && `, ${landingData.location_city}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="galeria" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Galeria de Imagens
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image: string, index: number) => (
                <div key={index} className="relative overflow-hidden rounded-lg shadow-lg group">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`Galeria ${index + 1}`}
                    className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Broker Section */}
      {landingData.broker_name && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Side - Photo */}
              <div className="text-center">
                {landingData.broker_photo ? (
                  <img 
                    src={getImageUrl(landingData.broker_photo)} 
                    alt={landingData.broker_name}
                    className="w-80 h-80 object-cover rounded-full mx-auto shadow-xl"
                  />
                ) : (
                  <div className="w-80 h-80 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                    <p className="text-gray-500">Foto do corretor</p>
                  </div>
                )}
              </div>
              
              {/* Right Side - Info */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                  Eu sou o {landingData.broker_name}
                </h2>
                {landingData.broker_creci && (
                  <p className="text-lg text-gray-600 mb-4">
                    CRECI: {landingData.broker_creci}
                  </p>
                )}
                {landingData.broker_description && (
                  <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                    {landingData.broker_description}
                  </p>
                )}
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 trigger-flut"
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Vamos Conversar?
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Amenities Section */}
      {landingData.leisure_items && (
        <section id="lazer" className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {landingData.leisure_title || 'Diferenciais e Lazer'}
            </h2>
            {landingData.leisure_subtitle && (
              <p className="text-xl text-gray-300 mb-12">
                {landingData.leisure_subtitle}
              </p>
            )}
            
            {/* Featured Amenity Image */}
            {landingData.leisure_image && (
              <div className="mb-12">
                <img 
                  src={getImageUrl(landingData.leisure_image)} 
                  alt="Lazer em destaque"
                  className="w-full max-w-2xl mx-auto h-64 object-cover rounded-lg shadow-xl"
                />
              </div>
            )}
            
            {/* Amenities List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {landingData.leisure_items.split('\n').filter(item => item.trim()).map((item, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg text-center">
                  <span className="text-white">{item.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo and About */}
            <div className="md:col-span-2">
              {landingData.logo_image ? (
                <img src={getImageUrl(landingData.logo_image)} alt="Logo" className="h-12 w-auto mb-4" />
              ) : (
                <div className="text-2xl font-bold mb-4">{landingPage.name}</div>
              )}
              <p className="text-gray-400 leading-relaxed">
                {landingData.footer_text || "Sobre a empresa - Especialista em imóveis de alto padrão."}
              </p>
            </div>
            
            {/* Menu Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Menu</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#empreendimento" className="hover:text-white transition-colors">O Empreendimento</a></li>
                <li><a href="#plantas" className="hover:text-white transition-colors">Plantas</a></li>
                <li><a href="#lazer" className="hover:text-white transition-colors">Lazer</a></li>
                <li><a href="#localizacao" className="hover:text-white transition-colors">Localização</a></li>
                <li><a href="#galeria" className="hover:text-white transition-colors">Fotos</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contato</h3>
              <div className="space-y-2 text-gray-400">
                {landingData.broker_phone && (
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {landingData.broker_phone}
                  </p>
                )}
                {landingData.broker_whatsapp && (
                  <p className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {landingData.broker_whatsapp}
                  </p>
                )}
                {landingData.broker_email && (
                  <p className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {landingData.broker_email}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {landingPage.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLandingPage;


import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle } from "lucide-react";

interface LandingPageData {
  [key: string]: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
}

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [landingData, setLandingData] = useState<LandingPageData>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPublicLandingPage();
    }
  }, [slug]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Section */}
      <section className="relative h-[60vh] bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            {landingData.banner_title || landingPage.name}
          </h1>
          {landingData.banner_subtitle && (
            <p className="text-xl md:text-2xl opacity-90">
              {landingData.banner_subtitle}
            </p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Descrição */}
        {landingData.description_content && (
          <section>
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">
                  {landingData.description_title || 'Sobre o Imóvel'}
                </h2>
                <div className="text-lg leading-relaxed whitespace-pre-line">
                  {landingData.description_content}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Informações Técnicas */}
        <section>
          <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6">
                {landingData.info_title || 'Informações do Imóvel'}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingData.info_price && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{landingData.info_price}</div>
                    <div className="text-muted-foreground">Valor</div>
                  </div>
                )}
                {landingData.info_rooms && (
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{landingData.info_rooms}</div>
                    <div className="text-muted-foreground">Quartos</div>
                  </div>
                )}
                {landingData.info_bathrooms && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{landingData.info_bathrooms}</div>
                    <div className="text-muted-foreground">Banheiros</div>
                  </div>
                )}
                {landingData.info_parking && (
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{landingData.info_parking}</div>
                    <div className="text-muted-foreground">Vagas</div>
                  </div>
                )}
                {landingData.info_area && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{landingData.info_area}</div>
                    <div className="text-muted-foreground">Área</div>
                  </div>
                )}
                {landingData.info_type && (
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{landingData.info_type}</div>
                    <div className="text-muted-foreground">Tipo</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Localização */}
        {landingData.location_address && (
          <section>
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">
                  {landingData.location_title || 'Localização'}
                </h2>
                <div className="space-y-4">
                  <div className="text-lg">
                    <strong>Endereço:</strong> {landingData.location_address}
                  </div>
                  {landingData.location_neighborhood && (
                    <div className="text-lg">
                      <strong>Bairro:</strong> {landingData.location_neighborhood}
                    </div>
                  )}
                  {landingData.location_city && (
                    <div className="text-lg">
                      <strong>Cidade:</strong> {landingData.location_city}
                    </div>
                  )}
                  {landingData.location_description && (
                    <div className="text-lg leading-relaxed whitespace-pre-line">
                      {landingData.location_description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Área de Lazer */}
        {landingData.leisure_items && (
          <section>
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">
                  {landingData.leisure_title || 'Área de Lazer'}
                </h2>
                {landingData.leisure_subtitle && (
                  <p className="text-lg mb-6 text-muted-foreground">{landingData.leisure_subtitle}</p>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {landingData.leisure_items.split('\n').filter(item => item.trim()).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Sobre o Corretor */}
        {landingData.broker_name && (
          <section>
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Sobre o Corretor</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <div className="w-48 h-48 bg-muted rounded-full mx-auto flex items-center justify-center text-muted-foreground">
                      Foto do Corretor
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-2xl font-bold">{landingData.broker_name}</h3>
                    {landingData.broker_creci && (
                      <p className="text-lg">
                        <strong>CRECI:</strong> {landingData.broker_creci}
                      </p>
                    )}
                    {landingData.broker_description && (
                      <p className="text-lg leading-relaxed whitespace-pre-line">
                        {landingData.broker_description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 pt-4">
                      {landingData.broker_whatsapp && (
                        <Button onClick={handleWhatsAppClick} className="bg-green-600 hover:bg-green-700">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      {landingData.broker_phone && (
                        <Button onClick={handlePhoneClick} variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Telefone
                        </Button>
                      )}
                      {landingData.broker_email && (
                        <Button onClick={handleEmailClick} variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          E-mail
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Rodapé */}
        {landingData.footer_text && (
          <footer className="text-center py-8 border-t">
            <div className="text-muted-foreground whitespace-pre-line">
              {landingData.footer_text}
            </div>
          </footer>
        )}
      </div>

      {/* Botão flutuante do WhatsApp */}
      {landingData.broker_whatsapp && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleWhatsAppClick}
            size="lg"
            className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700 shadow-lg"
          >
            <MessageCircle className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicLandingPage;

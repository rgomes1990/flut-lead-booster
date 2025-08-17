import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Settings, MessageCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";

const SiteConfig = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [site, setSite] = useState<any>(null);
  const [config, setConfig] = useState({
    company_name: "",
    email: "",
    phone: "",
    attendant_name: "",
    field_phone: true,
    field_name: true,
    field_email: true,
    field_message: true,
    field_capture_page: true,
    icon_type: "whatsapp",
    icon_position: "bottom",
    is_active: true,
    default_message: "Olá! Gostaria de mais informações sobre seus produtos/serviços."
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) {
      loadSiteAndConfig();
    }
  }, [siteId]);

  const loadSiteAndConfig = async () => {
    try {
      // Carregar dados do site
      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .single();

      if (siteError) throw siteError;
      setSite(siteData);

      // Carregar configuração do site
      const { data: configData, error: configError } = await supabase
        .from("site_configs")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();

      if (configData) {
        setConfig(configData);
      } else if (configError) {
        throw configError;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading site config:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do site",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from("site_configs")
        .upsert({
          ...config,
          site_id: siteId
        }, {
          onConflict: 'site_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateScript = () => {
    const supabaseUrl = "https://qwisnnipdjqmxpgfvhij.supabase.co";
    return `<!-- Início Flut -->
<script src="${supabaseUrl}/functions/v1/widget-script?siteId=${siteId}"></script>
<!-- Fim Flut -->`;
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generateScript());
    toast({
      title: "Código copiado!",
      description: "O código foi copiado para a área de transferência",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="text-center">Site não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/sites")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Configurações do Site</h1>
              <p className="text-muted-foreground">{site.domain}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Lado esquerdo - Configurações */}
            <div className="space-y-6">
              {/* Informações do Site */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Entre com as informações do site
                  </CardTitle>
                  <CardDescription>
                    Informe o nome da empresa, email, atendente e número do WhatsApp que receberá as mensagens vindas do site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Site</Label>
                    <Input 
                      id="domain" 
                      value={site.domain} 
                      disabled 
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Nome da Empresa</Label>
                    <Input
                      id="company"
                      value={config.company_name}
                      onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={config.email}
                      onChange={(e) => setConfig({ ...config, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attendant">Atendente</Label>
                    <Input
                      id="attendant"
                      value={config.attendant_name}
                      onChange={(e) => setConfig({ ...config, attendant_name: e.target.value })}
                      placeholder="Nome do atendente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      value={config.phone}
                      onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="default_message">Mensagem Padrão no Formulário</Label>
                    <Input
                      id="default_message"
                      value={config.default_message}
                      onChange={(e) => setConfig({ ...config, default_message: e.target.value })}
                      placeholder="Mensagem que aparecerá pré-preenchida no campo de mensagem"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta mensagem aparecerá como padrão no campo de mensagem do formulário, mas o usuário pode editá-la.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Campos para solicitar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Ative os campos que deseja solicitar do cliente
                  </CardTitle>
                  <CardDescription>
                    Importante: Os campos desativados não poderão ser capturados com as informações dos clientes que enviarem mensagens para você.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-phone"
                      checked={config.field_phone}
                      onCheckedChange={(checked) => setConfig({ ...config, field_phone: !!checked })}
                    />
                    <Label htmlFor="field-phone">Campo telefone</Label>
                    <Badge variant="secondary">obrigatório</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-name"
                      checked={config.field_name}
                      onCheckedChange={(checked) => setConfig({ ...config, field_name: !!checked })}
                    />
                    <Label htmlFor="field-name">Campo nome</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-email"
                      checked={config.field_email}
                      onCheckedChange={(checked) => setConfig({ ...config, field_email: !!checked })}
                    />
                    <Label htmlFor="field-email">Campo email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-message"
                      checked={config.field_message}
                      onCheckedChange={(checked) => setConfig({ ...config, field_message: !!checked })}
                    />
                    <Label htmlFor="field-message">Campo mensagem</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-capture-page"
                      checked={config.field_capture_page}
                      onCheckedChange={(checked) => setConfig({ ...config, field_capture_page: !!checked })}
                    />
                    <Label htmlFor="field-capture-page">Capturar página</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capturar a página que o usuário está acessando no site.
                  </p>
                </CardContent>
              </Card>

              {/* Escolha do Ícone */}
              <Card>
                <CardHeader>
                  <CardTitle>Escolha o ícone do Flut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        config.icon_type === 'whatsapp' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setConfig({ ...config, icon_type: 'whatsapp' })}
                    >
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
                        </svg>
                      </div>
                    </button>
                    <button
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        config.icon_type === 'whatsapp-alt' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setConfig({ ...config, icon_type: 'whatsapp-alt' })}
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Posição do Ícone */}
              <Card>
                <CardHeader>
                  <CardTitle>Defina a posição do ícone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {['top', 'center', 'bottom'].map((position) => (
                      <button
                        key={position}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          config.icon_position === position
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setConfig({ ...config, icon_position: position })}
                      >
                        {position === 'top' && 'Topo'}
                        {position === 'center' && 'Centro'}
                        {position === 'bottom' && 'Baixo'}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveConfig} className="w-full" size="lg">
                Salvar Configurações
              </Button>
            </div>

            {/* Lado direito - Código */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Ative o Flut em seu site
                  </CardTitle>
                  <CardDescription>
                    Copie o código abaixo e coloque em seu site antes da tag &lt;/body&gt;.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <code className="text-sm font-mono break-all">
                      {generateScript()}
                    </code>
                  </div>
                  <Button onClick={copyScript} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar código
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Se você precisa de ajuda para colocar o código em seu site, não se preocupe. A nossa equipe pode fazer a ativação{" "}
                    <span className="font-semibold">gratuitamente</span> para você.{" "}
                    <a href="https://wa.me/5511278386442" target="_blank" className="text-blue-600 hover:underline">
                      Clique aqui se precisa de ajuda.
                    </a>
                  </p>
                </CardContent>
              </Card>

              {/* Preview do Widget */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Widget</CardTitle>
                  <CardDescription>
                    Assim ficará o widget em seu site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-6 relative h-64">
                    <div 
                      className={`absolute ${
                        config.icon_position === 'top' ? 'top-4' :
                        config.icon_position === 'center' ? 'top-1/2 -translate-y-1/2' :
                        'bottom-4'
                      } right-4`}
                    >
                      {config.icon_type === 'whatsapp' ? (
                        <div className="bg-green-500 rounded-full p-3 shadow-lg cursor-pointer hover:bg-green-600 transition-colors">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="bg-white rounded-full p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all border-2 border-gray-200">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-gray-500 mt-8">
                      Visualização do seu site
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteConfig;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, ExternalLink, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeadCaptureWidget from "@/components/LeadCaptureWidget";

const LeadDemo = () => {
  const navigate = useNavigate();
  
  const scriptCode = `<!-- FLUT Widget de Captura de Leads -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/show-modal?script_id=1234';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Demo - Captura de Leads</h1>
            <p className="text-muted-foreground">
              Demonstração do widget de captura de leads do FLUT
            </p>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Acessar Sistema
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Informações do Widget */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Widget de Captura
                </CardTitle>
                <CardDescription>
                  Este é o widget que será incorporado no site do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  O botão flutuante aparece no canto inferior direito da página. 
                  Quando clicado, abre um formulário para capturar os dados do lead.
                  Os dados são enviados diretamente para o sistema FLUT.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver em ação →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Código de Integração
                </CardTitle>
                <CardDescription>
                  Copie e cole no site do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{scriptCode}</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Cada cliente recebe um script_id único para identificação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Visitante clica no botão</p>
                    <p className="text-sm text-muted-foreground">
                      O widget aparece como um botão flutuante no site
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Preenche o formulário</p>
                    <p className="text-sm text-muted-foreground">
                      Modal abre com campos para nome, email, WhatsApp e mensagem
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Lead é capturado</p>
                    <p className="text-sm text-muted-foreground">
                      Dados são enviados automaticamente para o dashboard do cliente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulação do Site */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulação do Site do Cliente</CardTitle>
                <CardDescription>
                  Esta é uma simulação de como o widget aparece no site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 min-h-[400px] relative border-2 border-dashed border-blue-200">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Bem-vindo ao Site da Empresa
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Este é um exemplo de como nosso widget de captura de leads
                      aparece em um site real. Clique no botão no canto inferior direito.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Nossos Serviços</h3>
                        <p className="text-sm text-gray-600">
                          Oferecemos soluções completas para sua empresa...
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Entre em Contato</h3>
                        <p className="text-sm text-gray-600">
                          Clique no botão do WhatsApp para falar conosco!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Widget de demonstração */}
        <LeadCaptureWidget 
          scriptId="DEMO-1234" 
          companyName="Empresa Demo"
          websiteUrl="https://exemplo.com"
        />
      </div>
    </div>
  );
};

export default LeadDemo;
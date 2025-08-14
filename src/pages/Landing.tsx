import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Users, BarChart3, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Captura via WhatsApp",
      description: "Integração direta com WhatsApp para capturar leads automaticamente"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multi-tenant",
      description: "Sistema seguro que separa os dados de cada cliente automaticamente"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Dashboard Completo",
      description: "Visualize e analise seus leads com gráficos e relatórios detalhados"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Automação Inteligente",
      description: "Processamento automático de leads com notificações em tempo real"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia e backups automáticos"
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Fácil Implementação",
      description: "Configure seu sistema de captura em minutos, sem complicações"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">FLUT</h1>
            <Badge variant="secondary">v1.0</Badge>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Acessar Sistema
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sistema de Captação de Leads via WhatsApp
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transforme suas conversas do WhatsApp em leads qualificados automaticamente. 
            Sistema completo, seguro e multi-tenant para sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Começar Agora
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/demo")}>
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Funcionalidades Principais</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar e converter seus leads de WhatsApp em um só lugar
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4 text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para Revolucionar sua Captação de Leads?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Junte-se às empresas que já transformaram seu WhatsApp em uma máquina de vendas
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              Acessar Sistema FLUT
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <h4 className="text-lg font-semibold">FLUT</h4>
              <span className="text-muted-foreground">
                © 2024 Sistema de Captação de Leads
              </span>
            </div>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm">Suporte</Button>
              <Button variant="ghost" size="sm">Documentação</Button>
              <Button variant="ghost" size="sm">Política de Privacidade</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
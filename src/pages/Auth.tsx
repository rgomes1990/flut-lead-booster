import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FlutLogo } from "@/components/FlutLogo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name }
        }
      });

      if (error) throw error;

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro, limpa qualquer sessão existente
      await supabase.auth.signOut();
      
      // Limpa storage local para evitar conflitos
      localStorage.clear();
      sessionStorage.clear();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });
        
        // Redireciona baseado no tipo de usuário após buscar o perfil
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("user_id", data.user.id)
            .single();
          
          if (profile?.user_type === 'admin') {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Cache limpo",
        description: "Dados de sessão foram removidos. Tente fazer login novamente.",
      });
    } catch (error: any) {
      console.error("Erro ao limpar cache:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <FlutLogo size="lg" />
          </div>
          <CardDescription className="text-muted-foreground">
            Sistema de captação de leads via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-primary-foreground" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearStorage}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpar dados de sessão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
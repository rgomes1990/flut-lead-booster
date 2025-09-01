
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  description: string;
}

const CreateLandingPage = () => {
  const { userProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [landingName, setLandingName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from("landing_profiles")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Erro ao carregar perfis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProfiles(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProfile || !landingName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um perfil e digite um nome para a landing page.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const slug = generateSlug(landingName);
      
      // Verificar se o slug já existe
      const { data: existingPage } = await supabase
        .from("user_landing_pages")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingPage) {
        toast({
          title: "Nome já em uso",
          description: "Já existe uma landing page com este nome. Tente um nome diferente.",
          variant: "destructive",
        });
        return;
      }

      // Criar a landing page
      const { data: newPage, error } = await supabase
        .from("user_landing_pages")
        .insert({
          user_id: userProfile?.user_id,
          profile_id: selectedProfile,
          name: landingName.trim(),
          slug: slug
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Landing page criada com sucesso!",
        description: "Agora você pode personalizá-la com suas informações.",
      });

      // Redirecionar para a edição da nova landing page
      navigate(`/landing-pages/${newPage.id}/edit`);
    } catch (error: any) {
      console.error("Error creating landing page:", error);
      toast({
        title: "Erro ao criar landing page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfiles) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando perfis...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/landing-pages")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nova Landing Page</h1>
              <p className="text-muted-foreground">Crie sua landing page personalizada</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configuração Inicial
              </CardTitle>
              <CardDescription>
                Escolha o perfil e defina o nome da sua landing page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile">Selecione seu perfil</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o perfil que melhor se adequa ao seu negócio" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div>
                            <div className="font-medium">{profile.name}</div>
                            <div className="text-sm text-muted-foreground">{profile.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Landing Page</Label>
                  <Input
                    id="name"
                    value={landingName}
                    onChange={(e) => setLandingName(e.target.value)}
                    placeholder="Ex: Apartamento no Centro da Cidade"
                    required
                  />
                  {landingName && (
                    <p className="text-sm text-muted-foreground">
                      URL será: <code>/public/{generateSlug(landingName)}</code>
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading || !selectedProfile || !landingName.trim()}>
                    {loading ? "Criando..." : "Criar Landing Page"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/landing-pages")}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateLandingPage;

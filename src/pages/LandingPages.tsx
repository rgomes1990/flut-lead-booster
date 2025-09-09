
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye, Trash2, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import { useNavigate } from "react-router-dom";

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  landing_profiles: {
    name: string;
  };
}

const LandingPages = () => {
  const { userProfile } = useAuth();
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      loadLandingPages();
    }
  }, [userProfile]);

  const loadLandingPages = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("user_landing_pages")
        .select(`
          *,
          landing_profiles (
            name
          )
        `);

      // Se for cliente, filtrar apenas suas próprias landing pages
      if (userProfile?.user_type === 'client') {
        query = query.eq('user_id', userProfile.user_id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setLandingPages(data || []);
    } catch (error: any) {
      console.error("Error loading landing pages:", error);
      toast({
        title: "Erro ao carregar landing pages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta landing page?")) return;

    try {
      const { error } = await supabase
        .from("user_landing_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Landing page excluída com sucesso!",
      });

      loadLandingPages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir landing page",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("user_landing_pages")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: `Landing page ${!currentStatus ? 'publicada' : 'despublicada'} com sucesso!`,
      });

      loadLandingPages();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status da landing page",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando...</div>
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Landing Pages</h1>
              <p className="text-muted-foreground">Crie e gerencie suas landing pages personalizadas</p>
            </div>
            
            <Button onClick={() => navigate("/landing-pages/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Landing Page
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Suas Landing Pages
                  </CardTitle>
                  <CardDescription>
                    Lista de todas as suas landing pages criadas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {landingPages.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma landing page encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece criando sua primeira landing page personalizada
                  </p>
                  <Button onClick={() => navigate("/landing-pages/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Landing Page
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {landingPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">{page.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {page.landing_profiles?.name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            /public/{page.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={page.is_published ? 'default' : 'secondary'}>
                            {page.is_published ? 'Publicada' : 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(page.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/landing-pages/${page.id}/edit`)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {page.is_published && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://app.flut.com.br/public/${page.slug}`, '_blank')}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={page.is_published ? "secondary" : "default"}
                            onClick={() => handleTogglePublish(page.id, page.is_published)}
                            title={page.is_published ? "Despublicar" : "Publicar"}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(page.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPages;

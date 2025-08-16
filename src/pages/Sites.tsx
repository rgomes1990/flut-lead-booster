import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";

const Sites = () => {
  const { userProfile } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newSite, setNewSite] = useState({ 
    domain: "", 
    user_id: "" 
  });
  const [editingSite, setEditingSite] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === 'admin') {
      loadSites();
      loadUsers();
    }
  }, [userProfile]);

  const loadSites = async () => {
    try {
      const { data: sitesData, error } = await supabase
        .from("sites")
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            user_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSites(sitesData || []);
    } catch (error) {
      console.error("Error loading sites:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const createSite = async () => {
    try {
      if (!newSite.domain || !newSite.user_id) {
        toast({
          title: "Erro",
          description: "Domínio e usuário são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Extrair domínio de URL completa se necessário
      let domain = newSite.domain.trim();
      
      // Remover protocolo se presente
      domain = domain.replace(/^https?:\/\//, '');
      
      // Remover www se presente
      domain = domain.replace(/^www\./, '');
      
      // Remover barra final se presente
      domain = domain.replace(/\/$/, '');

      // Validar formato do domínio
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        toast({
          title: "Erro",
          description: "Por favor, insira um domínio válido (ex: exemplo.com)",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("sites")
        .insert({
          domain: domain, // Salvar apenas o domínio limpo
          user_id: newSite.user_id
        });

      if (error) throw error;

      toast({
        title: "Site criado com sucesso!",
      });

      setNewSite({ domain: "", user_id: "" });
      setDialogOpen(false);
      loadSites();
    } catch (error: any) {
      toast({
        title: "Erro ao criar site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateSite = async () => {
    try {
      if (!editingSite.domain || !editingSite.user_id) {
        toast({
          title: "Erro",
          description: "Domínio e usuário são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Extrair domínio de URL completa se necessário
      let domain = editingSite.domain.trim();
      
      // Remover protocolo se presente
      domain = domain.replace(/^https?:\/\//, '');
      
      // Remover www se presente
      domain = domain.replace(/^www\./, '');
      
      // Remover barra final se presente
      domain = domain.replace(/\/$/, '');

      // Validar formato do domínio
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        toast({
          title: "Erro",
          description: "Por favor, insira um domínio válido (ex: exemplo.com)",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("sites")
        .update({
          domain: domain, // Salvar domínio limpo
          user_id: editingSite.user_id,
          is_active: editingSite.is_active
        })
        .eq("id", editingSite.id);

      if (error) throw error;

      toast({
        title: "Site atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingSite(null);
      loadSites();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm("Tem certeza que deseja excluir este site?")) return;

    try {
      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", siteId);

      if (error) throw error;

      toast({
        title: "Site excluído com sucesso!",
      });

      loadSites();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir site",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (userProfile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Acesso negado. Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold">Gerenciar Sites</h1>
            <p className="text-muted-foreground">Administrar sites e vincular usuários</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Site</DialogTitle>
                <DialogDescription>
                  Adicione um novo domínio e vincule a um usuário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    value={newSite.domain}
                    onChange={(e) => setNewSite({ ...newSite, domain: e.target.value })}
                    placeholder="exemplo.com ou https://exemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="user">Usuário</Label>
                  <Select 
                    value={newSite.user_id} 
                    onValueChange={(value) => setNewSite({ ...newSite, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.name} ({user.email}) - {user.user_type === 'admin' ? 'Admin' : 'Cliente'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createSite} className="w-full">
                  Criar Site
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sites Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os sites e seus usuários vinculados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.domain}</TableCell>
                    <TableCell>{site.profiles?.name}</TableCell>
                    <TableCell>{site.profiles?.email}</TableCell>
                    <TableCell>
                      <Badge variant={site.profiles?.user_type === 'admin' ? 'default' : 'secondary'}>
                        {site.profiles?.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={site.is_active ? 'default' : 'secondary'}>
                        {site.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(site.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSite(site);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSite(site.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Site</DialogTitle>
              <DialogDescription>
                Edite as informações do site selecionado
              </DialogDescription>
            </DialogHeader>
            {editingSite && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-domain">Domínio</Label>
                  <Input
                    id="edit-domain"
                    value={editingSite.domain}
                    onChange={(e) => setEditingSite({ ...editingSite, domain: e.target.value })}
                    placeholder="exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-user">Usuário</Label>
                  <Select 
                    value={editingSite.user_id} 
                    onValueChange={(value) => setEditingSite({ ...editingSite, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.name} ({user.email}) - {user.user_type === 'admin' ? 'Admin' : 'Cliente'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-site-active"
                    checked={editingSite.is_active}
                    onChange={(e) => setEditingSite({ ...editingSite, is_active: e.target.checked })}
                  />
                  <Label htmlFor="edit-site-active">Site Ativo</Label>
                </div>
                <Button onClick={updateSite} className="w-full">
                  Atualizar Site
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
};

export default Sites;
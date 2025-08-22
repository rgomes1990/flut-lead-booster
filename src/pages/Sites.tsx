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
import { Plus, Edit, Trash2, Globe, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";
import SearchInput from "@/components/SearchInput";
import { Link } from "react-router-dom";

const Sites = () => {
  const { userProfile } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [filteredSites, setFilteredSites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [newSite, setNewSite] = useState({ 
    domain: "", 
    user_id: userProfile?.user_type === 'client' ? userProfile.user_id : "" 
  });
  const [editingSite, setEditingSite] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      loadSites();
      if (userProfile.user_type === 'admin') {
        loadUsers();
      }
    }
  }, [userProfile]);

  useEffect(() => {
    // Filtrar sites baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredSites(sites);
    } else {
      const filtered = sites.filter(site => 
        site.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSites(filtered);
    }
  }, [sites, searchTerm]);

  // Atualizar o user_id padrão quando o perfil do usuário carrega
  useEffect(() => {
    if (userProfile?.user_type === 'client') {
      setNewSite(prev => ({ ...prev, user_id: userProfile.user_id }));
    }
  }, [userProfile]);

  const loadSites = async () => {
    try {
      // Carregar sites baseado no tipo de usuário
      let sitesQuery = supabase
        .from("sites")
        .select("*");

      // Se for cliente, filtrar apenas seus próprios sites
      if (userProfile?.user_type === 'client') {
        sitesQuery = sitesQuery.eq('user_id', userProfile.user_id);
      }

      const { data: sitesData, error: sitesError } = await sitesQuery
        .order("created_at", { ascending: false });

      if (sitesError) throw sitesError;

      // Carregar perfis dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Combinar dados
      const sitesWithProfiles = sitesData?.map(site => {
        const profile = profilesData?.find(p => p.user_id === site.user_id);
        return {
          ...site,
          profiles: profile
        };
      }) || [];

      setSites(sitesWithProfiles);
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

      // Validar formato do domínio (aceita múltiplos pontos como .com.br)
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z0-9.-]+[a-zA-Z]{2,}$/;
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

      // Buscar dados do usuário para auto-preencher configurações do site
      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", newSite.user_id)
        .single();

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", newSite.user_id)
        .single();

      // Buscar o site recém-criado para obter o ID
      const { data: siteData } = await supabase
        .from("sites")
        .select("*")
        .eq("domain", domain)
        .eq("user_id", newSite.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (siteData) {
        // Criar configuração automática do site com dados do usuário
        await supabase
          .from("site_configs")
          .insert({
            site_id: siteData.id,
            company_name: userData?.name || '',
            email: userData?.email || '',
            phone: '',
            attendant_name: userData?.name || '',
            field_name: true,
            field_email: true,
            field_phone: true,
            field_message: true,
            field_capture_page: true,
            is_active: true,
            icon_type: 'whatsapp',
            icon_position: 'bottom',
            default_message: 'Olá! Gostaria de mais informações sobre seus produtos/serviços.'
          });
      }

      toast({
        title: "Site criado com sucesso!",
        description: "As configurações foram preenchidas automaticamente com seus dados.",
      });

      setNewSite({ domain: "", user_id: userProfile?.user_type === 'client' ? userProfile.user_id : "" });
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

  if (!userProfile || (userProfile.user_type !== 'admin' && userProfile.user_type !== 'client')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Acesso negado. Você não tem permissão para acessar esta página.</p>
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
          
          {/* Permitir criação de sites tanto para admin quanto para client */}
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
                  Adicione um novo domínio{userProfile?.user_type === 'admin' ? ' e vincule a um usuário' : ''}
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
                {userProfile?.user_type === 'admin' && (
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
                )}
                <Button onClick={createSite} className="w-full">
                  Criar Site
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sites Cadastrados
                </CardTitle>
                <CardDescription>
                  Lista de todos os sites e seus usuários vinculados
                </CardDescription>
              </div>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por domínio, usuário ou email..."
                className="w-72"
              />
            </div>
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
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">
                      <Link 
                        to={`/sites/${site.id}/config`}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {site.domain}
                      </Link>
                    </TableCell>
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
                      <Link to={`/sites/${site.id}/config`}>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Configurar site"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      {(userProfile?.user_type === 'admin' || site.user_id === userProfile?.user_id) && (
                        <>
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
                        </>
                      )}
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
                {userProfile?.user_type === 'admin' && (
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
                )}
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

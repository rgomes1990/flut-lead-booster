
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Search, Eye, EyeOff, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import SearchInput from "@/components/SearchInput";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'client';
  created_at: string;
}

interface Client {
  id: string;
  user_id: string;
  website_url?: string;
  whatsapp?: string;
}

interface Site {
  id: string;
  user_id: string;
  domain: string;
}

interface SiteConfig {
  id: string;
  site_id: string;
  company_name?: string;
  attendant_name?: string;
  email?: string;
  phone?: string;
}

interface UserWithDetails extends Profile {
  client?: Client;
  sites?: Site[];
  siteConfigs?: SiteConfig[];
  phone?: string;
  company_name?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    website_url: "",
    whatsapp: "",
    user_type: "client" as "admin" | "client"
  });
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Se for cliente, mostrar apenas seu próprio perfil
  const isAdmin = userProfile?.user_type === 'admin';

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["profiles-with-details", userProfile?.user_id],
    queryFn: async () => {
      console.log('Fetching profiles for user:', userProfile?.user_id, 'isAdmin:', isAdmin);
      
      if (isAdmin) {
        // Admin vê todos os perfis com detalhes
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        // Buscar dados dos clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*");

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
          throw clientsError;
        }

        // Buscar dados dos sites
        const { data: sitesData, error: sitesError } = await supabase
          .from("sites")
          .select("*");

        if (sitesError) {
          console.error('Error fetching sites:', sitesError);
          throw sitesError;
        }

        // Buscar configurações dos sites
        const { data: siteConfigsData, error: siteConfigsError } = await supabase
          .from("site_configs")
          .select("*");

        if (siteConfigsError) {
          console.error('Error fetching site configs:', siteConfigsError);
          throw siteConfigsError;
        }

        // Combinar os dados
        const usersWithDetails: UserWithDetails[] = profilesData.map(profile => {
          const client = clientsData.find(c => c.user_id === profile.user_id);
          const sites = sitesData.filter(s => s.user_id === profile.user_id);
          const userSiteIds = sites.map(s => s.id);
          const siteConfigs = siteConfigsData.filter(sc => userSiteIds.includes(sc.site_id));
          
          // Pegar o telefone e nome da empresa das configurações do site
          const mainSiteConfig = siteConfigs[0];
          
          return {
            ...profile,
            client,
            sites,
            siteConfigs,
            phone: mainSiteConfig?.phone || client?.whatsapp,
            company_name: mainSiteConfig?.company_name
          };
        });

        console.log('Users with details loaded:', usersWithDetails.length);
        return usersWithDetails;
      } else {
        // Cliente vê apenas seu próprio perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userProfile?.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching client profile:', profileError);
          throw profileError;
        }

        // Buscar dados do cliente
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", userProfile?.user_id)
          .maybeSingle();

        if (clientError) {
          console.error('Error fetching client data:', clientError);
        }

        // Buscar sites do cliente
        const { data: sitesData, error: sitesError } = await supabase
          .from("sites")
          .select("*")
          .eq("user_id", userProfile?.user_id);

        if (sitesError) {
          console.error('Error fetching sites:', sitesError);
        }

        // Buscar configurações dos sites
        let siteConfigsData = [];
        if (sitesData && sitesData.length > 0) {
          const siteIds = sitesData.map(s => s.id);
          const { data: configs, error: configsError } = await supabase
            .from("site_configs")
            .select("*")
            .in("site_id", siteIds);

          if (configsError) {
            console.error('Error fetching site configs:', configsError);
          } else {
            siteConfigsData = configs || [];
          }
        }

        const mainSiteConfig = siteConfigsData[0];

        const userWithDetails: UserWithDetails = {
          ...profileData,
          client: clientData || undefined,
          sites: sitesData || [],
          siteConfigs: siteConfigsData,
          phone: mainSiteConfig?.phone || clientData?.whatsapp,
          company_name: mainSiteConfig?.company_name
        };

        console.log('Client profile loaded:', userWithDetails);
        return [userWithDetails];
      }
    },
    enabled: !!userProfile?.user_id
  });

  const filteredProfiles = profiles?.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createUser = async () => {
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: newUser
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: response.data.message,
      });

      setNewUser({
        name: "",
        email: "",
        password: "",
        website_url: "",
        whatsapp: "",
        user_type: "client"
      });
      
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await supabase.functions.invoke('update-user', {
        body: {
          user_id: editingUser.user_id,
          name: editingUser.name,
          email: editingUser.email,
          website_url: editingUser.client?.website_url,
          whatsapp: editingUser.phone,
          user_type: editingUser.user_type
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      setEditingUser(null);
      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${userEmail} foi removido com sucesso`,
      });

      refetch();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? 'Gerenciar Usuários' : 'Meu Perfil'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin 
                ? 'Gerencie administradores e clientes do sistema'
                : 'Visualize as informações do seu perfil'
              }
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo usuário no sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Digite a senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="user_type">Tipo de Usuário</Label>
                    <Select value={newUser.user_type} onValueChange={(value: "admin" | "client") => setNewUser({...newUser, user_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="website_url">Site (opcional)</Label>
                    <Input
                      id="website_url"
                      value={newUser.website_url}
                      onChange={(e) => setNewUser({...newUser, website_url: e.target.value})}
                      placeholder="www.exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                    <Input
                      id="whatsapp"
                      value={newUser.whatsapp}
                      onChange={(e) => setNewUser({...newUser, whatsapp: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <Button onClick={createUser} className="w-full">
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>
                    Lista de todos os usuários cadastrados no sistema
                  </CardDescription>
                </div>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por nome ou email..."
                  className="w-72"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={profile.user_type === 'admin' ? 'default' : 'secondary'}>
                          {profile.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.sites && profile.sites.length > 0 
                          ? profile.sites.map(site => site.domain).join(', ')
                          : (profile.client?.website_url || '-')
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(profile);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {profile.user_type !== 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o usuário <strong>{profile.name}</strong>? 
                                  Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUser(profile.user_id, profile.email)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          // Layout para clientes visualizarem seu próprio perfil
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>Informações do seu perfil no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProfiles?.map((profile) => (
                <div key={profile.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <p className="text-sm text-muted-foreground">{profile.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <div>
                      <Label>Tipo de Usuário</Label>
                      <Badge variant="secondary">Cliente</Badge>
                    </div>
                    <div>
                      <Label>Data de Criação</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {profile.sites && profile.sites.length > 0 && (
                      <div>
                        <Label>Sites</Label>
                        <p className="text-sm text-muted-foreground">
                          {profile.sites.map(site => site.domain).join(', ')}
                        </p>
                      </div>
                    )}
                    {profile.client?.website_url && (
                      <div>
                        <Label>Site</Label>
                        <p className="text-sm text-muted-foreground">{profile.client.website_url}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <Label>WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">{profile.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(!profiles || profiles.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {isAdmin 
                ? (searchTerm ? 'Nenhum usuário encontrado com esse termo.' : 'Nenhum usuário encontrado.')
                : 'Erro ao carregar perfil do usuário.'
              }
            </p>
          </div>
        )}

        {/* Dialog de Edição de Usuário */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-user_type">Tipo de Usuário</Label>
                  <Select value={editingUser.user_type} onValueChange={(value: "admin" | "client") => setEditingUser({...editingUser, user_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-website_url">Site (opcional)</Label>
                  <Input
                    id="edit-website_url"
                    value={editingUser.client?.website_url || ""}
                    onChange={(e) => setEditingUser({
                      ...editingUser, 
                      client: {
                        ...editingUser.client,
                        id: editingUser.client?.id || '',
                        user_id: editingUser.user_id,
                        website_url: e.target.value
                      }
                    })}
                    placeholder="www.exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="edit-whatsapp"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({
                      ...editingUser, 
                      phone: e.target.value
                    })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <Button onClick={updateUser} className="w-full">
                  Atualizar Usuário
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;

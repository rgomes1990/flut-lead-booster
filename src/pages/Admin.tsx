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
import { Plus, Edit, Trash2, Users, Eye, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";
import SearchInput from "@/components/SearchInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Profile, Client, Site, SiteConfig } from "@/types";

interface UserWithDetails extends Profile {
  client?: Client;
  sites?: Site[];
  siteConfigs?: SiteConfig[];
  whatsapp?: string;
  domain?: string;
}

const Admin = () => {
  const { userProfile, signOut } = useAuth();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(2, {
      message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.string().email({
      message: "Por favor, insira um email válido.",
    }),
    password: z.string().min(6, {
      message: "Senha deve ter pelo menos 6 caracteres.",
    }),
    user_type: z.enum(["admin", "client"]),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      user_type: "client",
    },
  })

  useEffect(() => {
    if (userProfile?.user_type === 'admin') {
      loadAllUsers();
    }
  }, [userProfile]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const loadAllUsers = async () => {
    try {
      // Buscar todos os perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });

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
        
        // Pegar o telefone das configurações do site ou do cliente
        const mainSiteConfig = siteConfigs[0];
        const whatsapp = mainSiteConfig?.phone || client?.whatsapp || '';
        
        // Usar website_domain do perfil, ou o primeiro domínio dos sites, ou website_url do cliente
        const domain = profile.website_domain || 
                      (sites.length > 0 ? sites[0].domain : '') || 
                      client?.website_url || '';
        
        return {
          ...profile,
          client,
          sites,
          siteConfigs,
          whatsapp,
          domain
        };
      });

      setUsers(usersWithDetails);
      console.log('All users loaded:', usersWithDetails);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Buscar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (clientError && clientError.code !== 'PGRST116') {
        console.error('Error fetching client:', clientError);
      }

      // Buscar sites do usuário
      const { data: sitesData, error: sitesError } = await supabase
        .from("sites")
        .select("*")
        .eq("user_id", userId);

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
      const whatsapp = mainSiteConfig?.phone || clientData?.whatsapp || '';
      const domain = profileData.website_domain || 
                    (sitesData && sitesData.length > 0 ? sitesData[0].domain : '') || 
                    clientData?.website_url || '';

      const userWithDetails: UserWithDetails = {
        ...profileData,
        client: clientData || undefined,
        sites: sitesData || [],
        siteConfigs: siteConfigsData,
        whatsapp,
        domain
      };

      console.log('Client profile loaded:', userWithDetails);
      return userWithDetails;
    } catch (error) {
      console.error("Error loading user details:", error);
      throw error;
    }
  };

  const createUser = async (values: z.infer<typeof formSchema>) => {
    try {
      const { email, password, name, user_type } = values;

      // Chamar a função Supabase
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          name,
          user_type,
        }
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast({
          title: "Erro ao criar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: data.message,
      });

      form.reset();
      setCreateDialogOpen(false);
      loadAllUsers();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUser = async () => {
    try {
      if (!editingUser) return;

      console.log('Updating user:', editingUser);

      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: editingUser.name,
          user_type: editingUser.user_type,
          website_domain: editingUser.domain || null
        })
        .eq("user_id", editingUser.user_id);

      if (profileError) throw profileError;

      // Se for cliente, atualizar dados do cliente
      if (editingUser.user_type === 'client') {
        const clientData = {
          website_url: editingUser.client?.website_url || editingUser.domain || '',
          whatsapp: editingUser.whatsapp || ''
        };

        // Verificar se cliente já existe
        const { data: existingClient, error: checkError } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", editingUser.user_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingClient) {
          // Atualizar cliente existente
          const { error: clientError } = await supabase
            .from("clients")
            .update(clientData)
            .eq("user_id", editingUser.user_id);

          if (clientError) throw clientError;
        } else {
          // Criar novo cliente
          const { error: clientError } = await supabase
            .from("clients")
            .insert({
              user_id: editingUser.user_id,
              ...clientData,
              script_id: '' // Será gerado pelo trigger
            });

          if (clientError) throw clientError;
        }

        // Atualizar configurações do site se existirem
        if (editingUser.siteConfigs && editingUser.siteConfigs.length > 0) {
          const siteConfig = editingUser.siteConfigs[0];
          const { error: configError } = await supabase
            .from("site_configs")
            .update({
              phone: editingUser.whatsapp || null
            })
            .eq("id", siteConfig.id);

          if (configError) {
            console.error('Error updating site config:', configError);
          }
        }
      }

      toast({
        title: "Usuário atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      loadAllUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { data, error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Usuário excluído com sucesso!",
      });

      loadAllUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const changePassword = async () => {
    if (!editingUser) return;

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Chamar a função Supabase para atualizar a senha
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: {
          user_id: editingUser.user_id,
          password: newPassword
        }
      });

      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast({
          title: "Erro ao alterar senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha alterada com sucesso!",
        description: data.message,
      });

      setChangePasswordDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openUserDetails = async (profile: UserWithDetails) => {
    try {
      const userDetails = await loadUserDetails(profile.user_id);
      setSelectedUser(userDetails);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        title: "Erro ao carregar detalhes do usuário",
        description: "Não foi possível carregar as informações completas do usuário",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (profile: UserWithDetails) => {
    try {
      const userDetails = await loadUserDetails(profile.user_id);
      setEditingUser(userDetails);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Error loading user details for edit:", error);
      toast({
        title: "Erro ao carregar detalhes do usuário",
        description: "Não foi possível carregar as informações para edição",
        variant: "destructive",
      });
    }
  };

  if (!userProfile || userProfile.user_type !== 'admin') {
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
              <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Administrar usuários e seus respectivos acessos</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para criar um novo usuário
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(createUser)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seuemail@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="user_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Usuário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg">
                              <SelectItem value="client">Cliente</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Criar Usuário
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários Cadastrados
                  </CardTitle>
                  <CardDescription>
                    Lista de todos os usuários do sistema
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
                    <TableHead>Site</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((profile) => (
                    <TableRow key={profile.user_id}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={profile.user_type === 'admin' ? 'default' : 'secondary'}>
                          {profile.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.domain || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.whatsapp || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUserDetails(profile)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(profile.user_id)}
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

          {/* User Details Dialog */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Usuário</DialogTitle>
                <DialogDescription>
                  Informações completas do usuário selecionado
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label>Tipo de Usuário</Label>
                      <Badge variant={selectedUser.user_type === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </div>
                    <div>
                      <Label>Data de Criação</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedUser.domain && (
                      <div>
                        <Label>Site</Label>
                        <p className="text-sm text-muted-foreground">{selectedUser.domain}</p>
                      </div>
                    )}
                    {selectedUser.whatsapp && (
                      <div>
                        <Label>WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">{selectedUser.whatsapp}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Create User Dialog */}
          

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>
                  Edite as informações do usuário selecionado
                </DialogDescription>
              </DialogHeader>
              {editingUser && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input
                      id="edit-name"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-user-type">Tipo de Usuário</Label>
                    <Select
                      value={editingUser.user_type}
                      onValueChange={(value: 'admin' | 'client') => 
                        setEditingUser({ ...editingUser, user_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg">
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-site">Site (opcional)</Label>
                    <Input
                      id="edit-site"
                      value={editingUser.domain || ""}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        domain: e.target.value
                      })}
                      placeholder="exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-whatsapp">WhatsApp (opcional)</Label>
                    <Input
                      id="edit-whatsapp"
                      value={editingUser.whatsapp || ""}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        whatsapp: e.target.value
                      })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <Button onClick={updateUser} className="w-full">
                    Atualizar Usuário
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setChangePasswordDialogOpen(true);
                      setEditDialogOpen(false);
                    }}
                    className="w-full"
                  >
                    Alterar Senha
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Digite a nova senha para o usuário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                  />
                </div>
                <Button onClick={changePassword} className="w-full">
                  Alterar Senha
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Admin;

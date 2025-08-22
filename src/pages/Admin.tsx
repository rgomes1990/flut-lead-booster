
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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";
import SearchInput from "@/components/SearchInput";

const Admin = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    user_type: "client",
    website_url: "",
    whatsapp: ""
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Determinar se é modo "Meu Perfil" (cliente) ou "Gerenciar Usuários" (admin)
  const isClientMode = userProfile?.user_type === 'client';

  useEffect(() => {
    if (userProfile) {
      if (isClientMode) {
        // Carregar apenas o próprio perfil do cliente
        loadOwnProfile();
      } else if (userProfile.user_type === 'admin') {
        // Carregar todos os usuários para admin
        loadUsers();
      }
    }
  }, [userProfile, isClientMode]);

  useEffect(() => {
    // Filtrar usuários baseado no termo de busca (apenas para admin)
    if (!isClientMode) {
      if (searchTerm.trim() === "") {
        setFilteredUsers(users);
      } else {
        const filtered = users.filter(user => 
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    }
  }, [users, searchTerm, isClientMode]);

  const loadOwnProfile = async () => {
    try {
      // Carregar perfil do próprio cliente
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userProfile.user_id)
        .single();

      if (profileError) throw profileError;

      // Carregar dados do cliente para obter website_url e WhatsApp
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userProfile.user_id)
        .single();

      if (clientError) throw clientError;

      // Combinar dados
      const userWithClientData = {
        ...profile,
        website_url: clientData?.website_url || '',
        whatsapp: clientData?.whatsapp || ''
      };

      setUsers([userWithClientData]);
      setFilteredUsers([userWithClientData]);
    } catch (error) {
      console.error("Error loading own profile:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Carregar dados de clientes para obter website_url e WhatsApp
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Combinar dados
      const usersWithClientData = profiles?.map(profile => {
        const clientData = clients?.find(c => c.user_id === profile.user_id);
        return {
          ...profile,
          website_url: clientData?.website_url || '',
          whatsapp: clientData?.whatsapp || ''
        };
      }) || [];

      setUsers(usersWithClientData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const createUser = async () => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast({
          title: "Erro",
          description: "Nome, email e senha são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXNubmlwZGpxbXhwZ2Z2aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjQ2NzcsImV4cCI6MjA3MDcwMDY3N30.xMOfCDIniXTn5TnlOdcUiQycp-5yPetalylgzm2_VeQ`,
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: result.message,
      });

      setNewUser({ 
        name: "", 
        email: "", 
        password: "", 
        user_type: "client",
        website_url: "",
        whatsapp: ""
      });
      setDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      if (!editingUser.name || !editingUser.email) {
        toast({
          title: "Erro",
          description: "Nome e email são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Se há uma nova senha, fazer update via edge function
      if (editingUser.newPassword && editingUser.newPassword.trim()) {
        const response = await fetch(`https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/update-user-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXNubmlwZGpxbXhwZ2Z2aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjQ2NzcsImV4cCI6MjA3MDcwMDY3N30.xMOfCDIniXTn5TnlOdcUiQycp-5yPetalylgzm2_VeQ`,
          },
          body: JSON.stringify({
            user_id: editingUser.user_id,
            password: editingUser.newPassword
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar senha');
        }
      }

      // Atualizar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: editingUser.name,
          email: editingUser.email,
          user_type: editingUser.user_type
        })
        .eq("user_id", editingUser.user_id);

      if (profileError) throw profileError;

      // Se for cliente, atualizar dados do cliente
      if (editingUser.user_type === 'client') {
        // Verificar se já existe um registro de cliente
        const { data: existingClient } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", editingUser.user_id)
          .single();

        if (existingClient) {
          // Atualizar registro existente
          const { error: clientError } = await supabase
            .from("clients")
            .update({
              website_url: editingUser.website_url || '',
              whatsapp: editingUser.whatsapp || ''
            })
            .eq("user_id", editingUser.user_id);

          if (clientError) throw clientError;
        } else {
          // Criar novo registro de cliente
          const { error: clientError } = await supabase
            .from("clients")
            .insert({
              user_id: editingUser.user_id,
              website_url: editingUser.website_url || '',
              whatsapp: editingUser.whatsapp || '',
              script_id: '' // Será preenchido pelo trigger
            });

          if (clientError) throw clientError;
        }
      }

      toast({
        title: "Usuário atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      
      // Recarregar dados baseado no modo
      if (isClientMode) {
        loadOwnProfile();
      } else {
        loadUsers();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const response = await fetch(`https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXNubmlwZGpxbXhwZ2Z2aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjQ2NzcsImV4cCI6MjA3MDcwMDY3N30.xMOfCDIniXTn5TnlOdcUiQycp-5yPetalylgzm2_VeQ`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      toast({
        title: "Usuário excluído com sucesso!",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Carregando...</p>
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
              <h1 className="text-3xl font-bold">
                {isClientMode ? "Meu Perfil" : "Gerenciar Usuários"}
              </h1>
              <p className="text-muted-foreground">
                {isClientMode 
                  ? "Gerencie suas informações pessoais" 
                  : "Administrar contas de usuários do sistema"
                }
              </p>
            </div>
            
            {!isClientMode && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                      Adicione um novo usuário ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Senha (mínimo 6 caracteres)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_type">Tipo de Usuário</Label>
                      <Select 
                        value={newUser.user_type} 
                        onValueChange={(value) => setNewUser({ ...newUser, user_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.user_type === 'client' && (
                      <>
                        <div>
                          <Label htmlFor="website_url">Site (opcional)</Label>
                          <Input
                            id="website_url"
                            value={newUser.website_url}
                            onChange={(e) => setNewUser({ ...newUser, website_url: e.target.value })}
                            placeholder="exemplo.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                          <Input
                            id="whatsapp"
                            value={newUser.whatsapp}
                            onChange={(e) => setNewUser({ ...newUser, whatsapp: e.target.value })}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </>
                    )}
                    <Button 
                      onClick={createUser} 
                      className="w-full"
                      disabled={isCreating}
                    >
                      {isCreating ? "Criando..." : "Criar Usuário"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {isClientMode ? "Meus Dados" : "Usuários Cadastrados"}
                  </CardTitle>
                  <CardDescription>
                    {isClientMode 
                      ? "Suas informações pessoais e de contato"
                      : "Lista de todos os usuários do sistema"
                    }
                  </CardDescription>
                </div>
                {!isClientMode && (
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nome ou email..."
                    className="w-72"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    {!isClientMode && <TableHead>Tipo</TableHead>}
                    <TableHead>Site</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      {!isClientMode && (
                        <TableCell>
                          <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                            {user.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>{user.website_url || '-'}</TableCell>
                      <TableCell>{user.whatsapp || '-'}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log("Setting editing user with whatsapp:", user.whatsapp);
                            setEditingUser({
                              ...user,
                              whatsapp: user.whatsapp || '',
                              newPassword: '' // Campo para nova senha
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isClientMode && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                <DialogTitle>
                  {isClientMode ? "Editar Meu Perfil" : "Editar Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {isClientMode 
                    ? "Edite suas informações pessoais"
                    : "Edite as informações do usuário selecionado"
                  }
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
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-new-password">Nova Senha (opcional)</Label>
                    <Input
                      id="edit-new-password"
                      type="password"
                      value={editingUser.newPassword || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                      placeholder="Deixe em branco para manter a senha atual"
                    />
                  </div>
                  {!isClientMode && (
                    <div>
                      <Label htmlFor="edit-user_type">Tipo de Usuário</Label>
                      <Select 
                        value={editingUser.user_type} 
                        onValueChange={(value) => setEditingUser({ ...editingUser, user_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {editingUser.user_type === 'client' && (
                    <>
                      <div>
                        <Label htmlFor="edit-website_url">Site</Label>
                        <Input
                          id="edit-website_url"
                          value={editingUser.website_url || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, website_url: e.target.value })}
                          placeholder="exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-whatsapp">WhatsApp do Usuário</Label>
                        <Input
                          id="edit-whatsapp"
                          value={editingUser.whatsapp || ''}
                          onChange={(e) => {
                            console.log("Updating whatsapp field:", e.target.value);
                            setEditingUser({ ...editingUser, whatsapp: e.target.value });
                          }}
                          placeholder="(11) 99999-9999"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Este é o WhatsApp do usuário. Cada site pode ter seu próprio WhatsApp nas configurações.
                        </p>
                      </div>
                    </>
                  )}
                  <Button 
                    onClick={updateUser} 
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Atualizando..." : `${isClientMode ? "Atualizar Perfil" : "Atualizar Usuário"}`}
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

export default Admin;

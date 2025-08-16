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
import { Plus, Edit, Trash2, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Admin = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [newClient, setNewClient] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "", 
    company_name: "", 
    website_url: "", 
    user_type: "client" as "admin" | "client" 
  });
  const [editingClient, setEditingClient] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === 'admin') {
      loadUsers();
    }
  }, [userProfile]);

  const loadUsers = async () => {
    // Carregar todos os perfis de usuários
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Carregar dados de clientes para usuários do tipo 'client'
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*");
    
    // Combinar dados
    const usersWithClientData = profiles?.map(profile => {
      const clientData = clientsData?.find(client => client.user_id === profile.user_id);
      return {
        ...profile,
        client_data: clientData,
        // Para compatibilidade com o código existente
        id: clientData?.id || profile.id,
        company_name: clientData?.company_name || 'N/A',
        website_url: clientData?.website_url || '',
        script_id: clientData?.script_id || 'N/A',
        is_active: clientData?.is_active ?? true,
        created_at: profile.created_at,
        user_id: profile.user_id,
        profiles: { name: profile.name, email: profile.email }
      };
    }) || [];
    
    setUsers(usersWithClientData);
  };

  const createClient = async () => {
    try {
      // Validar senha
      if (newClient.password !== newClient.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }

      if (newClient.password.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }

      // Criar usuário no auth usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newClient.email,
        password: newClient.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: newClient.name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Atualizar perfil do usuário com o tipo selecionado
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ user_type: newClient.user_type })
        .eq("user_id", authData.user.id);

      if (profileError) throw profileError;

      // Se for cliente, criar registro na tabela clients
      if (newClient.user_type === "client") {
        const { error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: authData.user.id,
            company_name: newClient.company_name,
            website_url: newClient.website_url,
            script_id: '' // Será sobrescrito pelo trigger
          });

        if (clientError) throw clientError;
      }

      toast({
        title: `${newClient.user_type === 'admin' ? 'Administrador' : 'Cliente'} criado com sucesso!`,
      });

      setNewClient({ 
        name: "", 
        email: "", 
        password: "", 
        confirmPassword: "", 
        company_name: "", 
        website_url: "", 
        user_type: "client" 
      });
      setDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateClient = async () => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          company_name: editingClient.company_name,
          website_url: editingClient.website_url,
          is_active: editingClient.is_active
        })
        .eq("id", editingClient.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingClient(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (clientId: string, userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      // Deletar cliente (cascata deletará leads)
      const { error: clientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (clientError) throw clientError;

      // Nota: A deleção do usuário do auth deve ser feita via RPC ou edge function
      // Por enquanto, apenas removemos o cliente da tabela clients
      toast({
        title: "Cliente excluído com sucesso!",
        description: "Os dados do cliente foram removidos. Para remover completamente do sistema de autenticação, isso deve ser feito via painel Supabase.",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerenciar usuários e clientes do sistema FLUT</p>
            </div>
          
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
                  Preencha os dados para criar um novo usuário do sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newClient.password}
                    onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newClient.confirmPassword}
                    onChange={(e) => setNewClient({ ...newClient, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="userType">Tipo de Usuário</Label>
                  <Select 
                    value={newClient.user_type} 
                    onValueChange={(value: "admin" | "client") => setNewClient({ ...newClient, user_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newClient.user_type === "client" && (
                  <>
                    <div>
                      <Label htmlFor="company">Nome da Empresa</Label>
                      <Input
                        id="company"
                        value={newClient.company_name}
                        onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Site (opcional)</Label>
                      <Input
                        id="website"
                        value={newClient.website_url}
                        onChange={(e) => setNewClient({ ...newClient, website_url: e.target.value })}
                        placeholder="https://exemplo.com"
                      />
                    </div>
                  </>
                )}
                <Button onClick={createClient} className="w-full">
                  Criar {newClient.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema (Administradores e Clientes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Script ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.profiles?.name}</TableCell>
                    <TableCell>{user.profiles?.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                        {user.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.company_name}</TableCell>
                    <TableCell className="font-mono">{user.script_id}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {user.user_type === 'client' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingClient(user);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteClient(user.id, user.user_id)}
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
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Edite as informações do cliente selecionado
              </DialogDescription>
            </DialogHeader>
            {editingClient && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-company">Nome da Empresa</Label>
                  <Input
                    id="edit-company"
                    value={editingClient.company_name}
                    onChange={(e) => setEditingClient({ ...editingClient, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-website">Site</Label>
                  <Input
                    id="edit-website"
                    value={editingClient.website_url || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, website_url: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editingClient.is_active}
                    onChange={(e) => setEditingClient({ ...editingClient, is_active: e.target.checked })}
                  />
                  <Label htmlFor="edit-active">Cliente Ativo</Label>
                </div>
                <Button onClick={updateClient} className="w-full">Atualizar Cliente</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
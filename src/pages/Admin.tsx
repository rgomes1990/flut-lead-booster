import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { userProfile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", company_name: "", website_url: "" });
  const [editingClient, setEditingClient] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === 'admin') {
      loadClients();
    }
  }, [userProfile]);

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select(`
        *,
        profiles(name, email)
      `)
      .order("created_at", { ascending: false });
    
    setClients(data || []);
  };

  const createClient = async () => {
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newClient.email,
        password: newClient.password,
        user_metadata: { name: newClient.name },
        email_confirm: true
      });

      if (authError) throw authError;

      // Criar registro do cliente (script_id será gerado automaticamente pelo trigger)
      const { error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: authData.user.id,
          company_name: newClient.company_name,
          website_url: newClient.website_url,
          script_id: '' // Será sobrescrito pelo trigger
        });

      if (clientError) throw clientError;

      toast({
        title: "Cliente criado com sucesso!",
      });

      setNewClient({ name: "", email: "", password: "", company_name: "", website_url: "" });
      setDialogOpen(false);
      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro ao criar cliente",
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
      loadClients();
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

      // Deletar usuário do auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast({
        title: "Cliente excluído com sucesso!",
      });

      loadClients();
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
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground">Gerenciar clientes do FLUT</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
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
                  />
                </div>
                <div>
                  <Label htmlFor="company">Nome da Empresa</Label>
                  <Input
                    id="company"
                    value={newClient.company_name}
                    onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Site (opcional)</Label>
                  <Input
                    id="website"
                    value={newClient.website_url}
                    onChange={(e) => setNewClient({ ...newClient, website_url: e.target.value })}
                  />
                </div>
                <Button onClick={createClient} className="w-full">Criar Cliente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Clientes Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os clientes do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Script ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.profiles?.name}</TableCell>
                    <TableCell>{client.profiles?.email}</TableCell>
                    <TableCell>{client.company_name}</TableCell>
                    <TableCell className="font-mono">{client.script_id}</TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingClient(client);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteClient(client.id, client.user_id)}
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
              <DialogTitle>Editar Cliente</DialogTitle>
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
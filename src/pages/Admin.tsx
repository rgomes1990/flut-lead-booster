
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, Search, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'client';
  created_at: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Se for cliente, mostrar apenas seu próprio perfil
  const isAdmin = userProfile?.user_type === 'admin';

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      if (isAdmin) {
        // Admin vê todos os perfis
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Profile[];
      } else {
        // Cliente vê apenas seu próprio perfil
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userProfile?.user_id)
          .single();

        if (error) throw error;
        return [data] as Profile[];
      }
    },
    enabled: !!userProfile
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

        {isAdmin && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredProfiles?.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  <CardDescription>{profile.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.user_type === 'admin' ? 'default' : 'secondary'}>
                    {profile.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                  </Badge>
                  {isAdmin && profile.user_type !== 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
                            onClick={() => deleteUser(profile.id, profile.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Criado em: {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum usuário encontrado com esse termo.' : 'Nenhum usuário encontrado.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

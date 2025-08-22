import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminNavigation from "@/components/AdminNavigation";
import SearchInput from "@/components/SearchInput";

const Plans = () => {
  const { userProfile } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({
    client_id: "",
    plan_type: "free_7_days" as "free_7_days" | "one_month" | "three_months" | "six_months" | "one_year"
  });
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      loadPlans();
      if (userProfile.user_type === 'admin') {
        loadClients();
      }
    }
  }, [userProfile]);

  useEffect(() => {
    // Filtrar planos baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredPlans(subscriptionPlans);
    } else {
      const filtered = subscriptionPlans.filter(plan => 
        plan.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.plan_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.is_active ? 'ativo' : 'inativo').includes(searchTerm.toLowerCase())
      );
      setFilteredPlans(filtered);
    }
  }, [subscriptionPlans, searchTerm]);

  const loadPlans = async () => {
    try {
      // Query baseado no tipo de usuário
      let plansQuery = supabase
        .from("subscription_plans")
        .select("*");

      // Se for cliente, filtrar apenas seus planos
      if (userProfile?.user_type === 'client') {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userProfile.user_id)
          .single();
        
        if (clientData) {
          plansQuery = plansQuery.eq('client_id', clientData.id);
        }
      }

      const { data: plansData, error: plansError } = await plansQuery
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      // Carregar dados dos clientes separadamente
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, user_id");

      if (clientsError) throw clientsError;

      // Carregar dados dos profiles separadamente
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email");

      if (profilesError) throw profilesError;

      // Combinar dados manualmente
      const plansWithClients = plansData?.map(plan => {
        const client = clientsData?.find(c => c.id === plan.client_id);
        const profile = profilesData?.find(p => p.user_id === client?.user_id);
        return {
          ...plan,
          client_name: profile?.name || 'N/A',
          client_email: profile?.email || 'N/A'
        };
      }) || [];

      setSubscriptionPlans(plansWithClients);
    } catch (error) {
      console.error("Error loading subscription plans:", error);
    }
  };

  const loadClients = async () => {
    try {
      // Carregar clientes separadamente
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, user_id");

      if (clientsError) throw clientsError;

      // Carregar profiles separadamente
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .order("name");

      if (profilesError) throw profilesError;

      // Combinar dados manualmente
      const transformedClients = clientsData?.map((client: any) => {
        const profile = profilesData?.find(p => p.user_id === client.user_id);
        return {
          id: client.id,
          user_id: client.user_id,
          name: profile?.name || 'N/A',
          email: profile?.email || 'N/A'
        };
      }) || [];

      setClients(transformedClients);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const createPlan = async () => {
    try {
      if (!newPlan.client_id || !newPlan.plan_type) {
        toast({
          title: "Erro",
          description: "Cliente e tipo de plano são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      // Calcular data de fim baseado no tipo de plano
      const { data, error } = await supabase.rpc('calculate_plan_end_date', {
        plan_type: newPlan.plan_type,
        start_date: new Date().toISOString()
      });

      if (error) throw error;

      const { error: insertError } = await supabase
        .from("subscription_plans")
        .insert({
          client_id: newPlan.client_id,
          plan_type: newPlan.plan_type,
          start_date: new Date().toISOString(),
          end_date: data,
          is_active: true
        });

      if (insertError) throw insertError;

      toast({
        title: "Plano criado com sucesso!",
      });

      setNewPlan({ client_id: "", plan_type: "free_7_days" });
      setDialogOpen(false);
      loadPlans();
    } catch (error: any) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePlan = async () => {
    try {
      if (!editingPlan.client_id || !editingPlan.plan_type) {
        toast({
          title: "Erro",
          description: "Cliente e tipo de plano são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("subscription_plans")
        .update({
          client_id: editingPlan.client_id,
          plan_type: editingPlan.plan_type,
          is_active: editingPlan.is_active
        })
        .eq("id", editingPlan.id);

      if (error) throw error;

      toast({
        title: "Plano atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Plano excluído com sucesso!",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPlanType = (planType: string) => {
    const planTypes: { [key: string]: string } = {
      'free_7_days': 'Grátis 7 dias',
      'one_month': '1 Mês',
      'three_months': '3 Meses',
      'six_months': '6 Meses',
      'one_year': '1 Ano'
    };
    return planTypes[planType] || planType;
  };

  const isPlanActive = (endDate: string) => {
    return new Date(endDate) > new Date();
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
              <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
              <p className="text-muted-foreground">Administrar planos de assinatura dos clientes</p>
            </div>
            
            {userProfile?.user_type === 'admin' && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Plano</DialogTitle>
                    <DialogDescription>
                      Adicione um novo plano de assinatura para um cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="client">Cliente</Label>
                      <Select 
                        value={newPlan.client_id} 
                        onValueChange={(value) => setNewPlan({ ...newPlan, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="planType">Tipo de Plano</Label>
                      <Select 
                        value={newPlan.plan_type} 
                        onValueChange={(value: any) => setNewPlan({ ...newPlan, plan_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectItem value="free_7_days">Grátis 7 dias</SelectItem>
                          <SelectItem value="one_month">1 Mês</SelectItem>
                          <SelectItem value="three_months">3 Meses</SelectItem>
                          <SelectItem value="six_months">6 Meses</SelectItem>
                          <SelectItem value="one_year">1 Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createPlan} className="w-full">
                      Criar Plano
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
                    <Calendar className="h-5 w-5" />
                    Planos de Assinatura
                  </CardTitle>
                  <CardDescription>
                    Lista dos planos de assinatura ativos e histórico
                  </CardDescription>
                </div>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por cliente, email, plano ou status..."
                  className="w-72"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo de Plano</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ativo</TableHead>
                    {userProfile?.user_type === 'admin' && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.client_name}</TableCell>
                      <TableCell>{plan.client_email}</TableCell>
                      <TableCell>{formatPlanType(plan.plan_type)}</TableCell>
                      <TableCell>
                        {new Date(plan.start_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {new Date(plan.end_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isPlanActive(plan.end_date) ? 'default' : 'secondary'}>
                          <Clock className="h-3 w-3 mr-1" />
                          {isPlanActive(plan.end_date) ? 'Vigente' : 'Expirado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {userProfile?.user_type === 'admin' && (
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPlan(plan);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          {userProfile?.user_type === 'admin' && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Plano</DialogTitle>
                  <DialogDescription>
                    Edite as informações do plano selecionado
                  </DialogDescription>
                </DialogHeader>
                {editingPlan && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-client">Cliente</Label>
                      <Select 
                        value={editingPlan.client_id} 
                        onValueChange={(value) => setEditingPlan({ ...editingPlan, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-planType">Tipo de Plano</Label>
                      <Select 
                        value={editingPlan.plan_type} 
                        onValueChange={(value: any) => setEditingPlan({ ...editingPlan, plan_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectItem value="free_7_days">Grátis 7 dias</SelectItem>
                          <SelectItem value="one_month">1 Mês</SelectItem>
                          <SelectItem value="three_months">3 Meses</SelectItem>
                          <SelectItem value="six_months">6 Meses</SelectItem>
                          <SelectItem value="one_year">1 Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-plan-active"
                        checked={editingPlan.is_active}
                        onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                      />
                      <Label htmlFor="edit-plan-active">Plano Ativo</Label>
                    </div>
                    <Button onClick={updatePlan} className="w-full">
                      Atualizar Plano
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default Plans;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AdminNavigation from "@/components/AdminNavigation";
import EditPlanDialog from "@/components/EditPlanDialog";

interface SubscriptionPlan {
  id: string;
  client_id: string;
  plan_type: "free_7_days" | "one_month" | "three_months" | "six_months" | "one_year";
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  clients: {
    id: string;
    user_id: string;
    website_url: string;
    script_id: string;
    profiles: {
      name: string;
      email: string;
    };
  };
}

const Plans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [planToEdit, setPlanToEdit] = useState<SubscriptionPlan | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === "admin") {
      loadPlans();
    }
  }, [userProfile]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = plans;

    // Filtro de busca por cliente
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.clients?.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.clients?.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.clients?.website_url?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo de plano
    if (planTypeFilter !== "all") {
      filtered = filtered.filter(plan => plan.plan_type === planTypeFilter);
    }

    // Filtro por status
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(plan => {
          const now = new Date();
          const end = new Date(plan.end_date);
          return plan.is_active && end >= now;
        });
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(plan => {
          const now = new Date();
          const end = new Date(plan.end_date);
          return !plan.is_active || end < now;
        });
      }
    }

    setFilteredPlans(filtered);
  }, [plans, searchTerm, planTypeFilter, statusFilter]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      const { data: plansData, error } = await supabase
        .from("subscription_plans")
        .select(`
          *,
          clients (
            id,
            user_id,
            website_url,
            script_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar os perfis dos usuários separadamente
      if (plansData && plansData.length > 0) {
        const userIds = plansData
          .map(plan => plan.clients?.user_id)
          .filter(Boolean);

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combinar os dados
        const transformedPlans = plansData.map(plan => ({
          ...plan,
          clients: {
            ...plan.clients,
            profiles: profilesData?.find(p => p.user_id === plan.clients?.user_id) || {
              name: 'N/A',
              email: 'N/A'
            }
          }
        })) as SubscriptionPlan[];

        setPlans(transformedPlans);
      } else {
        setPlans([]);
      }
      
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos de assinatura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case "free_7_days":
        return "Grátis 7 dias";
      case "one_month":
        return "1 Mês";
      case "three_months":
        return "3 Meses";
      case "six_months":
        return "6 Meses";
      case "one_year":
        return "1 Ano";
      default:
        return planType;
    }
  };

  const getStatusBadgeVariant = (isActive: boolean, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    
    if (!isActive) return "secondary";
    if (end < now) return "destructive";
    return "default";
  };

  const getStatusLabel = (isActive: boolean, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    
    if (!isActive) return "Inativo";
    if (end < now) return "Expirado";
    return "Ativo";
  };

  const handleEditClick = (plan: SubscriptionPlan) => {
    setPlanToEdit(plan);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setPlanToEdit(null);
  };

  const handlePlanUpdated = () => {
    loadPlans();
  };

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planToDelete.id);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== planToDelete.id));
      
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  if (!userProfile || userProfile.user_type !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
              <p className="text-muted-foreground mt-2">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">📊 Gerenciar Planos</CardTitle>
                <CardDescription className="text-base mt-2">
                  Visualize e gerencie todos os planos de assinatura dos clientes
                </CardDescription>
                {/* Contador de resultados */}
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">
                    {filteredPlans.length} {filteredPlans.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                  </span>
                  {(searchTerm || planTypeFilter !== "all" || statusFilter !== "all") && (
                    <span className="ml-2 text-xs bg-primary/10 px-2 py-1 rounded">
                      Filtros aplicados
                    </span>
                  )}
                </div>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filtros */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="free_7_days">Grátis 7 dias</SelectItem>
                  <SelectItem value="one_month">1 Mês</SelectItem>
                  <SelectItem value="three_months">3 Meses</SelectItem>
                  <SelectItem value="six_months">6 Meses</SelectItem>
                  <SelectItem value="one_year">1 Ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando planos...</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <span className="font-medium">
                            {plan.clients?.profiles?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {plan.clients?.profiles?.email || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {plan.clients?.website_url || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {getPlanTypeLabel(plan.plan_type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(plan.start_date)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(plan.end_date)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(plan.is_active, plan.end_date)}>
                            {getStatusLabel(plan.is_active, plan.end_date)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(plan)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(plan)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredPlans.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {plans.length === 0 ? "Nenhum plano encontrado." : "Nenhum plano corresponde aos filtros aplicados."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de edição de plano */}
        <EditPlanDialog
          plan={planToEdit}
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          onPlanUpdated={handlePlanUpdated}
        />

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o plano de <strong>{planToDelete?.clients?.profiles?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Plans;

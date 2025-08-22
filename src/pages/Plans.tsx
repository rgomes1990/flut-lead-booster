import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus } from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";

type PlanType = 'free_7_days' | 'one_month' | 'three_months' | 'six_months' | 'one_year';

interface SubscriptionPlan {
  id: string;
  client_id: string;
  plan_type: PlanType;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    profiles?: {
      name: string;
      email: string;
    } | null;
  } | null;
}

interface EditForm {
  id: string;
  client_id: string;
  plan_type: PlanType;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const Plans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPlan, setNewPlan] = useState({
    client_id: '',
    plan_type: 'free_7_days' as PlanType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [editForm, setEditForm] = useState<EditForm>({
    id: '',
    client_id: '',
    plan_type: 'free_7_days' as PlanType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          clients (
            profiles (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to our SubscriptionPlan type with proper type handling
      const validPlans: SubscriptionPlan[] = (data || [])
        .filter((plan: any) => plan && typeof plan.id === 'string')
        .map((plan: any) => ({
          id: plan.id,
          client_id: plan.client_id,
          plan_type: plan.plan_type as PlanType,
          start_date: plan.start_date,
          end_date: plan.end_date,
          is_active: plan.is_active,
          status: plan.status,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          clients: plan.clients
        }));
      
      setPlans(validPlans);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar planos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', newPlan.client_id)
        .single();

      if (clientError || !client) {
        toast({
          title: "Erro ao criar plano",
          description: "Cliente não encontrado.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('subscription_plans')
        .insert({
          client_id: newPlan.client_id,
          plan_type: newPlan.plan_type as PlanType,
          start_date: newPlan.start_date,
          end_date: newPlan.end_date,
        });

      if (error) throw error;

      toast({
        title: "Plano criado",
        description: "Novo plano criado com sucesso!",
      });

      setCreateDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditPlan = async () => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          plan_type: editForm.plan_type,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          is_active: editForm.is_active
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: "Plano atualizado",
        description: `Plano ${editForm.is_active ? 'ativado' : 'desativado'} com sucesso!`,
      });

      setEditDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case 'free_7_days':
        return 'Teste Grátis (7 dias)';
      case 'one_month':
        return '1 Mês';
      case 'three_months':
        return '3 Meses';
      case 'six_months':
        return '6 Meses';
      case 'one_year':
        return '1 Ano';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Planos</h1>
            <p className="text-gray-600 mt-2">Gerencie os planos de assinatura dos clientes</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Plano</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para criar um novo plano de assinatura
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-id">ID do Cliente</Label>
                  <Input
                    id="client-id"
                    value={newPlan.client_id}
                    onChange={(e) => setNewPlan({ ...newPlan, client_id: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="plan-type">Tipo do Plano</Label>
                  <Select value={newPlan.plan_type} onValueChange={(value) => setNewPlan({...newPlan, plan_type: value as PlanType})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_7_days">Teste Grátis (7 dias)</SelectItem>
                      <SelectItem value="one_month">1 Mês</SelectItem>
                      <SelectItem value="three_months">3 Meses</SelectItem>
                      <SelectItem value="six_months">6 Meses</SelectItem>
                      <SelectItem value="one_year">1 Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Data de Início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newPlan.start_date}
                    onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Data de Fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newPlan.end_date}
                    onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreatePlan} className="w-full">
                  Criar Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planos de Assinatura</CardTitle>
            <CardDescription>
              Lista de todos os planos de assinatura dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo do Plano</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.clients?.profiles?.name || 'N/A'}
                    </TableCell>
                    <TableCell>{plan.clients?.profiles?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={plan.plan_type === 'free_7_days' ? 'secondary' : 'default'}>
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(plan.start_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(plan.end_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active && new Date(plan.end_date) > new Date() ? 'default' : 'destructive'}>
                        {plan.is_active && new Date(plan.end_date) > new Date() ? 'Ativo' : 'Desativado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditForm({
                                id: plan.id,
                                client_id: plan.client_id,
                                plan_type: plan.plan_type,
                                start_date: new Date(plan.start_date).toISOString().split('T')[0],
                                end_date: new Date(plan.end_date).toISOString().split('T')[0],
                                is_active: plan.is_active
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Plano</DialogTitle>
                            <DialogDescription>
                              Edite as informações do plano de assinatura
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-plan-type">Tipo do Plano</Label>
                              <Select value={editForm.plan_type} onValueChange={(value) => setEditForm({...editForm, plan_type: value as PlanType})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free_7_days">Teste Grátis (7 dias)</SelectItem>
                                  <SelectItem value="one_month">1 Mês</SelectItem>
                                  <SelectItem value="three_months">3 Meses</SelectItem>
                                  <SelectItem value="six_months">6 Meses</SelectItem>
                                  <SelectItem value="one_year">1 Ano</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="edit-start-date">Data de Início</Label>
                              <Input
                                id="edit-start-date"
                                type="date"
                                value={editForm.start_date}
                                onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-end-date">Data de Fim</Label>
                              <Input
                                id="edit-end-date"
                                type="date"
                                value={editForm.end_date}
                                onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-is-active">Status do Plano</Label>
                              <Select 
                                value={editForm.is_active ? "true" : "false"} 
                                onValueChange={(value) => setEditForm({...editForm, is_active: value === "true"})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Ativo</SelectItem>
                                  <SelectItem value="false">Desativado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button onClick={handleEditPlan} className="w-full">
                              Atualizar Plano
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Plans;

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminNavigation from '@/components/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, AlertTriangle, Trash2, XCircle } from 'lucide-react';

interface Client {
  id: string;
  script_id: string;
  website_url?: string;
  is_active: boolean;
  user_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
  subscription_plans: {
    id: string;
    plan_type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
}

const PLAN_LABELS = {
  free_7_days: '7 Dias Grátis',
  one_month: '1 Mês',
  three_months: '3 Meses',
  six_months: '6 Meses',
  one_year: '1 Ano'
};

export default function Plans() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadClients();
    }
  }, [userProfile]);

  const loadClients = async () => {
    try {
      setLoading(true);

      let clientsQuery = supabase
        .from('clients')
        .select(`
          *,
          subscription_plans(id, plan_type, start_date, end_date, is_active)
        `);

      // Se for cliente, filtrar apenas seus próprios dados
      if (userProfile?.user_type === 'client') {
        clientsQuery = clientsQuery.eq('user_id', userProfile.user_id);
      }

      const { data, error } = await clientsQuery
        .order('created_at', { ascending: false });

      // Buscar profiles separadamente - apenas clientes
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .eq('user_type', 'client');

      // Combinar dados e filtrar apenas clientes - pegar o plano mais recente
      const clientsWithProfiles = data?.filter(client => {
        const profile = profilesData?.find(profile => profile.user_id === client.user_id);
        return profile !== undefined;
      }).map(client => ({
        ...client,
        profiles: profilesData?.find(profile => profile.user_id === client.user_id) || null,
        subscription_plans: Array.isArray(client.subscription_plans) && client.subscription_plans.length > 0 
          ? client.subscription_plans.sort((a: any, b: any) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime())[0]
          : null
      })) || [];

      if (error) throw error;
      setClients(clientsWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async () => {
    if (!selectedClient || !selectedPlan) return;

    try {
      setUpdateLoading(true);

      // Primeiro, desativar todos os planos existentes do cliente
      await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('client_id', selectedClient);

      // Criar novo plano
      const startDate = new Date().toISOString();
      const { data: endDateData, error: functionError } = await supabase
        .rpc('calculate_plan_end_date', {
          plan_type: selectedPlan as any,
          start_date: startDate
        });

      if (functionError) throw functionError;

      const { error: insertError } = await supabase
        .from('subscription_plans')
        .insert({
          client_id: selectedClient,
          plan_type: selectedPlan as any,
          start_date: startDate,
          end_date: endDateData,
          is_active: true
        });

      if (insertError) throw insertError;

      // Atualizar status do cliente baseado no plano
      await supabase
        .from('clients')
        .update({ is_active: true })
        .eq('id', selectedClient);

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso!",
      });

      setSelectedClient('');
      setSelectedPlan('');
      loadClients();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano.",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isPlanExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getActivePlan = (plan: Client['subscription_plans']) => {
    return plan;
  };

  const deactivatePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano desativado com sucesso!",
      });

      loadClients();
    } catch (error) {
      console.error('Erro ao desativar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao desativar plano.",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso!",
      });

      loadClients();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano.",
        variant: "destructive",
      });
    }
  };

  if (!userProfile || (userProfile.user_type !== 'admin' && userProfile.user_type !== 'client')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
            <p className="text-muted-foreground">
              Gerencie os planos de assinatura dos clientes
            </p>
          </div>

          {userProfile?.user_type === 'admin' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Atualizar Plano
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Plano de Cliente</DialogTitle>
                <DialogDescription>
                  Selecione o cliente e o novo plano. A renovação será feita a partir da data atual.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.profiles?.name || 'Cliente'} - {client.website_url || 'Site não identificado'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Plano</label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_7_days">7 Dias Grátis</SelectItem>
                      <SelectItem value="one_month">1 Mês</SelectItem>
                      <SelectItem value="three_months">3 Meses</SelectItem>
                      <SelectItem value="six_months">6 Meses</SelectItem>
                      <SelectItem value="one_year">1 Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={updatePlan} 
                  disabled={!selectedClient || !selectedPlan || updateLoading}
                  className="w-full"
                >
                  {updateLoading ? "Atualizando..." : "Atualizar Plano"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes e Planos
            </CardTitle>
            <CardDescription>
              Visualize todos os clientes e seus planos de assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando clientes...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Plano Atual</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const activePlan = getActivePlan(client.subscription_plans);
                    const isExpired = activePlan ? isPlanExpired(activePlan.end_date) : true;
                    const isManuallyDeactivated = activePlan ? !activePlan.is_active : false;
                    const isInactive = isExpired || isManuallyDeactivated;
                    
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.profiles?.name || 'Nome não encontrado'}
                        </TableCell>
                        <TableCell>{client.profiles?.email || 'Email não encontrado'}</TableCell>
                        <TableCell>{client.website_url || 'Site não identificado'}</TableCell>
                        <TableCell>
                          {activePlan ? PLAN_LABELS[activePlan.plan_type as keyof typeof PLAN_LABELS] : 'Sem plano'}
                        </TableCell>
                        <TableCell>
                          {activePlan ? formatDate(activePlan.start_date) : '-'}
                        </TableCell>
                        <TableCell>
                          {activePlan ? formatDate(activePlan.end_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isInactive ? "destructive" : "default"}>
                            {isManuallyDeactivated ? 'Inativo' : (isExpired ? 'Expirado' : 'Ativo')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activePlan && userProfile?.user_type === 'admin' && (
                            <div className="flex gap-2">
                              {activePlan.is_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deactivatePlan(activePlan.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deletePlan(activePlan.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {userProfile?.user_type === 'client' && <span className="text-muted-foreground text-sm">-</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
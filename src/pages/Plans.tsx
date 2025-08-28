
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, Plus } from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";
import EditPlanDialog from "@/components/EditPlanDialog";
import { useAuth } from "@/hooks/useAuth";

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
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const isAdmin = userProfile?.user_type === 'admin';

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ["subscription-plans", userProfile?.user_id],
    queryFn: async () => {
      console.log('Fetching plans for user:', userProfile?.user_id, 'isAdmin:', isAdmin);
      
      let query = supabase
        .from("subscription_plans")
        .select(`
          *,
          clients (
            id,
            user_id,
            website_url,
            script_id,
            profiles (
              name,
              email
            )
          )
        `);

      // Se não for admin, filtrar apenas os planos do cliente atual
      if (!isAdmin && userProfile?.user_id) {
        query = query.eq('clients.user_id', userProfile.user_id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching plans:', error);
        throw error;
      }

      console.log('Plans loaded:', data?.length);
      return data as SubscriptionPlan[];
    },
    enabled: !!userProfile?.user_id
  });

  const filteredPlans = plans?.filter(plan =>
    plan.clients?.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.clients?.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.plan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusColor = (isActive: boolean, endDate: string) => {
    if (!isActive) return "destructive";
    
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) return "warning";
    return "default";
  };

  const getStatusText = (isActive: boolean, endDate: string) => {
    if (!isActive) return "Inativo";
    
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return "Expirado";
    if (daysUntilExpiry <= 7) return `Expira em ${daysUntilExpiry} dias`;
    return "Ativo";
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
              {isAdmin ? 'Gerenciar Planos' : 'Meus Planos'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin 
                ? 'Visualize e gerencie todos os planos de assinatura'
                : 'Visualize informações dos seus planos ativos'
              }
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, email ou tipo de plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredPlans?.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {getPlanTypeLabel(plan.plan_type)}
                  </CardTitle>
                  {isAdmin && (
                    <CardDescription>
                      Cliente: {plan.clients?.profiles?.name} ({plan.clients?.profiles?.email})
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(plan.is_active, plan.end_date)}>
                    {getStatusText(plan.is_active, plan.end_date)}
                  </Badge>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Data de Início:</span>
                    <p className="text-muted-foreground">
                      {new Date(plan.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Data de Término:</span>
                    <p className="text-muted-foreground">
                      {new Date(plan.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {isAdmin && plan.clients?.website_url && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">Site:</span>
                      <p className="text-muted-foreground">{plan.clients.website_url}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!plans || plans.length === 0) && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {isAdmin ? 'Nenhum plano encontrado.' : 'Nenhum plano ativo encontrado.'}
            </div>
          </div>
        )}

        {filteredPlans?.length === 0 && plans && plans.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum plano encontrado com esse termo de busca.
            </p>
          </div>
        )}

        {isAdmin && (
          <EditPlanDialog
            plan={editingPlan}
            isOpen={!!editingPlan}
            onClose={() => setEditingPlan(null)}
            onPlanUpdated={() => {
              refetch();
              setEditingPlan(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Plans;

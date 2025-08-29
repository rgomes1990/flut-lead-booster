import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminNavigation } from "@/components/AdminNavigation";
import { DashboardStatsCards } from "@/components/DashboardStatsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Users, AlertTriangle, CheckCircle } from "lucide-react";

const Admin = () => {
  const { user } = useAuth();
  const [isFixingLeads, setIsFixingLeads] = useState(false);
  const [isCheckingOrphans, setIsCheckingOrphans] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        throw new Error(error.message);
      }
      return data.users;
    },
  });

  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const { data: sites, isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const fixLeadAssociations = useMutation({
    mutationFn: async () => {
      console.log("Executando correção de associações de leads...");
      const { data, error } = await supabase.rpc('fix_lead_client_associations');
      
      if (error) {
        console.error("Erro ao corrigir associações:", error);
        throw error;
      }
      
      return data[0];
    },
    onSuccess: (result) => {
      console.log("Resultado da correção:", result);
      toast.success(
        `Correção concluída! ${result.corrected_leads} leads corrigidos de ${result.total_leads} processados. ${result.orphaned_leads} leads órfãos encontrados.`,
        { duration: 8000 }
      );
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("Erro na correção:", error);
      toast.error("Erro ao corrigir associações de leads: " + error.message);
    },
    onSettled: () => {
      setIsFixingLeads(false);
    }
  });

  const checkOrphanedLeads = useMutation({
    mutationFn: async () => {
      console.log("Verificando leads órfãos...");
      const { data, error } = await supabase.rpc('report_orphaned_leads');
      
      if (error) {
        console.error("Erro ao verificar leads órfãos:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (orphanedLeads) => {
      console.log("Leads órfãos encontrados:", orphanedLeads);
      if (orphanedLeads.length === 0) {
        toast.success("Nenhum lead órfão encontrado!");
      } else {
        toast.warning(
          `${orphanedLeads.length} leads órfãos encontrados. Verifique o console para detalhes.`,
          { duration: 8000 }
        );
        console.table(orphanedLeads);
      }
    },
    onError: (error) => {
      console.error("Erro na verificação:", error);
      toast.error("Erro ao verificar leads órfãos: " + error.message);
    },
    onSettled: () => {
      setIsCheckingOrphans(false);
    }
  });

  const handleFixLeads = () => {
    setIsFixingLeads(true);
    fixLeadAssociations.mutate();
  };

  const handleCheckOrphans = () => {
    setIsCheckingOrphans(true);
    checkOrphanedLeads.mutate();
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-600">
            Gerencie usuários, leads e configurações do sistema
          </p>
        </div>

        <DashboardStatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Card de Correção de Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Correção de Associações de Leads
              </CardTitle>
              <CardDescription>
                Corrige a vinculação de leads aos clientes corretos baseado no domínio do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta função analisa todos os leads e corrige automaticamente a associação com o cliente correto, 
                usando o domínio do site como referência principal.
              </p>
              
              <Button 
                onClick={handleFixLeads}
                disabled={isFixingLeads}
                className="w-full"
                variant="default"
              >
                {isFixingLeads ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Corrigir Associações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card de Verificação de Leads Órfãos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Verificar Leads Órfãos
              </CardTitle>
              <CardDescription>
                Identifica leads que não estão associados a nenhum cliente válido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta função verifica quais leads não possuem associação válida com clientes 
                e sites cadastrados no sistema.
              </p>
              
              <Button 
                onClick={handleCheckOrphans}
                disabled={isCheckingOrphans}
                className="w-full"
                variant="outline"
              >
                {isCheckingOrphans ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Verificar Órfãos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Lista de Usuários
          </h2>
          {isLoadingUsers ? (
            <p>Carregando usuários...</p>
          ) : users ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhum usuário encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

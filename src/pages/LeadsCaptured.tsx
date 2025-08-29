
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LeadsFilters from "@/components/LeadsFilters";
import { updateLeadWithUTMData } from "@/utils/utmExtractor";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  website_url: string;
  status: string;
  created_at: string;
  campaign: string;
  ad_content: string;
  audience: string;
  origin: string;
  client: {
    user_id: string;
    website_url: string;
  };
  profile: {
    name: string;
    email: string;
  };
}

const LeadsCaptured = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user, userType } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadLeads();
  }, [user, navigate]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carregamento de leads...");
      
      const BATCH_SIZE = 1000;
      let allLeads: Lead[] = [];
      let batch = 0;
      let hasMore = true;

      while (hasMore) {
        const from = batch * BATCH_SIZE;
        const to = from + BATCH_SIZE - 1;
        
        console.log(`Carregando lote ${batch + 1} - leads ${from} a ${to}`);

        let query = supabase
          .from("leads")
          .select(`
            *,
            client:clients!inner(
              user_id,
              website_url
            )
          `)
          .range(from, to)
          .order("created_at", { ascending: false });

        if (userType !== 'admin') {
          query = query.eq('clients.user_id', user.id);
        }

        const { data: batchData, error } = await query;

        if (error) {
          console.error("Erro ao carregar lote:", error);
          throw error;
        }

        if (!batchData || batchData.length === 0) {
          hasMore = false;
          break;
        }

        allLeads = [...allLeads, ...batchData];
        console.log(`Lote carregado: ${batchData.length} leads. Total acumulado: ${allLeads.length}`);

        if (batchData.length < BATCH_SIZE) {
          console.log("Último lote carregado (menos que 1000 leads)");
          hasMore = false;
        }

        batch++;
      }

      console.log(`Total de leads carregados: ${allLeads.length}`);

      // Buscar perfis dos usuários em lotes
      const userIds = [...new Set(allLeads.map(lead => lead.client.user_id))];
      const profiles: { [key: string]: { name: string; email: string } } = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profiles[profile.user_id] = {
              name: profile.name || 'Sem nome',
              email: profile.email || 'Sem email'
            };
          });
        }
      }

      // Processar leads com dados UTM atualizados
      const leadsWithUTM = allLeads.map(lead => {
        const updatedLead = updateLeadWithUTMData(lead);
        return {
          ...updatedLead,
          profile: profiles[lead.client.user_id] || { name: 'Sem nome', email: 'Sem email' }
        };
      });

      // Verificar quantos leads precisam de atualização UTM
      const leadsNeedingUpdate = leadsWithUTM.filter(lead => 
        lead.origin !== allLeads.find(original => original.id === lead.id)?.origin ||
        lead.campaign !== allLeads.find(original => original.id === lead.id)?.campaign ||
        lead.ad_content !== allLeads.find(original => original.id === lead.id)?.ad_content ||
        lead.audience !== allLeads.find(original => original.id === lead.id)?.audience
      );

      if (leadsNeedingUpdate.length > 0) {
        console.log(`Atualizando ${leadsNeedingUpdate.length} leads com dados UTM...`);
        await updateLeadsInBatch(leadsNeedingUpdate);
      }

      setLeads(leadsWithUTM);
      setFilteredLeads(leadsWithUTM);
      
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const updateLeadsInBatch = async (leadsToUpdate: Lead[]) => {
    try {
      setUpdating(true);
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < leadsToUpdate.length; i += BATCH_SIZE) {
        const batch = leadsToUpdate.slice(i, i + BATCH_SIZE);
        
        const updates = batch.map(lead => ({
          id: lead.id,
          origin: lead.origin,
          campaign: lead.campaign,
          ad_content: lead.ad_content,
          audience: lead.audience
        }));

        const { error } = await supabase
          .from('leads')
          .upsert(updates);

        if (error) {
          console.error('Erro ao atualizar lote de leads:', error);
        }
      }
      
      toast.success(`${leadsToUpdate.length} leads atualizados com dados UTM`);
    } catch (error) {
      console.error('Erro ao atualizar leads:', error);
      toast.error('Erro ao atualizar leads');
    } finally {
      setUpdating(false);
    }
  };

  const handleFilteredLeads = (filtered: Lead[]) => {
    setFilteredLeads(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "Novo", variant: "default" as const },
      contacted: { label: "Contatado", variant: "secondary" as const },
      qualified: { label: "Qualificado", variant: "outline" as const },
      converted: { label: "Convertido", variant: "default" as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando leads...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Capturados</h1>
          <p className="text-muted-foreground">
            Gerencie todos os leads capturados pelos seus sites
          </p>
        </div>
        {updating && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Atualizando dados UTM...</span>
          </div>
        )}
      </div>

      <LeadsFilters 
        leads={leads} 
        onFilteredLeads={handleFilteredLeads}
        userType={userType || 'client'}
      />

      <div className="grid gap-4 mt-6">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Nenhum lead encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {formatDate(lead.created_at)}
                      {userType === 'admin' && lead.profile && (
                        <span className="ml-2 text-primary">
                          • Cliente: {lead.profile.name} ({lead.profile.email})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contato</p>
                    <p className="text-sm">{lead.email}</p>
                    <p className="text-sm">{lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Origem</p>
                    <p className="text-sm">{lead.origin}</p>
                    <p className="text-sm text-muted-foreground">Campanha: {lead.campaign}</p>
                  </div>
                </div>
                
                {lead.message && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Mensagem</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{lead.message}</p>
                    </div>
                  </>
                )}

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">Anúncio:</span>
                    <p className="truncate">{lead.ad_content}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Público:</span>
                    <p className="truncate">{lead.audience}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Site:</span>
                    <p className="truncate">{lead.website_url}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <p className="truncate">{lead.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsCaptured;

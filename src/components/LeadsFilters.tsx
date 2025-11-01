
import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface LeadsFiltersProps {
  leads: Lead[];
  onFilteredLeads: (filtered: Lead[]) => void;
  userType: 'admin' | 'client';
}

const LeadsFilters = ({ leads, onFilteredLeads, userType }: LeadsFiltersProps) => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedAdContent, setSelectedAdContent] = useState<string>("");
  const [selectedAudience, setSelectedAudience] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [allClients, setAllClients] = useState<Array<{ name: string; email: string }>>([]);

  // Definir todas as origens possíveis do sistema
  const allOrigins = [
    'Meta Ads',
    'Google Ads', 
    'Tráfego Direto',
    'Chat GPT',
    'Tráfego Orgânico'
  ];

  // Buscar todos os clientes com planos ativos
  useEffect(() => {
    const fetchAllClients = async () => {
      if (userType !== 'admin') return;

      try {
        // Buscar todos os clientes com planos ativos
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('user_id, is_active')
          .eq('is_active', true);

        if (clientsError) throw clientsError;

        if (clientsData && clientsData.length > 0) {
          // Buscar os planos ativos desses clientes
          const clientIds = clientsData.map(c => c.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('name, email, user_id')
            .in('user_id', clientIds);

          if (profilesError) throw profilesError;

          // Buscar planos ativos
          const { data: plansData, error: plansError } = await supabase
            .from('subscription_plans')
            .select('client_id')
            .eq('is_active', true)
            .gt('end_date', new Date().toISOString());

          if (plansError) throw plansError;

          // Filtrar apenas clientes com planos ativos
          const activeClientIds = new Set(
            plansData?.map(p => {
              const client = clientsData.find(c => c.user_id === p.client_id);
              return client?.user_id;
            }).filter(Boolean)
          );

          const activeProfiles = profilesData
            ?.filter(p => activeClientIds.has(p.user_id))
            .sort((a, b) => a.name.localeCompare(b.name)) || [];

          setAllClients(activeProfiles);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    };

    fetchAllClients();
  }, [userType]);

  // Calcular dados únicos baseado nos filtros ativos
  const uniqueData = useMemo(() => {
    let filteredData = leads;

    // Aplicar filtros em sequência para obter dados relacionados
    if (selectedClient) {
      filteredData = filteredData.filter(lead => lead.profile?.name === selectedClient);
    }
    if (selectedOrigin) {
      filteredData = filteredData.filter(lead => lead.origin === selectedOrigin);
    }
    if (selectedCampaign) {
      filteredData = filteredData.filter(lead => lead.campaign === selectedCampaign);
    }
    if (selectedAdContent) {
      filteredData = filteredData.filter(lead => lead.ad_content === selectedAdContent);
    }
    if (selectedAudience) {
      filteredData = filteredData.filter(lead => lead.audience === selectedAudience);
    }

    // Extrair valores únicos dos dados filtrados
    const clients = [...new Set(filteredData.map(lead => lead.profile?.name).filter(Boolean))].sort();
    
    // Para origens, usar TODAS as origens que existem no conjunto completo de leads + as origens do sistema
    const allExistingOrigins = [...new Set(leads.map(lead => lead.origin).filter(Boolean))];
    const allUniqueOrigins = [...new Set([...allExistingOrigins, ...allOrigins])];
    const origins = allUniqueOrigins.sort();
    
    const campaigns = [...new Set(filteredData.map(lead => lead.campaign).filter(Boolean))].sort();
    const adContents = [...new Set(filteredData.map(lead => lead.ad_content).filter(Boolean))].sort();
    const audiences = [...new Set(filteredData.map(lead => lead.audience).filter(Boolean))].sort();
    const statuses = [...new Set(filteredData.map(lead => lead.status).filter(Boolean))].sort();

    return { clients, origins, campaigns, adContents, audiences, statuses };
  }, [leads, selectedClient, selectedOrigin, selectedCampaign, selectedAdContent, selectedAudience]);

  // Aplicar todos os filtros e retornar leads filtrados
  useEffect(() => {
    let filtered = leads;

    if (selectedClient) {
      filtered = filtered.filter(lead => lead.profile?.name === selectedClient);
    }
    if (selectedOrigin) {
      filtered = filtered.filter(lead => lead.origin === selectedOrigin);
    }
    if (selectedCampaign) {
      filtered = filtered.filter(lead => lead.campaign === selectedCampaign);
    }
    if (selectedAdContent) {
      filtered = filtered.filter(lead => lead.ad_content === selectedAdContent);
    }
    if (selectedAudience) {
      filtered = filtered.filter(lead => lead.audience === selectedAudience);
    }
    if (selectedStatus) {
      filtered = filtered.filter(lead => lead.status === selectedStatus);
    }

    onFilteredLeads(filtered);
  }, [leads, selectedClient, selectedOrigin, selectedCampaign, selectedAdContent, selectedAudience, selectedStatus, onFilteredLeads]);

  // Limpar filtros dependentes quando um filtro superior muda
  const handleClientChange = (value: string) => {
    setSelectedClient(value);
    setSelectedOrigin("");
    setSelectedCampaign("");
    setSelectedAdContent("");
    setSelectedAudience("");
  };

  const handleOriginChange = (value: string) => {
    setSelectedOrigin(value);
    setSelectedCampaign("");
    setSelectedAdContent("");
    setSelectedAudience("");
  };

  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    setSelectedAdContent("");
    setSelectedAudience("");
  };

  const handleAdContentChange = (value: string) => {
    setSelectedAdContent(value);
    setSelectedAudience("");
  };

  const clearAllFilters = () => {
    setSelectedClient("");
    setSelectedOrigin("");
    setSelectedCampaign("");
    setSelectedAdContent("");
    setSelectedAudience("");
    setSelectedStatus("");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Não Lido";
      case "read":
        return "Lido";
      case "contacted":
        return "Contatado";
      case "qualified":
        return "Qualificado";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        Filtros:
      </div>
      
      {userType === 'admin' && (
        <Select value={selectedClient} onValueChange={handleClientChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {allClients.map(client => (
              <SelectItem key={client.email} value={client.name}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={selectedOrigin} onValueChange={handleOriginChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione a origem" />
        </SelectTrigger>
        <SelectContent>
          {uniqueData.origins.map(origin => (
            <SelectItem key={origin} value={origin}>
              {origin}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCampaign} onValueChange={handleCampaignChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione a campanha" />
        </SelectTrigger>
        <SelectContent>
          {uniqueData.campaigns.map(campaign => (
            <SelectItem key={campaign} value={campaign}>
              {campaign}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAdContent} onValueChange={handleAdContentChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione o anúncio" />
        </SelectTrigger>
        <SelectContent>
          {uniqueData.adContents.map(adContent => (
            <SelectItem key={adContent} value={adContent}>
              {adContent}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAudience} onValueChange={setSelectedAudience}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione o público" />
        </SelectTrigger>
        <SelectContent>
          {uniqueData.audiences.map(audience => (
            <SelectItem key={audience} value={audience}>
              {audience}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione o status" />
        </SelectTrigger>
        <SelectContent>
          {uniqueData.statuses.map(status => (
            <SelectItem key={status} value={status}>
              {getStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(selectedClient || selectedOrigin || selectedCampaign || selectedAdContent || selectedAudience || selectedStatus) && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};

export default LeadsFilters;


import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";

interface LeadsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  clientFilter: string;
  onClientChange: (value: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  userProfile: any;
  onFiltersApply: () => void;
}

const LeadsFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  clientFilter,
  onClientChange,
  dateRange,
  onDateRangeChange,
  userProfile,
  onFiltersApply
}: LeadsFiltersProps) => {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (userProfile?.user_type === "admin") {
      loadClients();
    }
  }, [userProfile]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          id,
          profiles (name)
        `);

      if (error) throw error;

      const clientsData = data?.map(client => ({
        id: client.id,
        name: client.profiles?.name || 'N/A'
      })) || [];

      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const handleClearFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onClientChange("");
    onDateRangeChange({ start: "", end: "" });
    onFiltersApply();
  };

  const hasActiveFilters = searchTerm || statusFilter || clientFilter || dateRange.start || dateRange.end;

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg mb-6">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="qualified">Qualificado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
          </SelectContent>
        </Select>

        {/* Client Filter (Admin only) */}
        {userProfile?.user_type === "admin" && (
          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Range */}
        <Input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="w-48"
          placeholder="Data inicial"
        />

        <Input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="w-48"
          placeholder="Data final"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default LeadsFilters;

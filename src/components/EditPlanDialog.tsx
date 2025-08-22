
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface EditPlanDialogProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated: () => void;
}

const EditPlanDialog = ({ plan, isOpen, onClose, onPlanUpdated }: EditPlanDialogProps) => {
  const [planType, setPlanType] = useState<"free_7_days" | "one_month" | "three_months" | "six_months" | "one_year">("free_7_days");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      setPlanType(plan.plan_type);
      setIsActive(plan.is_active);
    }
  }, [plan]);

  const handleSubmit = async () => {
    if (!plan) return;

    try {
      setLoading(true);

      const { error } = await supabase.rpc('update_subscription_plan', {
        plan_id: plan.id,
        new_plan_type: planType,
        new_is_active: isActive
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso",
      });

      onPlanUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Plano</DialogTitle>
          <DialogDescription>
            Editando plano de <strong>{plan.clients?.profiles?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="planType">Tipo de Plano</Label>
            <Select value={planType} onValueChange={(value: "free_7_days" | "one_month" | "three_months" | "six_months" | "one_year") => setPlanType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free_7_days">Grátis 7 dias</SelectItem>
                <SelectItem value="one_month">1 Mês</SelectItem>
                <SelectItem value="three_months">3 Meses</SelectItem>
                <SelectItem value="six_months">6 Meses</SelectItem>
                <SelectItem value="one_year">1 Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Plano Ativo</Label>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Plano Atual:</strong> {getPlanTypeLabel(plan.plan_type)}</p>
            <p><strong>Status Atual:</strong> {plan.is_active ? "Ativo" : "Inativo"}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;

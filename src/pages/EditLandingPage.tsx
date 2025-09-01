
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import StepNavigation from "@/components/StepNavigation";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";

interface ProfileField {
  id: string;
  step_name: string;
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  is_required: boolean;
  field_order: number;
  step_order: number;
}

interface LandingPageData {
  [key: string]: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  profile_id: string;
}

interface Step {
  id: string;
  name: string;
  completed: boolean;
  fields: ProfileField[];
}

const EditLandingPage = () => {
  const { userProfile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [landingData, setLandingData] = useState<LandingPageData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadLandingPage();
    }
  }, [id]);

  const loadLandingPage = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da landing page
      const { data: pageData, error: pageError } = await supabase
        .from("user_landing_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (pageError) throw pageError;
      
      // Verificar se o usuário tem permissão
      if (userProfile?.user_type !== 'admin' && pageData.user_id !== userProfile?.user_id) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para editar esta landing page.",
          variant: "destructive",
        });
        navigate("/landing-pages");
        return;
      }

      setLandingPage(pageData);

      // Carregar campos do perfil
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("landing_profile_fields")
        .select("*")
        .eq("profile_id", pageData.profile_id)
        .order("step_order", { ascending: true })
        .order("field_order", { ascending: true });

      if (fieldsError) throw fieldsError;

      // Carregar dados salvos da landing page
      const { data: savedData, error: dataError } = await supabase
        .from("landing_page_data")
        .select("*")
        .eq("landing_page_id", id);

      if (dataError) throw dataError;
      
      const dataMap: LandingPageData = {};
      savedData?.forEach(item => {
        dataMap[item.field_name] = item.field_value || '';
      });
      setLandingData(dataMap);

      // Organizar campos por etapas
      const stepMap = new Map<string, ProfileField[]>();
      fieldsData?.forEach(field => {
        if (!stepMap.has(field.step_name)) {
          stepMap.set(field.step_name, []);
        }
        stepMap.get(field.step_name)!.push(field);
      });

      const stepsArray: Step[] = Array.from(stepMap.entries())
        .sort(([, a], [, b]) => a[0].step_order - b[0].step_order)
        .map(([stepName, fields]) => ({
          id: stepName.toLowerCase().replace(/\s+/g, '-'),
          name: stepName,
          completed: false,
          fields: fields.sort((a, b) => a.field_order - b.field_order)
        }));

      setSteps(stepsArray);

    } catch (error: any) {
      console.error("Error loading landing page:", error);
      toast({
        title: "Erro ao carregar landing page",
        description: error.message,
        variant: "destructive",
      });
      navigate("/landing-pages");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setLandingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateCurrentStep = () => {
    if (steps.length === 0) return false;
    
    const currentStepData = steps[currentStep];
    const requiredFields = currentStepData.fields.filter(field => field.is_required);
    
    return requiredFields.every(field => {
      const value = landingData[field.field_name];
      return value && value.trim() !== '';
    });
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Marcar etapa atual como completa se válida
      if (validateCurrentStep()) {
        const updatedSteps = [...steps];
        updatedSteps[currentStep].completed = true;
        setSteps(updatedSteps);
        await handleSave();
      }
      setCurrentStep(prev => prev + 1);
    } else {
      // Última etapa - finalizar
      await handleSave();
      toast({
        title: "Landing page finalizada!",
        description: "Sua landing page foi salva com sucesso.",
      });
      navigate("/landing-pages");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar apenas os campos da etapa atual ou todos se for save manual
      const fieldsToSave = currentStep < steps.length ? steps[currentStep].fields : steps.flatMap(s => s.fields);
      
      for (const field of fieldsToSave) {
        const fieldValue = landingData[field.field_name];
        if (fieldValue !== undefined) {
          await supabase
            .from("landing_page_data")
            .upsert({
              landing_page_id: id,
              field_name: field.field_name,
              field_value: fieldValue
            });
        }
      }

    } catch (error: any) {
      console.error("Error saving landing page:", error);
      toast({
        title: "Erro ao salvar landing page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: ProfileField) => {
    const value = landingData[field.field_name] || '';

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            id={field.field_name}
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
            className="w-full"
          />
        );
      case 'number':
        return (
          <Input
            id={field.field_name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full"
          />
        );
      case 'email':
        return (
          <Input
            id={field.field_name}
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full"
          />
        );
      default:
        return (
          <Input
            id={field.field_name}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Landing page não encontrada</h2>
              <Button onClick={() => navigate("/landing-pages")}>
                Voltar para Landing
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const canGoNext = validateCurrentStep();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/landing-pages")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{landingPage.name}</h1>
                <p className="text-muted-foreground">Personalize sua landing page por etapas</p>
              </div>
            </div>
            <div className="flex gap-2">
              {landingPage.is_published && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/public/${landingPage.slug}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {steps.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <StepNavigation
                  steps={steps}
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  canGoNext={canGoNext}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                />
                
                <div className="mt-8">
                  <div className="space-y-6">
                    {currentStepData?.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.field_name}>
                          {field.field_label}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditLandingPage;

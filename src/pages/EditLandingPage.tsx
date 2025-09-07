import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import StepNavigation from "@/components/StepNavigation";
import FileUploadField from "@/components/FileUploadField";
import TextareaWithCounter from "@/components/TextareaWithCounter";
import MoneyInput from "@/components/MoneyInput";
import NumberInput from "@/components/NumberInput";
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
  [key: string]: string | string[] | boolean;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  profile_id: string;
  user_id: string;
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
        if (item.field_value) {
          // Check if it's a JSON array for multiple files
          try {
            const parsed = JSON.parse(item.field_value);
            dataMap[item.field_name] = Array.isArray(parsed) ? parsed : item.field_value;
          } catch {
            // For checkbox fields, convert "true"/"false" strings to boolean
            if (item.field_value === 'true' || item.field_value === 'false') {
              dataMap[item.field_name] = item.field_value === 'true';
            } else {
              dataMap[item.field_name] = item.field_value;
            }
          }
        } else {
          dataMap[item.field_name] = '';
        }
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

  const handleFieldChange = (fieldName: string, value: string | string[] | boolean) => {
    console.log("Field change:", fieldName, value, typeof value);
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
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'boolean') {
        return true; // Checkboxes are always valid
      }
      return value && String(value).trim() !== '';
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

      // Salvar todos os campos que foram modificados
      const allFields = steps.flatMap(s => s.fields);
      
      for (const field of allFields) {
        const fieldValue = landingData[field.field_name];
        if (fieldValue !== undefined) {
          let valueToSave: string;
          
          if (Array.isArray(fieldValue)) {
            valueToSave = JSON.stringify(fieldValue);
          } else if (typeof fieldValue === 'boolean') {
            valueToSave = fieldValue.toString();
          } else {
            valueToSave = String(fieldValue);
          }
          
          console.log("Saving field:", field.field_name, "Value:", valueToSave, "Type:", typeof fieldValue);
          
          // Use upsert to insert or update the field data
          const { error } = await supabase
            .from("landing_page_data")
            .upsert({
              landing_page_id: id,
              field_name: field.field_name,
              field_value: valueToSave
            }, {
              onConflict: 'landing_page_id,field_name'
            });

          if (error) {
            console.error("Error saving field:", field.field_name, error);
            throw error;
          }
        }
      }

      toast({
        title: "Dados salvos com sucesso!",
      });

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

  const handlePublishToggle = async () => {
    if (!landingPage) return;

    try {
      const newPublishStatus = !landingPage.is_published;
      
      // Atualizar status de publicação
      const { error: updateError } = await supabase
        .from("user_landing_pages")
        .update({ is_published: newPublishStatus })
        .eq("id", landingPage.id);

      if (updateError) throw updateError;

      // Se está sendo publicada, criar um site correspondente
      if (newPublishStatus) {
        const domain = `landing.${landingPage.slug}.com`;
        
        // Verificar se já existe um site com este domínio
        const { data: existingSite } = await supabase
          .from("sites")
          .select("id")
          .eq("domain", domain)
          .eq("user_id", landingPage.user_id)
          .maybeSingle();

        if (!existingSite) {
          // Criar novo site
          const { data: newSite, error: siteError } = await supabase
            .from("sites")
            .insert({
              user_id: landingPage.user_id,
              domain: domain,
              is_active: true
            })
            .select()
            .single();

          if (siteError) throw siteError;

          // Buscar dados do perfil do usuário para criar configurações padrão
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("user_id", landingPage.user_id)
            .single();

          // Criar configurações padrão do site
          const { error: configError } = await supabase
            .from("site_configs")
            .insert({
              site_id: newSite.id,
              company_name: userProfile?.name || "Empresa",
              email: userProfile?.email || "",
              phone: "",
              attendant_name: userProfile?.name || "Atendente",
              default_message: "Olá! Vim através da landing page.",
              icon_type: "whatsapp",
              icon_position: "bottom",
              field_name: true,
              field_email: true,
              field_phone: true,
              field_message: true,
              field_capture_page: true,
              is_active: true
            });

          if (configError) throw configError;

          toast({
            title: "Landing page publicada!",
            description: `Site criado automaticamente: ${domain}`,
          });
        } else {
          toast({
            title: "Landing page publicada!",
            description: "Site já existia para esta landing page.",
          });
        }
      }

      // Atualizar estado local
      setLandingPage(prev => prev ? { ...prev, is_published: newPublishStatus } : null);

      toast({
        title: newPublishStatus ? "Landing page publicada!" : "Landing page despublicada!",
        description: newPublishStatus 
          ? "Sua landing page está agora disponível publicamente."
          : "Sua landing page não está mais pública.",
      });

    } catch (error: any) {
      console.error("Error updating publish status:", error);
      toast({
        title: "Erro ao alterar status de publicação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderField = (field: ProfileField) => {
    const value = landingData[field.field_name] || '';
    console.log("Rendering field:", field.field_name, "Type:", field.field_type, "Value:", value);

    switch (field.field_type) {
      case 'file':
      case 'image':
        return (
          <FileUploadField
            id={field.field_name}
            label={field.field_label}
            placeholder={field.placeholder}
            required={field.is_required}
            multiple={false}
            value={typeof value === 'string' ? value : ''}
            onChange={(newValue) => {
              console.log("Single file onChange:", field.field_name, newValue);
              handleFieldChange(field.field_name, newValue as string);
            }}
          />
        );
      
      case 'multiple_files':
        return (
          <FileUploadField
            id={field.field_name}
            label={field.field_label}
            placeholder={field.placeholder}
            required={field.is_required}
            multiple={true}
            value={Array.isArray(value) ? value : (value ? [String(value)] : [])}
            onChange={(newValue) => {
              console.log("Multiple files onChange:", field.field_name, newValue);
              handleFieldChange(field.field_name, newValue as string[]);
            }}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.field_name}
              checked={typeof value === 'boolean' ? value : false}
              onCheckedChange={(checked) => handleFieldChange(field.field_name, !!checked)}
            />
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );
      
      case 'textarea':
        // Check if it's the banner subtitle with character limit
        if (field.field_name === 'banner_subtitle' || field.placeholder?.includes('122 caracteres')) {
          return (
            <TextareaWithCounter
              id={field.field_name}
              label={field.field_label}
              placeholder={field.placeholder}
              required={field.is_required}
              value={String(value)}
              onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
              maxLength={122}
            />
          );
        }
        return (
          <div className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.field_name}
              value={String(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
              rows={4}
              className="w-full"
            />
          </div>
        );
      
      case 'number':
        // Verificar se é o campo de área total
        if (field.field_name === 'area_total' || field.field_label?.toLowerCase().includes('área')) {
          return (
            <NumberInput
              id={field.field_name}
              label={field.field_label}
              placeholder={field.placeholder}
              required={field.is_required}
              value={String(value)}
              onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
            />
          );
        }
        return (
          <div className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              type="number"
              value={String(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
              className="w-full"
            />
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              type="email"
              value={String(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
              className="w-full"
            />
          </div>
        );
      
      default:
        // Verificar se é o campo de valor do imóvel
        if (field.field_name === 'valor_imovel' || field.field_label?.toLowerCase().includes('valor')) {
          return (
            <MoneyInput
              id={field.field_name}
              label={field.field_label}
              placeholder={field.placeholder}
              required={field.is_required}
              value={String(value)}
              onChange={(newValue) => handleFieldChange(field.field_name, newValue)}
            />
          );
        }
        
        return (
          <div className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              type="text"
              value={String(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              required={field.is_required}
              className="w-full"
            />
          </div>
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
              <Button 
                onClick={handlePublishToggle} 
                variant={landingPage.is_published ? "secondary" : "default"}
              >
                {landingPage.is_published ? "Despublicar" : "Publicar"}
              </Button>
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
                      <div key={field.id}>
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


import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface Step {
  id: string;
  name: string;
  completed: boolean;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const StepNavigation = ({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext,
  isFirstStep,
  isLastStep,
}: StepNavigationProps) => {
  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer ${
                index === currentStep
                  ? "bg-blue-600 border-blue-600 text-white"
                  : step.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
              onClick={() => onStepChange(index)}
            >
              {step.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  step.completed ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step name */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {steps[currentStep]?.name}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Etapa {currentStep + 1} de {steps.length}
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center gap-2"
        >
          {isLastStep ? "Finalizar" : "Próximo"}
          {!isLastStep && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigation;

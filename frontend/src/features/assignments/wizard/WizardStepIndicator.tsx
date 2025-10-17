import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WIZARD_STEPS } from '@/utils/wizardConstants';
import type { WizardStep } from '@/types/wizard';

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
}

export const WizardStepIndicator = ({ currentStep }: WizardStepIndicatorProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isLast = index === WIZARD_STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && !isCompleted && 'bg-blue-500 text-white ring-4 ring-blue-100',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isActive && 'text-blue-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 max-w-[120px]">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all',
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

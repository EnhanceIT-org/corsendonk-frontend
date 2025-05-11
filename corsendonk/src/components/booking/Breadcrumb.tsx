import * as React from "react";
import { useTranslation } from 'react-i18next'; // Import hook

interface BreadcrumbProps {
  currentStep: 1 | 2 | 3 | 4; // Adjusted to potentially handle 4 steps based on other files
  onNavigate?: (step: number) => void;
  title: string;
}

// Removed hardcoded STEP_LABELS

export function Breadcrumb({
  currentStep,
  onNavigate,
  title,
}: BreadcrumbProps) {
  const { t } = useTranslation(); // Instantiate hook

  // Define step labels using translation keys
  const STEP_LABELS = [
    t('breadcrumb.selectArrangement', 'Select Arrangement'), // Using existing key from translation files
    t('breadcrumb.chooseRoomsAndOptions', 'Choose Rooms'), // Using existing key
    t('breadcrumb.yourDetails', 'Confirm'), // Using existing key
    
  ];

  // Determine which steps to show based on currentStep (show up to current step + 1, max 4)
  // Or maybe always show all 4? Let's show all 4 for now.
  const stepsToShow = STEP_LABELS; // Show all defined steps

  return (
    <div className="mb-8">
      {/* The small steps chain */}
      <div className="text-sm text-gray-500 mb-2 flex items-center flex-wrap"> {/* Added flex-wrap */}
        {stepsToShow.map((label, idx) => {
          const stepNumber = (idx + 1) as 1 | 2 | 3 | 4; // Adjusted type
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;

          // If it's the current step, we show bold green; otherwise normal text.
          const textClass = isCurrent
            ? "font-bold text-[#2C4A3C]"
            : "text-gray-700";

          // If it's in the past, let user click to go back
          const clickableClass =
            isPast && onNavigate ? "cursor-pointer hover:text-[#2C4A3C]" : "";

          // On click, if past, call onNavigate(stepNumber)
          const handleClick = () => {
            if (isPast && onNavigate) {
              onNavigate(stepNumber);
            }
          };

          return (
            <div key={`step-${idx}`} className="flex items-center">
              <span
                onClick={handleClick}
                className={`${textClass} ${clickableClass}`}
              >
                {label}
              </span>
              {/* Show " > " unless it's the last label */}
              {idx < stepsToShow.length - 1 && (
                <span className="mx-2 text-gray-400">{'>'}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* The big green title */}
      <h1 className="text-3xl font-semibold text-[#2C4A3C] mb-6">{title}</h1>
    </div>
  );
}

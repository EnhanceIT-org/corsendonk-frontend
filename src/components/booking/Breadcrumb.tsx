import * as React from "react";

interface BreadcrumbProps {
  currentStep: 1 | 2 | 3;
  onNavigate?: (step: number) => void;
  title: string;
}

const STEP_LABELS = ["Verblijf", "Kamerselectie", "Bevestiging"];

export function Breadcrumb({
  currentStep,
  onNavigate,
  title,
}: BreadcrumbProps) {
  return (
    <div className="mb-8">
      {/* The small steps chain */}
      <div className="text-sm text-gray-500 mb-2 flex items-center">
        {STEP_LABELS.map((label, idx) => {
          const stepNumber = (idx + 1) as 1 | 2 | 3;
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
              {idx < STEP_LABELS.length - 1 && (
                <span className="mx-2 text-gray-400">&gt;</span>
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

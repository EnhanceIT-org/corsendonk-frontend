import React from "react";
import { useTranslation } from 'react-i18next'; // Import hook

interface MealPlanToggleProps {
  selected: "breakfast" | "halfboard";
  onChange: (value: "breakfast" | "halfboard") => void;
  breakfastAvailable?: boolean; // Optional prop to disable breakfast
  halfBoardAvailable?: boolean; // Optional prop to disable half board
}
export function MealPlanToggle({ selected, onChange, breakfastAvailable = true, halfBoardAvailable = true }: MealPlanToggleProps) {
  const { t } = useTranslation(); // Instantiate hook
  return (
    <div className="inline-flex rounded-lg p-1 bg-gray-100">
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          selected === "breakfast"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        } ${!breakfastAvailable ? 'opacity-50 cursor-not-allowed' : ''}`} // Add disabled styles
        onClick={() => onChange("breakfast")}
        disabled={!breakfastAvailable} // Disable button if not available
      >
        {t('mealPlan.breakfastOnly', 'Breakfast Only')}
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          selected === "halfboard"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        } ${!halfBoardAvailable ? 'opacity-50 cursor-not-allowed' : ''}`} // Add disabled styles
        onClick={() => onChange("halfboard")}
        disabled={!halfBoardAvailable} // Disable button if not available
      >
        {t('mealPlan.halfBoard', 'Half Board')}
      </button>
    </div>
  );
}

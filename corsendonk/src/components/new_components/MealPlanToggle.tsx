import React from "react";
interface MealPlanToggleProps {
  selected: "breakfast" | "halfboard";
  onChange: (value: "breakfast" | "halfboard") => void;
}
export function MealPlanToggle({ selected, onChange }: MealPlanToggleProps) {
  return (
    <div className="inline-flex rounded-lg p-1 bg-gray-100">
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          selected === "breakfast"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onChange("breakfast")}
      >
        Breakfast Only
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          selected === "halfboard"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onChange("halfboard")}
      >
        Half Board
      </button>
    </div>
  );
}

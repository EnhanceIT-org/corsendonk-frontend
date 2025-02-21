import React from "react";
interface PricingSummaryProps {
  nights: number;
  mealPlan: "breakfast" | "halfboard";
}
export function PricingSummary({ nights, mealPlan }: PricingSummaryProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-sm text-gray-500">Total Price</div>
            <div className="text-2xl font-semibold">€789</div>
            <div className="text-sm text-gray-500">
              Average €{Math.round(789 / nights)} per night
            </div>
          </div>
          <button className="w-full sm:w-auto bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

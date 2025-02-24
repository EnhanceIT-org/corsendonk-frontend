import { se } from "date-fns/locale";
import React, { useState } from "react";

interface OptionalExtrasProps {
  travelMode: "walking" | "cycling";
  selectedOptionalProducts: {
    lunch: boolean;
    bicycleRent: boolean;
    bicycleTransport: boolean;
  };
  setSelectedOptionalProducts: React.Dispatch<
    React.SetStateAction<{
      lunch: boolean;
      bicycleRent: boolean;
      bicycleTransport: boolean;
    }>
  >;
}

export const OptionalExtras: React.FC<OptionalExtrasProps> = ({
  travelMode,
  selectedOptionalProducts,
  setSelectedOptionalProducts,
}) => {
  const toggleOptionalProduct = (key: string) => {
    setSelectedOptionalProducts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Optionele Extras
      </h3>
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedOptionalProducts.lunch}
            onChange={() => toggleOptionalProduct("lunch")}
            className="rounded border-gray-300"
          />
          <div>
            <div className="font-medium">Lunch pakket</div>
            <div className="text-sm text-gray-500">€15 per persoon per dag</div>
          </div>
        </label>
        {travelMode === "cycling" && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedOptionalProducts.bicycleRent}
              onChange={() => toggleOptionalProduct("bicycleRent")}
              className="rounded border-gray-300"
            />
            <div>
              <div className="font-medium">Fiets Verhuur</div>
              <div className="text-sm text-gray-500">
                €25 per persoon per dag
              </div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

import React from "react";
// Import the new structure and remove the old PRODUCT_NAMES import
import { optionalProducts } from "@/mappings/mappings";
function chargingMethodToDutch(method: string): string {
  switch (method) {
    case "Once":
      return "Eenmalig";   // voor productie moeten we dit nog eens bekijken
    case "PerPerson":
      return "Per persoon";
    case "PerPersonNight":
      return "Per persoon per nacht";
    default:
      return "";
  }
}

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
  // Removed rawConfig, getProductPriceFn, getProductChargingMethodFn props
}

export const OptionalExtras: React.FC<OptionalExtrasProps> = ({
  travelMode,
  selectedOptionalProducts,
  setSelectedOptionalProducts,
  // Removed rawConfig, getProductPriceFn, getProductChargingMethodFn from destructuring
}) => {
  // Filter products based on travel mode
  const availableProducts = optionalProducts.filter((product) =>
    product.availableFor.includes(travelMode)
  );

  const toggleOptionalProduct = (key: string) => {
    setSelectedOptionalProducts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Optionele Extras</h3>
      <div className="space-y-4">
        {availableProducts.map((product) => (
          <label key={product.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedOptionalProducts[product.key]}
              onChange={() => toggleOptionalProduct(product.key)}
              className="rounded border-gray-300"
            />
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">
                {`€${product.price} ${chargingMethodToDutch(product.chargingMethod || "")}`}
              </div>
            </div>
          </label>
        ))}
        {availableProducts.length === 0 && (
           <div className="text-gray-500 italic">
              Geen extra's beschikbaar voor deze reiswijze.
            </div>
        )}
      </div>
    </div>
  );
};

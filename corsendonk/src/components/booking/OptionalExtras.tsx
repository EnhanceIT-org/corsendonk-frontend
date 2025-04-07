import React from "react";
import { PRODUCT_NAMES } from "@/mappings/mappings";
function chargingMethodToDutch(method: string): string {
  switch (method) {
    case "Once":
      return "Eenmalig, per hotel";   // voor productie moeten we dit nog eens bekijken
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
  // The new props:
  rawConfig: any;
  getProductPriceFn: (
    hotelKey: string,
    productName: string,
    config: any
  ) => number;
  getProductChargingMethodFn: (
    hotelKey: string,
    productName: string,
    config: any
  ) => string | null;
}

export const OptionalExtras: React.FC<OptionalExtrasProps> = ({
  travelMode,
  selectedOptionalProducts,
  setSelectedOptionalProducts,
  rawConfig,
  getProductPriceFn,
  getProductChargingMethodFn,
}) => {
  // For displaying a single example price, let's pick the first hotel
  const hotelKey = "hotel1"; //opnieuw voor productie, hoe displayen we product prijs als ze verschillen per hotel? Gewoon totaal?

  // 1) For lunch
  const lunchProductName = PRODUCT_NAMES.lunch;
  const lunchPrice = getProductPriceFn(hotelKey, lunchProductName, rawConfig);
  const lunchCharging = getProductChargingMethodFn(
    hotelKey,
    lunchProductName,
    rawConfig
  );

  // 2) For bicycleRent
  const bicycleRentProductName = PRODUCT_NAMES.bicycleRent;
  const bicycleRentPrice = getProductPriceFn(
    hotelKey,
    bicycleRentProductName,
    rawConfig
  );
  const bicycleRentCharging = getProductChargingMethodFn(
    hotelKey,
    bicycleRentProductName,
    rawConfig
  );

  // 3) For bicycleTransport (if you want to show it in UI similarly)
  const bicycleTransportProductName = PRODUCT_NAMES.bicycleTransport;
  const bicycleTransportPrice = getProductPriceFn(
    hotelKey,
    bicycleTransportProductName,
    rawConfig
  );
  const bicycleTransportCharging = getProductChargingMethodFn(
    hotelKey,
    bicycleTransportProductName,
    rawConfig
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

        {/* LUNCH */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedOptionalProducts.lunch}
            onChange={() => toggleOptionalProduct("lunch")}
            className="rounded border-gray-300"
          />
          <div>
            <div className="font-medium">Lunch pakket</div>
            <div className="text-sm text-gray-500">
              {`€${lunchPrice} ${chargingMethodToDutch(lunchCharging || "")}`}
            </div>
          </div>
        </label>

        {/* ONLY show the "Fiets Verhuur" if user selected "cycling" */}
        {travelMode === "cycling" && (
          <>
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
                  {`€${bicycleRentPrice} ${chargingMethodToDutch(bicycleRentCharging || "")}`}
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOptionalProducts.bicycleTransport}
                onChange={() => toggleOptionalProduct("bicycleTransport")}
                className="rounded border-gray-300"
              />
              <div>
                <div className="font-medium">Fiets Transport</div>
                <div className="text-sm text-gray-500">
                  {`€${bicycleTransportPrice} ${chargingMethodToDutch(bicycleTransportCharging || "")}`}
                </div>
              </div>
            </label>
          </>
        )}
      </div>
    </div>
  );
};

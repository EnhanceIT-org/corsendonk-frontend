// components/booking/RoomSelection.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { fetchWithBaseUrl } from "@/lib/utils";

// Define product names used in pricing lookups.
const productNames = {
  breakfast: "Breakfast (Package)",
  lunch: "Lunch package",
  koffernabreng: "Koffernabreng",
  bicycleRent: "Bicylce renting",
  bicycleTransport: "Bicycle transport cost",
};

export interface RoomSelectionProps {
  bookingData: {
    startDate: string; // Already formatted as DD-MM-YYYY
    arrangementLength: number;
    rooms: number;
    adults: number;
    children: number;
    travelMode: "walking" | "cycling";
    boardOption: "breakfast" | "halfBoard";
  };
  onContinue: (
    selectedArrangement: any,
    pricingData: any,
    rawConfig: any,
    totalPrice: number,
  ) => void;
  onBack: () => void;
}

export const RoomSelection: React.FC<RoomSelectionProps> = ({
  bookingData,
  onContinue,
  onBack,
}) => {
  const [rawConfig, setRawConfig] = useState<any>(null);
  const [arrangements, setArrangements] = useState<{
    breakfast: any;
    halfBoard: any;
  }>({
    breakfast: null,
    halfBoard: null,
  });
  const [selectedArrangement, setSelectedArrangement] = useState<any>(null);
  const [pricingData, setPricingData] = useState<{
    breakfast: any;
    halfBoard: any;
  }>({
    breakfast: null,
    halfBoard: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // State for optional product selections (checkboxes)
  const [selectedOptionalProducts, setSelectedOptionalProducts] = useState<{
    lunch: boolean;
    bicycleRent: boolean;
    bicycleTransport: boolean;
  }>({ lunch: false, bicycleRent: false, bicycleTransport: false });
  // Local board option state.
  const [selectedBoardOption, setSelectedBoardOption] = useState<
    "breakfast" | "halfBoard"
  >(bookingData.boardOption);

  const { startDate, arrangementLength, rooms, adults, children, travelMode } =
    bookingData;

  // Convert startDate (DD-MM-YYYY) to YYYY-MM-DD for configuration call.
  const [day, month, year] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = startDate; // Expected by backend

  // Compute effective occupancy per room.
  const occupancyPerRoom = Math.ceil((adults + children) / rooms);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch configuration.
        const configRes = await fetchWithBaseUrl(
          `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangementLength}`,
        );
        if (!configRes.ok) throw new Error("Failed to fetch configuration");
        const configData = await configRes.json();
        setRawConfig(configData.hotels);

        // 2. Build payload for availability.
        const payload = {
          startDate: formattedStartDatePOST,
          length: arrangementLength,
          guests: { adults, children },
          amountOfRooms: rooms,
        };

        // 3. Call availability endpoint for both board options.
        const [availBreakfastRes, availHalfBoardRes] = await Promise.all([
          axios.post("http://localhost:8000/reservations/availability/", {
            ...payload,
            useHalfBoard: false,
          }),
          axios.post("http://localhost:8000/reservations/availability/", {
            ...payload,
            useHalfBoard: true,
          }),
        ]);
        const availBreakfast = availBreakfastRes.data.data;
        const availHalfBoard = availHalfBoardRes.data.data;
        setArrangements({
          breakfast: availBreakfast.optimal_sequence,
          halfBoard: availHalfBoard.optimal_sequence,
        });
        // 4. Call pricing endpoint for each arrangement.
        const [pricingBreakfastRes, pricingHalfBoardRes] = await Promise.all([
          axios.post("http://localhost:8000/reservations/pricing/", {
            selectedArrangement: availBreakfast.optimal_sequence,
          }),
          axios.post("http://localhost:8000/reservations/pricing/", {
            selectedArrangement: availHalfBoard.optimal_sequence,
          }),
        ]);
        setPricingData({
          breakfast: pricingBreakfastRes.data.data,
          halfBoard: pricingHalfBoardRes.data.data,
        });
        // 5. Set default selected arrangement based on board option.
        if (bookingData.boardOption === "breakfast") {
          setSelectedArrangement(availBreakfast.optimal_sequence);
        } else {
          setSelectedArrangement(availHalfBoard.optimal_sequence);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    bookingData,
    formattedStartDateGET,
    formattedStartDatePOST,
    arrangementLength,
    adults,
    children,
    rooms,
  ]);

  // Handler: Toggle an optional product checkbox.
  const toggleOptionalProduct = (key: string) => {
    setSelectedOptionalProducts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handler: Toggle board option.
  const handleBoardToggle = (option: "breakfast" | "halfBoard") => {
    setSelectedBoardOption(option);
    if (arrangements[option]) {
      setSelectedArrangement(arrangements[option]);
    }
  };

  // Helper: Lookup product price from config.
  const getProductPrice = (
    hotelKey: string,
    productName: string,
    config: any,
  ): number => {
    if (
      config &&
      config[hotelKey] &&
      config[hotelKey].rawConfig &&
      config[hotelKey].rawConfig.Configurations &&
      config[hotelKey].rawConfig.Configurations.length > 0
    ) {
      const raw = config[hotelKey].rawConfig;
      const products = raw.Configurations[0].Enterprise.Products || [];
      const product = products.find(
        (p: any) =>
          p.Name["en-GB"] === productName && p.Prices && p.Prices["EUR"],
      );
      if (product) return product.Prices["EUR"];
    }
    return 0;
  };

  // Helper: Get room category details (name and image URL) from config.
  const getCategoryDetails = (
    hotelKey: string,
    categoryId: string,
    config: any,
  ) => {
    if (
      config &&
      config[hotelKey] &&
      config[hotelKey].rawConfig &&
      config[hotelKey].rawConfig.Configurations &&
      config[hotelKey].rawConfig.Configurations.length > 0
    ) {
      const raw = config[hotelKey].rawConfig;
      const imageBaseUrl = raw.ImageBaseUrl;
      const categories = raw.Configurations[0].Enterprise.Categories || [];
      const category = categories.find((cat: any) => cat.Id === categoryId);
      if (category) {
        const name = category.Name["en-GB"] || "Unknown";
        const imageId =
          category.ImageIds && category.ImageIds.length > 0
            ? category.ImageIds[0]
            : null;
        const imageUrl = imageId ? `${imageBaseUrl}/${imageId}` : null;
        return { name, imageUrl };
      }
    }
    return { name: "Unknown", imageUrl: null };
  };

  // Helper: Get price for a given night and room.
  const getPriceForNight = (
    hotelKey: string,
    date: string,
    categoryId: string,
    boardType: string,
    travelMode: string,
    pricingData: any,
    occupancy: number,
  ) => {
    if (!pricingData) return "N/A";
    const key = boardType === "HB" ? "halfBoard" : "breakfast";
    if (!pricingData[key] || !pricingData[key].nightlyPricing) return "N/A";
    const record = pricingData[key].nightlyPricing.find(
      (item: any) => item.hotel === hotelKey && item.date === date,
    );
    if (record && record.pricing && record.pricing.CategoryPrices) {
      const catPrice = record.pricing.CategoryPrices.find(
        (cp: any) => cp.CategoryId === categoryId,
      );
      if (catPrice && catPrice.OccupancyPrices) {
        let candidate = null;
        let candidateTotal = 0;
        for (const occ of catPrice.OccupancyPrices) {
          const total = occ.Occupancies.reduce(
            (sum: number, o: any) => sum + o.PersonCount,
            0,
          );
          if (total === occupancy) {
            candidate = occ.RateGroupPrices[0];
            break;
          } else if (total < occupancy && total > candidateTotal) {
            candidateTotal = total;
            candidate = occ.RateGroupPrices[0];
          }
        }
        if (
          candidate &&
          candidate.MinPrice &&
          candidate.MinPrice.TotalAmount &&
          typeof candidate.MinPrice.TotalAmount.GrossValue === "number"
        ) {
          return `${candidate.MinPrice.TotalAmount.GrossValue} ${candidate.MinPrice.TotalAmount.Currency}`;
        }
      }
    }
    return "N/A";
  };

  // Helper: Calculate total price.
  const calculateTotalPrice = (
    optimalSequence: any,
    pricingData: any,
    travelMode: string,
    adults: number,
    children: number,
    rooms: number,
    config: any,
    selectedOptionalProducts: { [key: string]: boolean },
  ) => {
    let total = 0;
    const nights = optimalSequence.night_details;
    const occupancy = Math.ceil((adults + children) / rooms);
    nights.forEach((night: any) => {
      night.chosen_rooms.forEach((room: any) => {
        const priceStr = getPriceForNight(
          night.hotel,
          night.date,
          room.category_id,
          night.board_type,
          travelMode,
          pricingData,
          occupancyPerRoom,
        );
        const price = parseFloat(priceStr.split(" ")[0]) || 0;
        total += price;
      });
      if (selectedOptionalProducts.lunch) {
        const lunchPrice = getProductPrice(
          night.hotel,
          productNames.lunch,
          config,
        );
        total += lunchPrice * (adults + children);
      }
      if (travelMode === "cycling") {
        if (selectedOptionalProducts.bicycleRent) {
          const rentPrice = getProductPrice(
            night.hotel,
            productNames.bicycleRent,
            config,
          );
          total += rentPrice * (adults + children);
        }
        if (selectedOptionalProducts.bicycleTransport) {
          const transportPrice = getProductPrice(
            night.hotel,
            productNames.bicycleTransport,
            config,
          );
          total += transportPrice;
        }
      }
    });
    return total;
  };

  const computedTotalPrice = selectedArrangement
    ? calculateTotalPrice(
        selectedArrangement,
        pricingData,
        travelMode,
        adults,
        children,
        rooms,
        rawConfig,
        selectedOptionalProducts,
      )
    : 0;

  // Helper to map selected optional product booleans to product IDs per hotel.
  const computeOptionalProductsMapping = (): Record<string, string[]> => {
    const mapping: Record<string, string[]> = {
      hotel1: [],
      hotel2: [],
      hotel3: [],
    };

    if (selectedOptionalProducts.lunch) {
      mapping["hotel1"].push("d78fcc90-f92a-4547-aba2-b27c0143c1ad");
      mapping["hotel2"].push("bf9c20d3-10d1-4e96-b42b-b27c0144c79f");
      mapping["hotel3"].push("96c6bc09-6ebd-4a67-9924-b27c0145acf1");
    }

    if (travelMode === "cycling") {
      if (selectedOptionalProducts.bicycleRent) {
        mapping["hotel1"].push("59b38a23-15a4-461d-bea6-b27c0143f0e9");
        mapping["hotel2"].push("ecc8e7d4-2a49-4326-a3b1-b27c0144f4bf");
        mapping["hotel3"].push("177ea362-600e-436b-b909-b27c01458da2");
      }
      if (selectedOptionalProducts.bicycleTransport) {
        mapping["hotel1"].push("3dc76cb4-d72f-46b5-8cff-b27c014415ca");
        mapping["hotel2"].push("e1365138-e07e-4e5b-9222-b27c0145279f");
        mapping["hotel3"].push("91038565-d3dc-448d-9a04-b27c014559a2");
      }
    }
    return mapping;
  };

  if (loading) return <div>Loading room arrangements...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedArrangement) return <div>No arrangement found.</div>;

  return (
    <div>
      {/* Board Option Tabs */}
      <div className="flex space-x-4 mb-4">
        <Button
          variant={selectedBoardOption === "breakfast" ? "default" : "outline"}
          onClick={() => handleBoardToggle("breakfast")}
        >
          Breakfast Only
        </Button>
        <Button
          variant={selectedBoardOption === "halfBoard" ? "default" : "outline"}
          onClick={() => handleBoardToggle("halfBoard")}
        >
          Half Board
        </Button>
      </div>
      <h2 className="text-xl font-bold mb-4">
        {travelMode === "walking"
          ? "Walking Arrangement"
          : "Cycling Arrangement"}{" "}
        –{" "}
        {selectedBoardOption === "halfBoard" ? "Half Board" : "Breakfast Only"}
      </h2>
      {selectedArrangement.night_details.map((night: any, idx: number) => (
        <div key={idx} className="border p-4 rounded mb-4">
          <p>
            <strong>Date:</strong> {night.date}
          </p>
          <p>
            <strong>Hotel:</strong> {night.hotel}
          </p>
          <p>
            <strong>Board Type:</strong> {night.board_type}{" "}
            {selectedBoardOption === "halfBoard" &&
              (night.restaurant_chosen
                ? `- Dinner at ${night.restaurant_chosen}`
                : "- Dinner at hotel")}
          </p>
          {/* Chosen Rooms */}
          <div className="mt-2">
            <strong>Chosen Rooms:</strong>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {night.chosen_rooms.map((room: any, roomIdx: number) => {
                const details = getCategoryDetails(
                  night.hotel,
                  room.category_id,
                  rawConfig,
                );
                const priceStr = getPriceForNight(
                  night.hotel,
                  night.date,
                  room.category_id,
                  night.board_type,
                  travelMode,
                  pricingData,
                  occupancyPerRoom,
                );
                return (
                  <div
                    key={roomIdx}
                    className="border rounded p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      const updated = { ...selectedArrangement };
                      updated.night_details[idx].chosen_rooms =
                        night.room_options;
                      setSelectedArrangement(updated);
                    }}
                  >
                    {details.imageUrl && (
                      <img
                        src={details.imageUrl}
                        alt={details.name}
                        className="w-full h-24 object-cover mb-2"
                      />
                    )}
                    <p className="font-bold">{room.category_name}</p>
                    <p>Bed Capacity: {room.bed_capacity}</p>
                    <p>Price: {priceStr}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Alternative Options */}
          <div className="mt-4">
            <strong>Alternative Options:</strong>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {night.room_options.map((option: any, optIdx: number) => {
                const details = getCategoryDetails(
                  night.hotel,
                  option.category_id,
                  rawConfig,
                );
                const altPrice = getPriceForNight(
                  night.hotel,
                  night.date,
                  option.category_id,
                  night.board_type,
                  travelMode,
                  pricingData,
                  occupancyPerRoom,
                );
                return (
                  <div
                    key={optIdx}
                    className="border rounded p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      const updated = { ...selectedArrangement };
                      updated.night_details[idx].chosen_rooms =
                        updated.night_details[idx].chosen_rooms.map(
                          () => option,
                        );
                      setSelectedArrangement(updated);
                    }}
                  >
                    {details.imageUrl && (
                      <img
                        src={details.imageUrl}
                        alt={details.name}
                        className="w-full h-24 object-cover mb-2"
                      />
                    )}
                    <p className="font-bold">{option.category_name}</p>
                    <p>Bed Capacity: {option.bed_capacity}</p>
                    <p>Price: {altPrice}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      {/* Optional Products */}
      <div className="border p-4 rounded mb-4">
        <h3 className="text-lg font-bold mb-2">Optional Products</h3>
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={selectedOptionalProducts.lunch}
            onChange={() => toggleOptionalProduct("lunch")}
            className="mr-2"
          />
          Lunch Package (Per person per night)
        </label>
        {travelMode === "cycling" && (
          <>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedOptionalProducts.bicycleRent}
                onChange={() => toggleOptionalProduct("bicycleRent")}
                className="mr-2"
              />
              Bicycle Renting (Per person)
            </label>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedOptionalProducts.bicycleTransport}
                onChange={() => toggleOptionalProduct("bicycleTransport")}
                className="mr-2"
              />
              Bicycle Transport (Once)
            </label>
          </>
        )}
      </div>
      {/* Price Summary */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-bold mb-2">Price Summary</h3>
        <p>
          <strong>Total Price:</strong> {computedTotalPrice} EUR
        </p>
        <p>
          <strong>Price per Night:</strong>{" "}
          {(
            computedTotalPrice / selectedArrangement.night_details.length
          ).toFixed(2)}{" "}
          EUR
        </p>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            const optionalProductsMapping = computeOptionalProductsMapping();
            const finalArrangement = {
              ...selectedArrangement,
              optionalProducts: optionalProductsMapping,
            };
            onContinue(
              finalArrangement,
              pricingData,
              rawConfig,
              computedTotalPrice,
            );
          }}
        >
          Continue to Confirmation
        </Button>
      </div>
    </div>
  );
};

export default RoomSelection;

import React, { useEffect, useState } from "react";
import { MealPlanToggle } from "./MealPlanToggle";
import { OptionalExtras } from "./OptionalExtras";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import axios from "axios";
import { fetchWithBaseUrl } from "@/lib/utils";
import { Coffee, UtensilsCrossed, Plus, Minus, Bike, Footprints, User } from "lucide-react";
import { ageCategoryMapping, BoardMapping } from "@/mappings/mappings";

// Define product names used in pricing lookups.
const productNames = {
  breakfast: "Breakfast (Package)",
  lunch: "Lunch package",
  koffernabreng: "Koffernabreng",
  bicycleRent: "Bicylce renting",
  bicycleTransport: "Bicycle transport cost",
};

interface selectedArrangementInterface {
  night_details: {
    chosen_rooms: {
      bed_capacity: number;
      category_id: string;
      category_name: string;
      occupant_countAdults?: number;
      occupant_countChildren?: number;
    }[];
    board_type: string;
    date: string;
    hotel: string;
    notes: string[];
    restaurant_chosen: string;
    room_options: {
      available_count: number;
      bed_capacity: number;
      category_id: string;
      category_name: string;
      room_group: string;
    }[];
  }[];
  overall_notes: string[];
  score: number;
  sequence: string[];
}

interface RoomPickerProps {
  bookingData: {
    startDate: string; // Already formatted as DD-MM-YYYY
    arrangementLength: number;
    rooms: number;
    adults: number;
    children: number;
    travelMode: "walking" | "cycling";
    boardOption: "breakfast" | "halfboard";
  };
  onContinue: (
    selectedArrangement: any,
    pricingData: any,
    rawConfig: any,
    totalPrice: number,
  ) => void;
  onBack: () => void;
}

function getNightlyRateId(
  hotel: string,
  boardType: string, // "HB" or "B&B"
  travelMode: string,
) {
  const board = boardType === "HB" ? "halfboard" : "breakfast";
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  return BoardMapping[hotel]?.[mode]?.[board] || "";
}

function getPriceForNight(
  hotelKey: string,
  date: string,
  categoryId: string,
  boardType: string, // "HB" or "B&B"
  travelMode: string,
  pricingData: any,
  room: any,
): string {
  if (!pricingData) return "N/A";
  const dataKey = boardType === "HB" ? "halfboard" : "breakfast";
  const nightlyArr = pricingData[dataKey]?.nightlyPricing || [];
  const foundEntry = nightlyArr.find(
    (x: any) => x.hotel === hotelKey && x.date === date,
  );
  if (!foundEntry?.pricing?.CategoryPrices) return "N/A";

  const cat = foundEntry.pricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === categoryId,
  );
  if (!cat) return "N/A";

  const occupantAdults = room.occupant_countAdults || 0;
  const occupantChildren = room.occupant_countChildren || 0;
  const occupantTotal = occupantAdults + occupantChildren;
  const occupantArray: any[] = [];
  if (occupantAdults > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotelKey]?.adult,
      PersonCount: occupantAdults,
    });
  }
  if (occupantChildren > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotelKey]?.child,
      PersonCount: occupantChildren,
    });
  }

  let occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
    if (op.Occupancies.length !== occupantArray.length) return false;
    const sorted1 = [...op.Occupancies].sort((a, b) =>
      (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
    );
    const sorted2 = occupantArray.sort((a, b) =>
      (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
    );
    for (let i = 0; i < sorted1.length; i++) {
      if (
        sorted1[i].AgeCategoryId !== sorted2[i].AgeCategoryId ||
        sorted1[i].PersonCount !== sorted2[i].PersonCount
      ) {
        return false;
      }
    }
    return true;
  });
  if (!occupantPriceEntry) {
    occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
      const sum = op.Occupancies.reduce((acc: number, x: any) => acc + x.PersonCount, 0);
      return sum === occupantTotal;
    });
  }
  if (!occupantPriceEntry) return "N/A";

  const rateId = getNightlyRateId(hotelKey, boardType, travelMode);
  const rPrice = occupantPriceEntry.RateGroupPrices.find((rgp: any) => rgp.MinRateId === rateId);
  if (!rPrice) return "N/A";

  const val = rPrice.MinPrice?.TotalAmount?.GrossValue;
  if (typeof val === "number") return `${val} EUR`;
  return "N/A";
}

function getPriceForSingleRoom(
  nightlyPricing: any,
  hotel: string,
  boardType: string,
  travelMode: string,
  room: any,
  children: number,
  adults: number,
): number {
  if (!nightlyPricing?.CategoryPrices) return 0;
  const cat = nightlyPricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === room.category_id,
  );
  if (!cat) return 0;

  const occupantTotal = adults + children;
  const occupantArray: any[] = [];
  if (adults > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.adult,
      PersonCount: adults,
    });
  }
  if (children > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.child,
      PersonCount: children,
    });
  }

  let occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
    if (op.Occupancies.length !== occupantArray.length) return false;
    const sorted1 = [...op.Occupancies].sort((a, b) =>
      (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
    );
    const sorted2 = occupantArray.sort((a, b) =>
      (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
    );
    for (let i = 0; i < sorted1.length; i++) {
      if (
        sorted1[i].AgeCategoryId !== sorted2[i].AgeCategoryId ||
        sorted1[i].PersonCount !== sorted2[i].PersonCount
      ) {
        return false;
      }
    }
    return true;
  });
  if (!occupantPriceEntry) {
    occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
      const sum = op.Occupancies.reduce((acc: number, x: any) => acc + x.PersonCount, 0);
      return sum === occupantTotal;
    });
  }
  if (!occupantPriceEntry) return 0;

  const rateId = getNightlyRateId(hotel, boardType, travelMode);
  const rPrice = occupantPriceEntry.RateGroupPrices.find((rgp: any) => rgp.MinRateId === rateId);
  if (!rPrice) return 0;

  const val = rPrice.MinPrice?.TotalAmount?.GrossValue;
  if (typeof val === "number") return val;
  return 0;
}

function calculateTotalPrice(
  arrangement: any,
  pricingDataObj: any,
  travelMode: string,
  adults: number,
  children: number,
  rooms: number,
  config: any,
  selectedOptionalProducts: { [key: string]: boolean },
  sumNightAdultsFn: (night: any) => number,
  sumNightChildrenFn: (night: any) => number,
  getProductPriceFn: (hotelKey: string, productName: string, config: any) => number,
  pricesPerNight: number[],
): number {
  if (!arrangement?.night_details) return 0;
  let total = 0;
  // First add the occupant-based price per night
  for (const price of pricesPerNight) {
    total += price;
  }
  // Then add optional product pricing per night
  for (const night of arrangement.night_details) {
    const boardKey = night.board_type === "HB" ? "halfboard" : "breakfast";
    const nightlyArr = pricingDataObj[boardKey]?.nightlyPricing || [];
    const foundEntry = nightlyArr.find((x: any) => x.date === night.date && x.hotel === night.hotel);
    if (!foundEntry) continue;
    const assignedAdults = sumNightAdultsFn(night);
    const assignedChildren = sumNightChildrenFn(night);
    if (selectedOptionalProducts.lunch) {
      const lunchPrice = getProductPriceFn(night.hotel, productNames.lunch, config);
      total += lunchPrice * (assignedAdults + assignedChildren);
    }
    if (travelMode === "cycling") {
      if (selectedOptionalProducts.bicycleRent) {
        const rentPrice = getProductPriceFn(night.hotel, productNames.bicycleRent, config);
        total += rentPrice * (assignedAdults + assignedChildren);
      }
      if (selectedOptionalProducts.bicycleTransport) {
        const transportPrice = getProductPriceFn(night.hotel, productNames.bicycleTransport, config);
        total += transportPrice;
      }
    }
  }
  return total;
}

const sumNightAdults = (night: any) =>
  night.chosen_rooms.reduce((acc: number, r: any) => acc + (r.occupant_countAdults || 0), 0);
const sumNightChildren = (night: any) =>
  night.chosen_rooms.reduce((acc: number, r: any) => acc + (r.occupant_countChildren || 0), 0);

// Helper: Distribute guests evenly among chosen rooms
function distributeGuestsEvenly(count: number, chosenRooms: any[], isAdult: boolean): number {
  const n = chosenRooms.length;
  if (n === 0) return 0;
  const base = Math.floor(count / n);
  let remainder = count % n;
  const occupantWanted = new Array(n).fill(base);
  for (let i = 0; i < n; i++) {
    if (remainder > 0) {
      occupantWanted[i] += 1;
      remainder--;
    }
  }
  let totalPlaced = 0;
  // Cap each room's occupantWanted by its free beds
  for (let i = 0; i < n; i++) {
    const room = chosenRooms[i];
    const existingAdults = room.occupant_countAdults || 0;
    const existingChildren = room.occupant_countChildren || 0;
    const used = existingAdults + existingChildren;
    const free = room.bed_capacity - used;
    occupantWanted[i] = Math.min(occupantWanted[i], free);
  }
  for (let i = 0; i < n; i++) {
    const room = chosenRooms[i];
    if (isAdult) {
      room.occupant_countAdults = (room.occupant_countAdults || 0) + occupantWanted[i];
    } else {
      room.occupant_countChildren = (room.occupant_countChildren || 0) + occupantWanted[i];
    }
    totalPlaced += occupantWanted[i];
  }
  return totalPlaced;
}

export const RoomPicker: React.FC<RoomPickerProps> = ({ bookingData }) => {
  const [rawConfig, setRawConfig] = useState<any>(null);
  const [arrangements, setArrangements] = useState<{ breakfast: any; halfboard: any }>({
    breakfast: null,
    halfboard: null,
  });
  const [selectedArrangement, setSelectedArrangement] = useState<selectedArrangementInterface>(null);
  const [pricingData, setPricingData] = useState<{ breakfast: any; halfboard: any }>({
    breakfast: null,
    halfboard: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionalProducts, setSelectedOptionalProducts] = useState<{ lunch: boolean; bicycleRent: boolean; bicycleTransport: boolean; }>({
    lunch: false,
    bicycleRent: false,
    bicycleTransport: false,
  });
  const [selectedBoardOption, setSelectedBoardOption] = useState<"breakfast" | "halfboard">(bookingData.boardOption);
  const [defaultDistributed, setDefaultDistributed] = useState(false);

  const { startDate, arrangementLength, rooms, adults, children, travelMode } = bookingData;

  const getProductPriceFn = (hotelKey: string, productName: string, config: any) => {
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
        (p: any) => p.Name["en-GB"] === productName && p.Prices && p.Prices["EUR"],
      );
      if (product) return product.Prices["EUR"];
    }
    return 0;
  };

  const [pricesPerNight, setPricesPerNight] = useState<number[]>(Array(arrangementLength - 1).fill(0));
  const [totalPrice, setTotalPrice] = useState(
    calculateTotalPrice(
      selectedArrangement,
      pricingData,
      travelMode,
      adults,
      children,
      rooms,
      rawConfig,
      selectedOptionalProducts,
      sumNightAdults,
      sumNightChildren,
      getProductPriceFn,
      pricesPerNight,
    ),
  );

  const [year, month, day] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = `${day}-${month}-${year}`;

  // Fetch configuration, availability, and pricing
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const configRes = await fetchWithBaseUrl(
          `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangementLength}`,
        );
        if (!configRes.ok) throw new Error("Failed to fetch configuration");
        const configData = await configRes.json();
        setRawConfig(configData.data.hotels);

        const payload = {
          startDate: formattedStartDatePOST,
          length: arrangementLength,
          guests: { adults, children },
          amountOfRooms: rooms,
        };

        const [availBreakfastRes, availHalfBoardRes] = await Promise.all([
          axios.post("http://localhost:8000/reservations/availability/", { ...payload, useHalfBoard: false }),
          axios.post("http://localhost:8000/reservations/availability/", { ...payload, useHalfBoard: true }),
        ]);
        const availBreakfast = availBreakfastRes.data.data;
        const availHalfBoard = availHalfBoardRes.data.data;
        setArrangements({
          breakfast: availBreakfast.optimal_sequence,
          halfboard: availHalfBoard.optimal_sequence,
        });

        const [pricingBreakfastRes, pricingHalfBoardRes] = await Promise.all([
          axios.post("http://localhost:8000/reservations/pricing/", { selectedArrangement: availBreakfast.optimal_sequence }),
          axios.post("http://localhost:8000/reservations/pricing/", { selectedArrangement: availHalfBoard.optimal_sequence }),
        ]);
        setPricingData({
          breakfast: pricingBreakfastRes.data.data,
          halfboard: pricingHalfBoardRes.data.data,
        });
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
  }, [bookingData, formattedStartDateGET, formattedStartDatePOST, arrangementLength, adults, children, rooms]);

  // Default occupancy distribution logic – run once after selectedArrangement is set
  useEffect(() => {
    if (!selectedArrangement || defaultDistributed) return;
    if (!selectedArrangement.night_details) return;

    const updated = { ...selectedArrangement };
    updated.night_details.forEach((night: any) => {
      const chosenRooms = night.chosen_rooms || [];
      if (chosenRooms.length < 2) {
        chosenRooms.forEach((r: any) => {
          if (r.occupant_countAdults === undefined) r.occupant_countAdults = 0;
          if (r.occupant_countChildren === undefined) r.occupant_countChildren = 0;
        });
        return;
      }
      // Reset occupant counts
      chosenRooms.forEach((r: any) => {
        r.occupant_countAdults = 0;
        r.occupant_countChildren = 0;
      });
      // Distribute adults and children evenly
      distributeGuestsEvenly(adults, chosenRooms, true);
      distributeGuestsEvenly(children, chosenRooms, false);
    });
    setSelectedArrangement(updated);
    setDefaultDistributed(true);
  }, [selectedArrangement, defaultDistributed, adults, children]);

  // Update total price when dependencies change
  useEffect(() => {
    setTotalPrice(
      calculateTotalPrice(
        selectedArrangement,
        pricingData,
        travelMode,
        adults,
        children,
        rooms,
        rawConfig,
        selectedOptionalProducts,
        sumNightAdults,
        sumNightChildren,
        getProductPriceFn,
        pricesPerNight,
      ),
    );
  }, [pricesPerNight, selectedArrangement, pricingData, rawConfig, selectedOptionalProducts, travelMode, adults, children, rooms]);

  const handleBoardToggle = (option: "breakfast" | "halfboard") => {
    setSelectedBoardOption(option);
    if (selectedArrangement) {
      const updatedArrangement = JSON.parse(JSON.stringify(selectedArrangement));
      updatedArrangement.board_type = option;
      setSelectedArrangement(updatedArrangement);
    } else if (arrangements[option]) {
      setSelectedArrangement(arrangements[option]);
    }
  };

  const getCategoryDetails = (hotelKey: string, categoryId: string, config: any) => {
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
        const imageId = category.ImageIds && category.ImageIds.length > 0 ? category.ImageIds[0] : null;
        const imageUrl = imageId ? `${imageBaseUrl}/${imageId}` : null;
        return { name, imageUrl };
      }
    }
    return { name: "Unknown", imageUrl: null };
  };

  // Build optional products mapping
  const computeOptionalProductsMapping = (): Record<string, string[]> => {
    const mapping: Record<string, string[]> = { hotel1: [], hotel2: [], hotel3: [] };
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
    <main className="min-h-screen w-full bg-gray-50 pb-32" data-prototypeid="2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <img
            src="https://www.jobhotel.be/_images_upload/jobhot_15616303455d1496894303b.png"
            alt="Hotel Chain Logo"
            className="h-12 mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#2C4A3C] mb-6">Uw Boeking</h1>
          <MealPlanToggle selected={selectedBoardOption} onChange={handleBoardToggle} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {selectedArrangement.night_details.map((night: any, nightIdx: number) => {
            const assignedAdults = sumNightAdults(night);
            const assignedChildren = sumNightChildren(night);
            return (
              <div key={night.date}>
                <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
                  {/* Date header */}
                  <div className="border-b pb-4 mb-6">
                    <h2 className="text-xl font-medium text-[#2C4A3C]">
                      {format(new Date(night.date), "EEE, MMM d", { locale: nl })}
                    </h2>
                  </div>
                  {/* Hotel info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#2C4A3C]">{night.hotel}</h3>
                  </div>
                  {/* Room selection */}
                  <div className="space-y-6">
                    {night.chosen_rooms.map((room: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-[#2C4A3C]">Room {index + 1}</h4>
                          </div>
                          {/* Room type selector */}
                          <div className="flex flex-col gap-2">
                            <select
                              className="w-full text-sm border rounded-md px-2 py-1.5 bg-white"
                              value={room.category_name}
                              onChange={(e) => {
                                const newChosenRooms = [...selectedArrangement.night_details[nightIdx].chosen_rooms];
                                const option = night.room_options.find((r: any) => r.category_name === e.target.value);
                                newChosenRooms[index] = {
                                  ...newChosenRooms[index],
                                  category_name: e.target.value,
                                  category_id: option.category_id,
                                  bed_capacity: option.bed_capacity,
                                };
                                setSelectedArrangement({
                                  ...selectedArrangement,
                                  night_details: [
                                    ...selectedArrangement.night_details.slice(0, nightIdx),
                                    { ...selectedArrangement.night_details[nightIdx], chosen_rooms: newChosenRooms },
                                    ...selectedArrangement.night_details.slice(nightIdx + 1),
                                  ],
                                });
                              }}
                            >
                              {night.room_options.map((roomOption: any) => (
                                <option key={roomOption.category_id} value={roomOption.category_name}>
                                  {roomOption.category_name}
                                </option>
                              ))}
                            </select>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>
                                {getPriceForSingleRoom(
                                  pricingData[selectedBoardOption]?.nightlyPricing.find(
                                    (x: any) => x.date === night.date && x.hotel === night.hotel,
                                  )?.pricing,
                                  night.hotel,
                                  selectedBoardOption,
                                  travelMode,
                                  room,
                                  room.occupant_countChildren || 0,
                                  room.occupant_countAdults || 0,
                                ) || "Prijs niet beschikbaar"}
                              </span>
                            </div>
                          </div>
                          {/* Guest controls – shown only when more than 1 room */}
                          {rooms > 1 && (
                            <div className="mt-2 space-y-2">
                              {adults > 0 && (
                                <div className="flex items-center gap-2">
                                  <span>Volwassenen:</span>
                                  <button
                                    onClick={() => {
                                      const newChosenRooms = [...selectedArrangement.night_details[nightIdx].chosen_rooms];
                                      newChosenRooms[index] = {
                                        ...newChosenRooms[index],
                                        occupant_countAdults: Math.max(0, (newChosenRooms[index].occupant_countAdults || 0) - 1),
                                      };
                                      setSelectedArrangement({
                                        ...selectedArrangement,
                                        night_details: [
                                          ...selectedArrangement.night_details.slice(0, nightIdx),
                                          { ...selectedArrangement.night_details[nightIdx], chosen_rooms: newChosenRooms },
                                          ...selectedArrangement.night_details.slice(nightIdx + 1),
                                        ],
                                      });
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center">{room.occupant_countAdults || 0}</span>
                                  <button
                                    onClick={() => {
                                      const newChosenRooms = [...selectedArrangement.night_details[nightIdx].chosen_rooms];
                                      const currentRoom = newChosenRooms[index];
                                      const currentAdults = currentRoom.occupant_countAdults || 0;
                                      const currentChildren = currentRoom.occupant_countChildren || 0;
                                      if (currentAdults + currentChildren + 1 <= currentRoom.bed_capacity) {
                                        newChosenRooms[index] = {
                                          ...currentRoom,
                                          occupant_countAdults: currentAdults + 1,
                                        };
                                        setSelectedArrangement({
                                          ...selectedArrangement,
                                          night_details: [
                                            ...selectedArrangement.night_details.slice(0, nightIdx),
                                            { ...selectedArrangement.night_details[nightIdx], chosen_rooms: newChosenRooms },
                                            ...selectedArrangement.night_details.slice(nightIdx + 1),
                                          ],
                                        });
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              {children > 0 && (
                                <div className="flex items-center gap-2">
                                  <span>Kinderen:</span>
                                  <button
                                    onClick={() => {
                                      const newChosenRooms = [...selectedArrangement.night_details[nightIdx].chosen_rooms];
                                      newChosenRooms[index] = {
                                        ...newChosenRooms[index],
                                        occupant_countChildren: Math.max(0, (newChosenRooms[index].occupant_countChildren || 0) - 1),
                                      };
                                      setSelectedArrangement({
                                        ...selectedArrangement,
                                        night_details: [
                                          ...selectedArrangement.night_details.slice(0, nightIdx),
                                          { ...selectedArrangement.night_details[nightIdx], chosen_rooms: newChosenRooms },
                                          ...selectedArrangement.night_details.slice(nightIdx + 1),
                                        ],
                                      });
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center">{room.occupant_countChildren || 0}</span>
                                  <button
                                    onClick={() => {
                                      const newChosenRooms = [...selectedArrangement.night_details[nightIdx].chosen_rooms];
                                      const currentRoom = newChosenRooms[index];
                                      const currentAdults = currentRoom.occupant_countAdults || 0;
                                      const currentChildren = currentRoom.occupant_countChildren || 0;
                                      if (currentAdults + currentChildren + 1 <= currentRoom.bed_capacity) {
                                        newChosenRooms[index] = {
                                          ...currentRoom,
                                          occupant_countChildren: currentChildren + 1,
                                        };
                                        setSelectedArrangement({
                                          ...selectedArrangement,
                                          night_details: [
                                            ...selectedArrangement.night_details.slice(0, nightIdx),
                                            { ...selectedArrangement.night_details[nightIdx], chosen_rooms: newChosenRooms },
                                            ...selectedArrangement.night_details.slice(nightIdx + 1),
                                          ],
                                        });
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Warning messages for unassigned guests (fixed height & green text) */}
                        {rooms > 1 && (
                          <div className="mt-2 text-sm min-h-6 text-[#2C4A3C]">
                            {sumNightAdults(night) < adults && (
                              <p>{adults - sumNightAdults(night)} volwassene(n) niet toegewezen!</p>
                            )}
                            {sumNightChildren(night) < children && (
                              <p>{children - sumNightChildren(night)} kind(eren) niet toegewezen!</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Meal indicators: first row for Ontbijt & Avondeten, then below that a row for total guests */}
                  <div className="mt-6">
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                        <span className="text-sm text-gray-600">Ontbijt</span>
                      </div>
                      {selectedBoardOption === "halfboard" && (
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                          <span className="text-sm text-gray-600">Avondeten</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#2C4A3C]" />
                      <span className="text-sm text-gray-600">
                        Totaal {adults + children} gasten
                      </span>
                    </div>
                  </div>
                </div>
                {nightIdx < selectedArrangement.night_details.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center w-16">
                    {travelMode === "walking" ? (
                      <div className="w-6 h-6 text-[#2C4A3C]" />
                    ) : (
                      <Bike className="w-6 h-6 text-[#2C4A3C]" />
                    )}
                  </div>
                )}
                {nightIdx < selectedArrangement.night_details.length - 1 && (
                  <div className="lg:hidden flex justify-center h-16">
                    {travelMode === "walking" ? (
                      <div className="w-6 h-6 text-[#2C4A3C] self-center" />
                    ) : (
                      <Bike className="w-6 h-6 text-[#2C4A3C] self-center" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <OptionalExtras
          travelMode={travelMode}
          selectedOptionalProducts={selectedOptionalProducts}
          setSelectedOptionalProducts={setSelectedOptionalProducts}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-sm text-gray-500">Totale Prijs</div>
                <div className="text-2xl font-semibold">€ {totalPrice}</div>
                <div className="text-sm text-gray-500">Gemiddelde prijs € per nacht</div>
              </div>
              <button className="w-full sm:w-auto bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

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
    totalPrice: number
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

  // We'll still compute occupantPerRoom for your existing price calculation:
  const occupancyPerRoom = Math.ceil((adults + children) / rooms);

  // We'll track whether we've already done our "default occupant distribution"
  const [defaultDistributed, setDefaultDistributed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch configuration.
        const configRes = await fetchWithBaseUrl(
          `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangementLength}`
        );
        if (!configRes.ok) throw new Error("Failed to fetch configuration");
        const configData = await configRes.json();
        setRawConfig(configData.data.hotels);

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

  // ----- DISTRIBUTION LOGIC -----
  /**
   * distributeGuestsEvenly
   *
   * Distribute "count" guests as evenly as possible among chosenRooms,
   * respecting the leftover capacity in each room (room.bed_capacity - current occupant_countAdults - occupant_countChildren).
   *
   * Returns how many guests were actually placed (some might remain unplaced if no capacity).
   */
  function distributeGuestsEvenly(
    count: number,
    chosenRooms: any[],
    isAdult: boolean
  ): number {
    // Step 1: create naive even distribution array: e.g. if 5 guests & 2 rooms => [3,2].
    const n = chosenRooms.length;
    if (n === 0) return 0;

    let base = Math.floor(count / n);
    let remainder = count % n;
    // occupantWanted[i] is how many we'd ideally put in room i
    const occupantWanted = new Array(n).fill(0).map(() => base);

    for (let i = 0; i < n; i++) {
      if (remainder > 0) {
        occupantWanted[i] += 1;
        remainder--;
      }
    }

    // Step 2: We'll do a pass from i=0..n-1, placing occupantWanted[i] but capping by room capacity.
    let totalPlaced = 0;
    for (let i = 0; i < n; i++) {
      const room = chosenRooms[i];

      // current occupant usage
      const currentAdults = room.occupant_countAdults || 0;
      const currentChildren = room.occupant_countChildren || 0;

      // how many free spots are left in this room?
      const used = currentAdults + currentChildren;
      const capacityLeft = room.bed_capacity - used;
      if (capacityLeft <= 0) {
        // can't place any here
        occupantWanted[i] = 0;
        continue;
      }

      const toPlace = Math.min(occupantWanted[i], capacityLeft);
      occupantWanted[i] = toPlace;
    }

    // Step 3: If we have leftover occupantWanted in room i that doesn't fit, push it to next room, etc.
    //   (like a chain "overflow" approach).
    for (let i = 0; i < n; i++) {
      let overflow = occupantWanted[i];
      // occupantWanted[i] is how many we want to place in the local room (after capacity check).
      // But we might still need to do the chain pass to see if we can pass any leftover if we can't place here...
      // Actually, we already did min(...) with capacity. So occupantWanted[i] should be guaranteed to fit in this room.
      // So there's no overflow to push forward from i. We'll do the next step for correctness if we were to do a second pass.
      let capacityLeftHere = chosenRooms[i].bed_capacity - (chosenRooms[i].occupant_countAdults || 0) - (chosenRooms[i].occupant_countChildren || 0);
      if (overflow > capacityLeftHere) {
        // if occupantWanted[i] > capacityLeftHere => we place only capacityLeftHere, the rest we pass forward
        occupantWanted[i] = capacityLeftHere;
        let passOn = overflow - capacityLeftHere;
        // forward pass
        for (let j = i + 1; j < n && passOn > 0; j++) {
          let free = chosenRooms[j].bed_capacity - ((chosenRooms[j].occupant_countAdults || 0) + (chosenRooms[j].occupant_countChildren || 0) + occupantWanted[j]);
          if (free <= 0) continue;
          let moveHere = Math.min(free, passOn);
          occupantWanted[j] += moveHere;
          passOn -= moveHere;
        }
        occupantWanted[i] = capacityLeftHere;
      }
    }

    // Step 4: Actually apply occupantWanted[i] to each room
    for (let i = 0; i < n; i++) {
      const room = chosenRooms[i];
      let existingAdults = room.occupant_countAdults || 0;
      let existingChildren = room.occupant_countChildren || 0;

      if (isAdult) {
        room.occupant_countAdults = existingAdults + occupantWanted[i];
        totalPlaced += occupantWanted[i];
      } else {
        room.occupant_countChildren = existingChildren + occupantWanted[i];
        totalPlaced += occupantWanted[i];
      }
    }
    return totalPlaced;
  }

  // useEffect to do the occupant distribution on first load (or on boardOption toggle).
  useEffect(() => {
    if (!selectedArrangement || defaultDistributed) return;
    if (!selectedArrangement.night_details) return;

    const updated = { ...selectedArrangement };

    // For each night, if multiple rooms, distribute adults & children
    updated.night_details.forEach((night: any) => {
      const chosenRooms = night.chosen_rooms || [];
      if (chosenRooms.length < 2) {
        // Single room => no distribution needed, but ensure occupant_count is at least 0
        chosenRooms.forEach((r: any) => {
          if (r.occupant_countAdults === undefined) r.occupant_countAdults = 0;
          if (r.occupant_countChildren === undefined) r.occupant_countChildren = 0;
        });
        return;
      }
      // Reset occupant counts
      chosenRooms.forEach((r: any) => {
        if (r.occupant_countAdults === undefined) r.occupant_countAdults = 0;
        if (r.occupant_countChildren === undefined) r.occupant_countChildren = 0;
      });

      // 1) Distribute adults
      const placedAdults = distributeGuestsEvenly(adults, chosenRooms, true);

      // 2) Distribute children (some rooms may have less leftover bed_capacity now after the adult pass)
      distributeGuestsEvenly(children, chosenRooms, false);

      // It's possible we haven't placed all if rooms are at capacity,
      // user will see warnings about unassigned guests, which is expected behavior.
    });

    setSelectedArrangement(updated);
    setDefaultDistributed(true);
  }, [selectedArrangement, defaultDistributed, adults, children]);

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
    const arrangementForOption = arrangements[option];
    if (arrangementForOption) {
      // Re-do occupant distribution next time we load
      setDefaultDistributed(false);
      setSelectedArrangement(arrangementForOption);
    }
  };

  // Helper: Lookup product price from config.
  const getProductPrice = (hotelKey: string, productName: string, config: any) => {
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
        (p: any) => p.Name["en-GB"] === productName && p.Prices && p.Prices["EUR"]
      );
      if (product) return product.Prices["EUR"];
    }
    return 0;
  };

  // Helper: Get room category details (name and image URL) from config.
  const getCategoryDetails = (
    hotelKey: string,
    categoryId: string,
    config: any
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
    occupancy: number
  ) => {
    if (!pricingData) return "N/A";
    const key = boardType === "HB" ? "halfBoard" : "breakfast";
    if (!pricingData[key] || !pricingData[key].nightlyPricing) return "N/A";
    const record = pricingData[key].nightlyPricing.find(
      (item: any) => item.hotel === hotelKey && item.date === date
    );
    if (record && record.pricing && record.pricing.CategoryPrices) {
      const catPrice = record.pricing.CategoryPrices.find(
        (cp: any) => cp.CategoryId === categoryId
      );
      if (catPrice && catPrice.OccupancyPrices) {
        let candidate = null;
        let candidateTotal = 0;
        for (const occ of catPrice.OccupancyPrices) {
          const total = occ.Occupancies.reduce(
            (sum: number, o: any) => sum + o.PersonCount,
            0
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

  // Calculate total price (unchanged logic).
  const calculateTotalPrice = (
    optimalSequence: any,
    pricingData: any,
    travelMode: string,
    adults: number,
    children: number,
    rooms: number,
    config: any,
    selectedOptionalProducts: { [key: string]: boolean }
  ) => {
    let total = 0;
    const nights = optimalSequence.night_details;
    const occupancy = Math.ceil((adults + children) / rooms);
    nights.forEach((night: any) => {
      night.chosen_rooms.forEach((room: any) => {
        // For now, we still rely on occupant_count-based logic from your old approach
        const priceStr = getPriceForNight(
          night.hotel,
          night.date,
          room.category_id,
          night.board_type,
          travelMode,
          pricingData,
          occupancyPerRoom
        );
        const price = parseFloat(priceStr.split(" ")[0]) || 0;
        total += price;
      });

      // Optional products
      if (selectedOptionalProducts.lunch) {
        const lunchPrice = getProductPrice(night.hotel, productNames.lunch, config);
        total += lunchPrice * (adults + children);
      }
      if (travelMode === "cycling") {
        if (selectedOptionalProducts.bicycleRent) {
          const rentPrice = getProductPrice(
            night.hotel,
            productNames.bicycleRent,
            config
          );
          total += rentPrice * (adults + children);
        }
        if (selectedOptionalProducts.bicycleTransport) {
          const transportPrice = getProductPrice(
            night.hotel,
            productNames.bicycleTransport,
            config
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
        selectedOptionalProducts
      )
    : 0;

  // Summation helpers
  const sumNightAdults = (night: any) => {
    return night.chosen_rooms.reduce((acc: number, room: any) => {
      return acc + (room.occupant_countAdults || 0);
    }, 0);
  };
  const sumNightChildren = (night: any) => {
    return night.chosen_rooms.reduce((acc: number, room: any) => {
      return acc + (room.occupant_countChildren || 0);
    }, 0);
  };

  // Increment occupant_countAdults
  const handleRoomAdultChange = (
    nightIndex: number,
    roomIndex: number,
    delta: number
  ) => {
    if (!selectedArrangement) return;
    const updated = { ...selectedArrangement };
    const night = updated.night_details[nightIndex];
    const room = night.chosen_rooms[roomIndex];

    if (room.occupant_countAdults === undefined) {
      room.occupant_countAdults = 0;
    }
    const newVal = room.occupant_countAdults + delta;
    if (newVal < 0) return;

    // Check total adult cap
    const existingSum = sumNightAdults(night);
    if (existingSum + delta > adults) return;

    // Check bed capacity
    const currentChildren = room.occupant_countChildren || 0;
    if (newVal + currentChildren > room.bed_capacity) return;

    room.occupant_countAdults = newVal;
    setSelectedArrangement(updated);
  };

  // Increment occupant_countChildren
  const handleRoomChildChange = (
    nightIndex: number,
    roomIndex: number,
    delta: number
  ) => {
    if (!selectedArrangement) return;
    const updated = { ...selectedArrangement };
    const night = updated.night_details[nightIndex];
    const room = night.chosen_rooms[roomIndex];

    if (room.occupant_countChildren === undefined) {
      room.occupant_countChildren = 0;
    }
    const newVal = room.occupant_countChildren + delta;
    if (newVal < 0) return;

    // Check total child cap
    const existingSum = sumNightChildren(night);
    if (existingSum + delta > children) return;

    // Check bed capacity
    const currentAdults = room.occupant_countAdults || 0;
    if (newVal + currentAdults > room.bed_capacity) return;

    room.occupant_countChildren = newVal;
    setSelectedArrangement(updated);
  };

  // Helper: map optional products
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
        {travelMode === "walking" ? "Walking Arrangement" : "Cycling Arrangement"} –{" "}
        {selectedBoardOption === "halfBoard" ? "Half Board" : "Breakfast Only"}
      </h2>

      {selectedArrangement.night_details.map((night: any, nightIdx: number) => {
        const assignedAdults = sumNightAdults(night);
        const assignedChildren = sumNightChildren(night);

        return (
          <div key={nightIdx} className="border p-4 rounded mb-4">
            <p>
              <strong>Date:</strong> {night.date}
            </p>
            <p>
              <strong>Hotel:</strong> {night.hotel}
            </p>
            <p>
              <strong>Board Type:</strong> {night.board_type}{" "}
              {selectedBoardOption === "halfBoard"
                ? night.restaurant_chosen
                  ? `- Dinner at ${night.restaurant_chosen}`
                  : "- Dinner at hotel"
                : ""}
            </p>

            {/* Chosen Rooms */}
            <div className="mt-2">
              <strong>Chosen Rooms</strong>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {night.chosen_rooms.map((room: any, roomIdx: number) => {
                  if (room.occupant_countAdults === undefined) {
                    room.occupant_countAdults = 0;
                  }
                  if (room.occupant_countChildren === undefined) {
                    room.occupant_countChildren = 0;
                  }

                  const details = getCategoryDetails(
                    night.hotel,
                    room.category_id,
                    rawConfig
                  );
                  const priceStr = getPriceForNight(
                    night.hotel,
                    night.date,
                    room.category_id,
                    night.board_type,
                    travelMode,
                    pricingData,
                    occupancyPerRoom
                  );

                  return (
                    <div key={roomIdx} className="border rounded p-2">
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

                      {/* occupant distribution if multiple rooms */}
                      {rooms > 1 && (
                        <div className="mt-2 space-y-2">
                          {adults > 0 && (
                            <div className="flex items-center gap-2">
                              <span>Adults:</span>
                              <button
                                onClick={() =>
                                  handleRoomAdultChange(nightIdx, roomIdx, -1)
                                }
                                className="px-2 border"
                              >
                                -
                              </button>
                              <span>{room.occupant_countAdults}</span>
                              <button
                                onClick={() =>
                                  handleRoomAdultChange(nightIdx, roomIdx, 1)
                                }
                                className="px-2 border"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {children > 0 && (
                            <div className="flex items-center gap-2">
                              <span>Children:</span>
                              <button
                                onClick={() =>
                                  handleRoomChildChange(nightIdx, roomIdx, -1)
                                }
                                className="px-2 border"
                              >
                                -
                              </button>
                              <span>{room.occupant_countChildren}</span>
                              <button
                                onClick={() =>
                                  handleRoomChildChange(nightIdx, roomIdx, 1)
                                }
                                className="px-2 border"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Occupant distribution warnings for this night */}
              {rooms > 1 && (
                <div className="mt-2 text-sm text-red-600">
                  {assignedAdults < adults && (
                    <p>
                      {adults - assignedAdults} adult
                      {adults - assignedAdults !== 1 ? "s" : ""} not assigned to
                      any room yet!
                    </p>
                  )}
                  {assignedChildren < children && (
                    <p>
                      {children - assignedChildren} child
                      {children - assignedChildren !== 1 ? "ren" : ""} not
                      assigned to any room yet!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Alternative Options */}
            <div className="mt-4">
              <strong>Alternative Options:</strong>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {night.room_options.map((option: any, optIdx: number) => {
                  const details = getCategoryDetails(
                    night.hotel,
                    option.category_id,
                    rawConfig
                  );
                  const altPrice = getPriceForNight(
                    night.hotel,
                    night.date,
                    option.category_id,
                    night.board_type,
                    travelMode,
                    pricingData,
                    occupancyPerRoom
                  );
                  return (
                    <div
                      key={optIdx}
                      className="border rounded p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        // Replace chosen_rooms with single 'option' across all rooms for that night.
                        const updated = { ...selectedArrangement };
                        updated.night_details[nightIdx].chosen_rooms =
                          updated.night_details[nightIdx].chosen_rooms.map(
                            () => option
                          );
                        setSelectedArrangement(updated);
                        setDefaultDistributed(false); // force re-distribution logic next time if needed
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
        );
      })}

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
              travelMode: bookingData.travelMode,
            };
            onContinue(finalArrangement, pricingData, rawConfig, computedTotalPrice);
          }}
        >
          Continue to Confirmation
        </Button>
      </div>
    </div>
  );
};

export default RoomSelection;

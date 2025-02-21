import React, { useEffect, Fragment, useState } from "react";
import { MealPlanToggle } from "./MealPlanToggle";
import { DateColumn } from "./DateColumn";
import { OptionalExtras } from "./OptionalExtras";
import { PricingSummary } from "./PricingSummary";
import axios from "axios";
import { fetchWithBaseUrl } from "@/lib/utils";
import { Bike } from "lucide-react";

// Define product names used in pricing lookups.
const productNames = {
  breakfast: "Breakfast (Package)",
  lunch: "Lunch package",
  koffernabreng: "Koffernabreng",
  bicycleRent: "Bicylce renting",
  bicycleTransport: "Bicycle transport cost",
};

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

const ageCategoryMapping: Record<string, { adult: string; child: string }> = {
  hotel1: {
    adult: "32e02e9a-53c9-439a-8718-ae7000f2f342",
    child: "73435727-9f3a-49b7-ab8f-ae7000f2f342",
  },
  hotel2: {
    adult: "8bedb859-a9f1-40fb-aec6-b18e00f698c2",
    child: "2062df74-bcb4-4ee3-99ef-b18e00f698cc",
  },
  hotel3: {
    adult: "46d0861f-5e49-4a2e-b37e-b18d00d33c13",
    child: "4212c88e-c280-4b65-a69f-b18d00d33c28",
  },
};

function getNightlyRateId(
  hotel: string,
  boardType: string, // "HB" or "B&B"
  travelMode: string,
) {
  const board = boardType === "HB" ? "halfboard" : "breakfast";
  const map: any = {
    hotel1: {
      walking: {
        halfboard: "8800eb6d-0e04-4050-abfc-ae7000f2f347",
        breakfast: "a5687667-ba3d-40f3-9380-b27b016a290e",
      },
      cycling: {
        halfboard: "7054672b-5324-474c-a71b-b27b016ad183",
        breakfast: "bfae17fd-d945-4b3d-b27f-b27c015254dd",
      },
    },
    hotel2: {
      walking: {
        halfboard: "acef6be3-5594-4056-99c1-b27c0153f853",
        breakfast: "8d65cfbd-c721-4f5c-a355-b18e00f698e0",
      },
      cycling: {
        halfboard: "f3efa627-9b59-4c39-baaa-b27c01584870",
        breakfast: "8217396f-8db5-4e32-a69b-b27c01586992",
      },
    },
    hotel3: {
      walking: {
        halfboard: "4b1be4b2-0699-42aa-bdbb-b27f00e382fb",
        breakfast: "d10f8d15-4b06-4ea1-aa2a-b27f00e16550",
      },
      cycling: {
        halfboard: "c00bb42d-20d1-4df6-a56f-b27f00e3e778",
        breakfast: "1186693d-57b7-41a2-9080-b27f00e3c985",
      },
    },
  };
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  return map[hotel]?.[mode]?.[board] || "";
}

function getPriceForNight(
  hotelKey: string,
  date: string,
  categoryId: string,
  boardType: string, // "HB" or "B&B"
  travelMode: string,
  pricingData: any,
  room: any, // contains occupant_countAdults, occupant_countChildren, bed_capacity...
): string {
  if (!pricingData) return "N/A";
  const dataKey = boardType === "HB" ? "halfBoard" : "breakfast";
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
  // occupant array
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

  // find occupantPriceEntry
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
      const sum = op.Occupancies.reduce(
        (acc: number, x: any) => acc + x.PersonCount,
        0,
      );
      return sum === occupantTotal;
    });
  }
  if (!occupantPriceEntry) return "N/A";

  const rateId = getNightlyRateId(hotelKey, boardType, travelMode);
  const rPrice = occupantPriceEntry.RateGroupPrices.find(
    (rgp: any) => rgp.MinRateId === rateId,
  );
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
): number {
  if (!nightlyPricing?.CategoryPrices) return 0;
  const cat = nightlyPricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === room.category_id,
  );
  if (!cat) return 0;

  const occupantAdults = room.occupant_countAdults || 0;
  const occupantChildren = room.occupant_countChildren || 0;
  const occupantTotal = occupantAdults + occupantChildren;

  // occupant array
  const occupantArray: any[] = [];
  if (occupantAdults > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.adult,
      PersonCount: occupantAdults,
    });
  }
  if (occupantChildren > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.child,
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
      const sum = op.Occupancies.reduce(
        (acc: number, x: any) => acc + x.PersonCount,
        0,
      );
      return sum === occupantTotal;
    });
  }
  if (!occupantPriceEntry) return 0;

  const rateId = getNightlyRateId(hotel, boardType, travelMode);
  const rPrice = occupantPriceEntry.RateGroupPrices.find(
    (rgp: any) => rgp.MinRateId === rateId,
  );
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
  getProductPriceFn: (
    hotelKey: string,
    productName: string,
    config: any,
  ) => number,
): number {
  if (!arrangement?.night_details) return 0;
  let total = 0;
  for (const night of arrangement.night_details) {
    const boardKey = night.board_type === "HB" ? "halfBoard" : "breakfast";
    const nightlyArr = pricingDataObj[boardKey]?.nightlyPricing || [];
    const foundEntry = nightlyArr.find(
      (x: any) => x.date === night.date && x.hotel === night.hotel,
    );
    if (!foundEntry) continue;

    // occupant-based sum for all chosen rooms
    let nightRoomSum = 0;
    for (const room of night.chosen_rooms) {
      nightRoomSum += getPriceForSingleRoom(
        foundEntry.pricing,
        night.hotel,
        night.board_type,
        travelMode,
        room,
      );
    }
    total += nightRoomSum;

    // optional products
    const assignedAdults = sumNightAdultsFn(night);
    const assignedChildren = sumNightChildrenFn(night);

    if (selectedOptionalProducts.lunch) {
      const lunchPrice = getProductPriceFn(
        night.hotel,
        productNames.lunch,
        config,
      );
      total += lunchPrice * (assignedAdults + assignedChildren);
    }
    if (travelMode === "cycling") {
      if (selectedOptionalProducts.bicycleRent) {
        const rentPrice = getProductPriceFn(
          night.hotel,
          productNames.bicycleRent,
          config,
        );
        total += rentPrice * (assignedAdults + assignedChildren);
      }
      if (selectedOptionalProducts.bicycleTransport) {
        const transportPrice = getProductPriceFn(
          night.hotel,
          productNames.bicycleTransport,
          config,
        );
        total += transportPrice;
      }
    }
  }
  return total;
}

export const RoomPicker: React.FC<RoomPickerProps> = ({
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

  // Local board option
  const [selectedBoardOption, setSelectedBoardOption] = useState<
    "breakfast" | "halfboard"
  >(bookingData.boardOption);

  const { startDate, arrangementLength, rooms, adults, children, travelMode } =
    bookingData;

  const [day, month, year] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = startDate;

  // occupantPerRoom from older references
  const occupancyPerRoom = Math.ceil((adults + children) / rooms);

  const [defaultDistributed, setDefaultDistributed] = useState(false);

  // fetch config + availability + pricing
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

  function distributeGuestsEvenly(
    count: number,
    chosenRooms: any[],
    isAdult: boolean,
  ): number {
    const n = chosenRooms.length;
    if (n === 0) return 0;

    const base = Math.floor(count / n);
    let remainder = count % n;
    const occupantWanted = new Array(n).fill(0).map(() => base);
    for (let i = 0; i < n; i++) {
      if (remainder > 0) {
        occupantWanted[i] += 1;
        remainder--;
      }
    }

    let totalPlaced = 0;
    // cap occupantWanted by capacity
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
        room.occupant_countAdults =
          (room.occupant_countAdults || 0) + occupantWanted[i];
      } else {
        room.occupant_countChildren =
          (room.occupant_countChildren || 0) + occupantWanted[i];
      }
      totalPlaced += occupantWanted[i];
    }
    return totalPlaced;
  }

  useEffect(() => {
    if (!selectedArrangement || defaultDistributed) return;
    if (!selectedArrangement.night_details) return;

    const updated = { ...selectedArrangement };
    updated.night_details.forEach((night: any) => {
      const chosenRooms = night.chosen_rooms || [];
      if (chosenRooms.length < 2) {
        chosenRooms.forEach((r: any) => {
          if (r.occupant_countAdults === undefined) r.occupant_countAdults = 0;
          if (r.occupant_countChildren === undefined)
            r.occupant_countChildren = 0;
        });
        return;
      }
      // reset occupant counts
      chosenRooms.forEach((r: any) => {
        r.occupant_countAdults = 0;
        r.occupant_countChildren = 0;
      });
      // distribute adults
      distributeGuestsEvenly(adults, chosenRooms, true);
      // distribute children
      distributeGuestsEvenly(children, chosenRooms, false);
    });

    setSelectedArrangement(updated);
    setDefaultDistributed(true);
  }, [selectedArrangement, defaultDistributed, adults, children]);

  const toggleOptionalProduct = (key: string) => {
    setSelectedOptionalProducts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleBoardToggle = (option: "breakfast" | "halfboard") => {
    setSelectedBoardOption(option);
    const arrangementForOption = arrangements[option];
    if (arrangementForOption) {
      setDefaultDistributed(false);
      setSelectedArrangement(arrangementForOption);
    }
  };

  const sumNightAdults = (night: any) =>
    night.chosen_rooms.reduce(
      (acc: number, r: any) => acc + (r.occupant_countAdults || 0),
      0,
    );

  const sumNightChildren = (night: any) =>
    night.chosen_rooms.reduce(
      (acc: number, r: any) => acc + (r.occupant_countChildren || 0),
      0,
    );

  const handleRoomAdultChange = (
    nightIndex: number,
    roomIndex: number,
    delta: number,
  ) => {
    if (!selectedArrangement) return;
    const updated = { ...selectedArrangement };
    const night = updated.night_details[nightIndex];
    const room = night.chosen_rooms[roomIndex];
    if (room.occupant_countAdults == null) {
      room.occupant_countAdults = 0;
    }
    const newVal = room.occupant_countAdults + delta;
    if (newVal < 0) return;

    const existingSum = sumNightAdults(night);
    if (existingSum + delta > adults) return;

    const c = room.occupant_countChildren || 0;
    if (newVal + c > room.bed_capacity) return;

    room.occupant_countAdults = newVal;
    setSelectedArrangement(updated);
  };

  const handleRoomChildChange = (
    nightIndex: number,
    roomIndex: number,
    delta: number,
  ) => {
    if (!selectedArrangement) return;
    const updated = { ...selectedArrangement };
    const night = updated.night_details[nightIndex];
    const room = night.chosen_rooms[roomIndex];
    if (room.occupant_countChildren == null) {
      room.occupant_countChildren = 0;
    }
    const newVal = room.occupant_countChildren + delta;
    if (newVal < 0) return;

    const existingSum = sumNightChildren(night);
    if (existingSum + delta > children) return;

    const a = room.occupant_countAdults || 0;
    if (newVal + a > room.bed_capacity) return;

    room.occupant_countChildren = newVal;
    setSelectedArrangement(updated);
  };

  const getProductPriceFn = (
    hotelKey: string,
    productName: string,
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
      const products = raw.Configurations[0].Enterprise.Products || [];
      const product = products.find(
        (p: any) =>
          p.Name["en-GB"] === productName && p.Prices && p.Prices["EUR"],
      );
      if (product) return product.Prices["EUR"];
    }
    return 0;
  };

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

  // occupant-based final total
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
        sumNightAdults,
        sumNightChildren,
        getProductPriceFn,
      )
    : 0;

  // Build optional product mapping
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
    <main className="min-h-screen w-full bg-gray-50 pb-32" data-prototypeId="2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <img
            src="https://placehold.co/200x60?text=Hotel+Chain+Logo"
            alt="Hotel Chain Logo"
            className="h-12 mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#2C4A3C] mb-6">
            Your Arrangement
          </h1>
          <MealPlanToggle
            selected={selectedBoardOption}
            onChange={handleBoardToggle}
          />
        </div>
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {selectedArrangement.night_details.map(
            (night: any, nightIdx: number) => {
              const assignedAdults = sumNightAdults(night);
              const assignedChildren = sumNightChildren(night);
              return (
                <Fragment key={night}>
                  <DateColumn
                    date={night}
                    mealPlan={selectedBoardOption}
                    totalGuests={assignedAdults + assignedChildren}
                    roomsCount={night.chosen_rooms.length}
                    hotel={night.hotel}
                    onRoomSelect={(roomType) =>
                      setSelectedRoom({
                        type: roomType,
                        hotelName: night.hotel.name,
                      })
                    }
                  />
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
                </Fragment>
              );
            },
          )}
        </div>
        <OptionalExtras />
        <PricingSummary
          nights={selectedArrangement.night_details.length - 1}
          mealPlan={selectedBoardOption}
        />
      </div>
    </main>
  );
};

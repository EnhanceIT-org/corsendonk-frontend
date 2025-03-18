import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Coffee, UtensilsCrossed, Plus, Minus, Info } from "lucide-react";
import { ageCategoryMapping } from "@/mappings/mappings";

interface DateColumnProps {
  date: string;
  mealPlan: "breakfast" | "halfboard";
  roomsCount: number;
  hotel: string;
  roomTypes: [
    {
      category_id: string;
      category_name: string;
      room_group: string;
      available_count: number;
      bed_capacity: number;
    },
  ];
  pricingData: any;
  travelMode: "walking" | "cycling";
  onRoomSelect: (option: any) => void;
  nightIdx: number;
  setPricesPerNight: React.Dispatch<React.SetStateAction<number[]>>;
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
  const occupantAdults = adults || 0;
  const occupantChildren = children || 0;
  const occupantTotal = occupantAdults + occupantChildren;

  if (occupantTotal === 0) {
    return -1;
  }

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
  if (typeof val === "number") {
    return val;
  }
  return 0;
}

function formatDutchDate(dateString: string) {
  const raw = format(new Date(dateString), "EEEE, d MMMM", { locale: nl });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

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

export function DateColumn({
  date,
  mealPlan,
  roomsCount,
  hotel,
  roomTypes,
  travelMode,
  pricingData,
  onRoomSelect,
  nightIdx,
  setPricesPerNight,
}: DateColumnProps) {
  const [totalPrice, setTotalPrice] = useState<number[]>(
    Array(roomsCount).fill(0),
  );
  const [selectedRooms, setSelectedRooms] = useState(
    Array.from({
      length: roomsCount,
    }).map(() => ({ selectedRoom: roomTypes[0] })),
  );
  const [amountOfChildren, setAmountOfChildren] = useState(
    Array.from({ length: roomsCount }, () => 0),
  );

  const [amountOfAdults, setAmountOfAdults] = useState(
    Array.from({ length: roomsCount }, () => 1),
  );

  const [errorMessages, setErrorMessages] = useState(
    Array(selectedRooms.length).fill(""),
  );

  console.log(nightIdx);

  useEffect(() => {
    setPricesPerNight((prev: number[]) => {
      let prijs = 0;
      for (const room of totalPrice) {
        prijs += room;
      }
      return prev.map((price, i) => (i === nightIdx ? prijs : price));
    });
  }, [totalPrice, nightIdx]);

  const handleIncrease = (type, index) => {
    setAmountOfAdults((prev) =>
      prev.map((item, i) =>
        i === index ? item + (type === "adult" ? 1 : 0) : item,
      ),
    );
    setAmountOfChildren((prev) =>
      prev.map((item, i) =>
        i === index ? item + (type === "child" ? 1 : 0) : item,
      ),
    );
  };

  const handleDecrease = (type, index) => {
    setErrorMessages((prev) => prev.map((msg, i) => (i === index ? "" : msg)));
    setAmountOfAdults((prev) =>
      prev.map((item, i) =>
        i === index ? Math.max(0, item - (type === "adult" ? 1 : 0)) : item,
      ),
    );
    setAmountOfChildren((prev) =>
      prev.map((item, i) =>
        i === index ? Math.max(0, item - (type === "child" ? 1 : 0)) : item,
      ),
    );
  };

  const handleGuestChange = (type, index) => {
    const totalGuests = amountOfAdults[index] + amountOfChildren[index];
    const roomCapacity = selectedRooms[index].selectedRoom.bed_capacity;

    if (totalGuests >= roomCapacity) {
      setErrorMessages((prev) =>
        prev.map((msg, i) =>
          i === index ? `Er is een maxium van ${roomCapacity} personen` : msg,
        ),
      );
    } else {
      setErrorMessages((prev) =>
        prev.map((msg, i) => (i === index ? "" : msg)),
      );
      handleIncrease(type, index);
    }
  };

  const handleRoomChange = (index, room) => {
    setSelectedRooms((prev) =>
      prev.map((item, i) => (i === index ? { selectedRoom: room } : item)),
    );
    const nightlyArr = pricingData[mealPlan]?.nightlyPricing || [];
    const foundEntry = nightlyArr.find(
      (x: any) => x.date === date && x.hotel === hotel,
    );
    if (!foundEntry) return "Price not available"; // Prevents rendering errors

    const selectedRoom = selectedRooms[index]?.selectedRoom || null;
    const children = amountOfChildren[index] || null;
    const adults = amountOfAdults[index] || null;
    const prijs = getPriceForSingleRoom(
      foundEntry.pricing,
      hotel,
      mealPlan,
      travelMode,
      selectedRoom,
      children,
      adults,
    );
    setTotalPrice((prev) =>
      prev.map((price, i) => (i === index ? prijs : price)),
    );
  };
  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
      {/* Date header */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-medium text-[#2C4A3C]">
          {formatDutchDate(date)}
        </h2>
      </div>
      {/* Hotel info */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#2C4A3C]">{hotel}</h3>
      </div>
      {/* Room selection */}
      <div className="space-y-6">
        {Array.from({
          length: roomsCount,
        }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4">
            {errorMessages[index] && (
              <p className="text-red-500 text-sm mt-2">
                {errorMessages[index]}
              </p>
            )}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-[#2C4A3C]">Room {index + 1}</h4>
              </div>
              {/* Room type selector */}
              <div className="flex flex-col gap-2">
                <select
                  className="w-full text-sm border rounded-md px-2 py-1.5 bg-white"
                  value={selectedRooms[index].selectedRoom.category_name || ""}
                  onChange={(e) => {
                    onRoomSelect(
                      roomTypes.find((r) => r.category_name === e.target.value),
                    );
                    handleRoomChange(
                      index,
                      roomTypes.find((r) => r.category_name === e.target.value),
                    );
                  }}
                >
                  {roomTypes.map((room) => (
                    <option key={room.category_id} value={room.category_name}>
                      {room.category_name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    {(() => {
                      const nightlyArr =
                        pricingData[mealPlan]?.nightlyPricing || [];
                      const foundEntry = nightlyArr.find(
                        (x: any) => x.date === date && x.hotel === hotel,
                      );
                      if (!foundEntry) return "Price not available"; // Prevents rendering errors

                      const selectedRoom =
                        selectedRooms[index]?.selectedRoom || null;
                      const children = amountOfChildren[index] || null;
                      const adults = amountOfAdults[index] || null;
                      const prijs = getPriceForSingleRoom(
                        foundEntry.pricing,
                        hotel,
                        mealPlan,
                        travelMode,
                        selectedRoom,
                        children,
                        adults,
                      );
                      return prijs === -1
                        ? "Prijs kan niet bepaald worden"
                        : `€${prijs} per nacht`;
                    })()}
                  </span>
                </div>
              </div>
              {/* Guest controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volwassenen</span>
                  <div className="flex items-center gap-3">
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => {
                        handleDecrease("adult", index);
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">
                      {amountOfAdults[index]}
                    </span>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => {
                        handleGuestChange("adult", index);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kinderen</span>
                  <div className="flex items-center gap-3">
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={() => {
                        handleDecrease("child", index);
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">
                      {amountOfChildren[index]}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Plus
                        className="w-4 h-4"
                        onClick={() => {
                          handleGuestChange("child", index);
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Meal indicators */}
      <div className="mt-6 flex gap-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-[#2C4A3C]" />
          <span className="text-sm text-gray-600">Ontbijt</span>
        </div>
        {mealPlan === "halfboard" && (
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
            <span className="text-sm text-gray-600">Avondeten</span>
          </div>
        )}
      </div>
    </div>
  );
}

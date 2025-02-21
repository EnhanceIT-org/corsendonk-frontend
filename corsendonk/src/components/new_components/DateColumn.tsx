import React, { Children } from "react";
import { format } from "date-fns";
import { Coffee, UtensilsCrossed, Plus, Minus, Info } from "lucide-react";
interface DateColumnProps {
  date: string;
  mealPlan: "breakfast" | "halfboard";
  totalGuests: {
    adults: number;
    children: number;
  };
  roomsCount: number;
  hotel: {
    name: string;
    location: string;
  };
  onRoomSelect: (roomType: string) => void;
}
const roomTypes = {
  "Deluxe Room": {
    price: 199,
    available: 3,
  },
  "Superior Room": {
    price: 299,
    available: 2,
  },
  Suite: {
    price: 399,
    available: 1,
  },
};
export function DateColumn({
  date,
  mealPlan,
  totalGuests,
  roomsCount,
  hotel,
  onRoomSelect,
}: DateColumnProps) {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
      {/* Date header */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-medium text-[#2C4A3C]">
          {format(new Date(date), "EEE, MMM d")}
        </h2>
      </div>
      {/* Hotel info */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#2C4A3C]">{hotel.name}</h3>
        <p className="text-sm text-gray-500">{hotel.location}</p>
      </div>
      {/* Room selection */}
      <div className="space-y-6">
        {Array.from({
          length: roomsCount,
        }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-[#2C4A3C]">Room {index + 1}</h4>
                <button
                  className="text-[#2C4A3C] hover:text-[#2C4A3C]/80 ml-2"
                  onClick={() => onRoomSelect("Deluxe Room")}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              {/* Room type selector */}
              <div className="flex flex-col gap-2">
                <select
                  className="w-full text-sm border rounded-md px-2 py-1.5 bg-white"
                  onChange={(e) => onRoomSelect(e.target.value)}
                >
                  {Object.entries(roomTypes).map(
                    ([type, { price, available }]) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ),
                  )}
                </select>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>€199 per night</span>
                  <span>3 rooms left</span>
                </div>
              </div>
              {/* Guest controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Adults</span>
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">1</span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Children</span>
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">1</span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Plus className="w-4 h-4" />
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
          <span className="text-sm text-gray-600">Breakfast</span>
        </div>
        {mealPlan === "halfboard" && (
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
            <span className="text-sm text-gray-600">Dinner</span>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Coffee, UtensilsCrossed, Users, Info } from "lucide-react";
import { RoomDetailModal } from "./RoomDetailModal";
import { ageCategoryMapping, BoardMapping } from "@/mappings/mappings";

function getPriceForSingleRoom(
  nightlyPricing: any,
  hotel: string,
  boardType: string,
  room: any,
  reservation: any,
  travelMode: string,
): number {
  const nightlyArr = nightlyPricing?.nightlyPricing || [];
  const foundEntry = nightlyArr.find(
    (entry: any) => entry.date === reservation.date,
  );
  if (!foundEntry) return 0;
  console.log(foundEntry);
  if (!foundEntry?.pricing.CategoryPrices) return 0;
  const cat = foundEntry.pricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === room.category_id,
  );
  if (!cat) return 0;
  const occupantAdults = room.occupant_countAdults || 0;
  const occupantChildren = room.occupant_countChildren || 0;
  const occupantTotal = occupantAdults + occupantChildren;

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

function getNightlyRateId(
  hotel: string,
  boardType: string,
  travelMode: string,
) {
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  return BoardMapping[hotel]?.[mode]?.[boardType] || "";
}

function calculateTotalHumans(bookingData): number {
  let total = 0;
  bookingData.reservations[0].chosen_rooms.forEach((room: any) => {
    total += room.occupant_countAdults;
    total += room.occupant_countChildren;
  });
  return total;
}

export function BookingDetails({ bookingData }) {
  const [selectedRoom, setSelectedRoom] = useState<null | {
    type: string;
    hotelName: string;
  }>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Details van uw boeking</h2>
        {bookingData.reservations.map((reservation, index) => (
          <div
            key={index}
            className="border-b last:border-b-0 pb-6 mb-6 last:pb-0 last:mb-0"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-[#2C4A3C]">
                  {format(new Date(reservation.date), "EEE, MMM d", {
                    locale: nl,
                  })}
                </h3>
                <p className="text-sm text-gray-500">{reservation.hotel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                {bookingData.mealPlan === "halfboard" && (
                  <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                )}
              </div>
            </div>
            <div className="space-y-4">
              {reservation.chosen_rooms.map((room, roomIndex) => (
                <div key={roomIndex} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.category_name}</span>
                      <button
                        className="text-[#2C4A3C] hover:text-[#2C4A3C]/80"
                        onClick={() =>
                          setSelectedRoom({
                            type: room.category_name,
                            hotelName: room.hotel,
                          })
                        }
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-medium">
                      €
                      {getPriceForSingleRoom(
                        bookingData.pricing_data[bookingData.mealPlan],
                        reservation.hotel,
                        bookingData.mealPlan,
                        room,
                        reservation,
                        bookingData.travelMode,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {room.occupant_countAdults} Volwassenen,{" "}
                      {room.occupant_countChildren} Kinderen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Extras</h2>
        {bookingData.optionalExtras.lunch && (
          <div className="flex justify-between items-center mb-2">
            <span>Lunch</span>
            <span>
              €
              {15 *
                bookingData.reservations.length *
                calculateTotalHumans(bookingData)}
            </span>
          </div>
        )}
        {bookingData.optionalExtras.bicycleRent && (
          <div className="flex justify-between items-center">
            <span>Bicycle Rental</span>
            <span>
              €
              {25 *
                bookingData.reservations.length *
                calculateTotalHumans(bookingData)}
            </span>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Totaal</h2>
          </div>
          <span className="text-2xl font-semibold">€{bookingData.total}</span>
        </div>
      </div>
    </div>
  );
}

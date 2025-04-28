// components/new_components/BookingDetails.tsx
import React from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Coffee, UtensilsCrossed, Users, Info } from "lucide-react";
// Corrected import path and added optionalProducts import
import {
  ageCategoryMapping,
  BoardMapping,
  HOTEL_NAME_MAPPING,
  optionalProducts,
} from "../../mappings/mappings";

// Helper function to get Dutch charging method text (copied from RoomPicker for consistency)
function chargingMethodToDutch(method: string): string {
  switch (method) {
    case "Once":
      return "Eenmalig";
    case "PerPerson":
      return "Per persoon";
    case "PerPersonNight":
      return "Per persoon per nacht";
    default:
      return "";
  }
}

function getPriceForSingleRoom(
  nightlyPricing: any,
  hotel: string,
  boardType: string,
  room: any,
  reservation: any,
  travelMode: string,
  arrangementLength: number, // Added parameter
  restaurantChosen: string | null, // NEW: Add restaurant parameter
): number {
  const nightlyArr = nightlyPricing?.nightlyPricing ?? [];
  const foundEntry = nightlyArr.find(
    (entry: any) => entry.date === reservation.date,
  );
  if (!foundEntry) return 0;
  if (!foundEntry?.pricing.CategoryPrices) return 0;
  const cat = foundEntry.pricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === room.category_id,
  );
  if (!cat) return 0;
  const occupantAdults = room.occupant_countAdults ?? 0;
  const occupantChildren = room.occupant_countChildren ?? 0;
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
      (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
    );
    const sorted2 = occupantArray
      .slice()
      .sort((a, b) =>
        (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
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
  occupantPriceEntry ??= cat.OccupancyPrices.find((op: any) => {
    const sum = op.Occupancies.reduce(
      (acc: number, x: any) => acc + x.PersonCount,
      0,
    );
    return sum === occupantTotal;
  });
  if (!occupantPriceEntry) return 0;
  // NEW: Pass restaurantChosen to getNightlyRateId
  const rateId = getNightlyRateId(
    hotel,
    boardType,
    travelMode,
    arrangementLength,
    restaurantChosen,
  );
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
  boardTypeInput: string, // Renamed to avoid conflict with variable name
  travelMode: string,
  arrangementLength: number,
  restaurantChosen: string | null, // NEW: Add restaurant parameter
) {
  // Determine board key ('breakfast' or 'halfboard') from input ('breakfast' or 'halfboard')
  const board = boardTypeInput === "halfboard" ? "halfboard" : "breakfast";
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  const lengthKey = arrangementLength === 3 ? "3D" : "4D";

  let rateId = "";
  const hotelRates = BoardMapping[hotel]?.[mode]?.[lengthKey];

  if (hotelRates) {
    // NEW: Check for hotel3 halfboard with restaurant
    if (
      hotel === "hotel3" &&
      board === "halfboard" &&
      restaurantChosen &&
      (restaurantChosen === "Bink" || restaurantChosen === "Bardo")
    ) {
      rateId = hotelRates[board]?.[restaurantChosen] ?? "";
    } else {
      // Original logic for other hotels/boards or if restaurant is not applicable/provided
      // Ensure we access the correct board key ('breakfast' or 'halfboard')
      rateId = hotelRates[board] ?? "";
    }
  }

  return rateId;
}

function calculateTotalHumans(bookingData): number {
  let total = 0;
  bookingData.reservations[0].chosen_rooms.forEach((room: any) => {
    total += room.occupant_countAdults;
    total += room.occupant_countChildren;
  });
  return total;
}

function formatDutchDate(dateString: string) {
  const raw = format(new Date(dateString), "EEEE, d MMMM", { locale: nl });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// UPDATED: Added new prop onShowRoomDetail and removed local selectedRoom state.
interface BookingDetailsProps {
  bookingData: any; // Ensure this includes arrangementLength
  onShowRoomDetail: (room: any) => void;
}

function getHotelDisplayName(hotelKey: string): string {
  return HOTEL_NAME_MAPPING[hotelKey] ?? hotelKey; // Use mapping, fallback to key if not found
}

export function BookingDetails({
  bookingData,
  onShowRoomDetail,
}: Readonly<BookingDetailsProps>) {
  // Calculate City Tax
  const numberOfNights = bookingData.reservations.length;
  const firstNight = bookingData.reservations[0]; // Assume guest count is constant
  const totalGuests = firstNight.chosen_rooms.reduce((sum, room) => {
    return (
      sum +
      (room.occupant_countAdults ?? 0) +
      (room.occupant_countChildren ?? 0)
    );
  }, 0);
  const cityTaxAmount = totalGuests * numberOfNights * 2.5;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Details van uw boeking</h2>
        {bookingData.reservations.map((reservation, index) => {
          const boardKey =
            reservation.board_type === "HB" ? "halfboard" : "breakfast";

          const nightlyPricing = bookingData.pricing_data[boardKey];

          return (
            <div
              key={index}
              className="border-b last:border-b-0 pb-6 mb-6 last:pb-0 last:mb-0"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-[#2C4A3C]">
                    {formatDutchDate(reservation.date)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getHotelDisplayName(reservation.hotel)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                  {reservation.board_type === "HB" && (
                    <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {reservation.hotel === "hotel3" &&
                  reservation.board_type === "B&B" &&
                  bookingData.mealPlan === "halfboard" && (
                    <p className="mt-1 text-sm text-orange-600">
                      Externe restaurants volboekt, enkel ontbijt mogelijk
                    </p>
                  )}
                {reservation.chosen_rooms.map((room, roomIndex) => (
                  <div key={roomIndex} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {room.category_name}
                        </span>
                        <button
                          className="text-[#2C4A3C] hover:text-[#2C4A3C]/80"
                          onClick={() =>
                            onShowRoomDetail({
                              ...room,
                              hotel: reservation.hotel,
                            })
                          }
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-medium">
                        €
                        {getPriceForSingleRoom(
                          nightlyPricing,
                          reservation.hotel,
                          boardKey,
                          room,
                          reservation,
                          bookingData.travelMode,
                          bookingData.arrangementLength,
                          reservation.restaurant_chosen, // NEW: Pass restaurant_chosen
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {room.occupant_countAdults} Volwassenen,{" "}
                        {room.occupant_countChildren} Kinderen
                      </span>
                    </div>
                    {null /* Hide Selected Extras */}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Totaal</h2>
          </div>
          <span className="text-2xl font-semibold">
            €{bookingData.total.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 text-left">
          Exclusief toeristenbelasting van €{cityTaxAmount.toFixed(2)}, te
          voldoen in het hotel (€2,50 per persoon per nacht).
        </p>
      </div>
    </div>
  );
}

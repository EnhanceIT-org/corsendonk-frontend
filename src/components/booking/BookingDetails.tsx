// components/new_components/BookingDetails.tsx
import React from "react";
import { useTranslation } from "react-i18next"; // Import hook
import { format } from "date-fns";
import { nl, enUS, fr } from "date-fns/locale"; // Import required locales
import { Coffee, UtensilsCrossed, Users, Info } from "lucide-react";
// Corrected import path and added optionalProducts import
import {
  ageCategoryMapping,
  BoardMapping,
  HOTEL_NAME_MAPPING,
} from "../../mappings/mappings";

// Removed chargingMethodToDutch function - use t('chargingMethods...') instead

export function getPriceForSingleRoom(
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

function getLocale(language: string) {
  switch (language) {
    case "en":
      return enUS;
    case "fr":
      return fr;
    case "nl":
    default:
      return nl;
  }
}

function formatDateForLocale(dateString: string, currentLanguage: string) {
  const locale = getLocale(currentLanguage);
  const raw = format(new Date(dateString), "EEEE, d MMMM", { locale });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
// Removed formatDutchDate function

function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- OPTIONAL-PRODUCT HELPERS ----------
type ChargingMode = "Once" | "PerPerson" | "PerPersonNight";

export function getProductMeta(
  hotel: string,
  key: string,
  arrangementLength: 3 | 4,
  products: any,
) {
  if (!products?.[hotel]) return null;
  if (key === "lunch" || key === "huisdier") return products[hotel][key];
  if (products[hotel].bicycleRent) {
    const lenKey = arrangementLength === 3 ? "3D" : "2D";
    return products[hotel].bicycleRent?.[lenKey]?.[key] ?? null;
  }
  return null;
}


// UPDATED: Added new prop onShowRoomDetail and removed local selectedRoom state.
interface BookingDetailsProps {
  bookingData: any; // Ensure this includes arrangementLength
  onShowRoomDetail: (room: any) => void;
  optionalProducts: { [hotel: string]: any };
}

function getHotelDisplayName(hotelKey: string): string {
  return HOTEL_NAME_MAPPING[hotelKey] ?? hotelKey; // Use mapping, fallback to key if not found
}

export function BookingDetails({
  bookingData,
  onShowRoomDetail,
  optionalProducts,
}: Readonly<BookingDetailsProps>) {
  const { t, i18n } = useTranslation(); // Instantiate hook
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
        <h2 className="text-lg font-semibold mb-6">
          {t("bookingDetails.title", "Details of your booking")}
        </h2>
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
                    {formatDateForLocale(reservation.date, i18n.language)}
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
                      {t(
                        "bookingDetails.warning.externalRestaurantsFull",
                        "External restaurants fully booked, only breakfast possible",
                      )}
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
                        {t("bookingDetails.occupancy", {
                          adults: room.occupant_countAdults,
                          children: room.occupant_countChildren,
                          defaultValue: `${room.occupant_countAdults} Adults, ${room.occupant_countChildren} Children`,
                        })}
                      </span>
                    </div>
                    {(() => {
                    // collect selected extras across ALL rooms of this night
                    const extras: Record<string, number> = {};
                    reservation.chosen_rooms.forEach((r: any) => {
                      Object.entries(r.extras ?? {}).forEach(([k, v]: any) => {
                        if (v.selected && (v.amount ?? 0) > 0) {
                          extras[k] = (extras[k] ?? 0) + (v.amount || 1);
                        }
                      });
                    });
                    const keys = Object.keys(extras);
                    if (keys.length === 0) return null;

                    return (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t("bookingDetails.selectedExtras", "Selected extras")}
                        </h4>
                        <ul className="space-y-1">
                          {keys.map((k) => {
                            const meta = getProductMeta(
                              reservation.hotel,
                              k,
                              bookingData.arrangementLength as 3 | 4,
                              optionalProducts,
                            );
                            if (!meta) return null;

                            const { price, chargingMode } = meta as { price: number; chargingMode: ChargingMode };

                            // how many people sleep this night?
                            const guestsTonight = reservation.chosen_rooms.reduce(
                              (acc: number, r: any) =>
                                acc +
                                (r.occupant_countAdults ?? 0) +
                                (r.occupant_countChildren ?? 0),
                              0,
                            );

                            // ① units selected in UI (extras[k] is 1 for PerPerson / PerPersonNight)
                            // ② multiply by guests when the product is *not* “Once”
                            const quantity =
                              chargingMode === "Once" ? extras[k] : extras[k] * guestsTonight;

                            const lineTotal = price * quantity;

                            return (
                              <li key={k} className="flex justify-between text-sm">
                                <span>
                                  {t(`optionalProducts.${k.toLowerCase()}`, k)}
                                  {quantity > 1 ? ` ×${quantity}` : ""}
                                </span>
                                <span>€{lineTotal.toFixed(2)}</span>
                              </li>
                            );
                          })}
                        </ul>

                      </div>
                    );
                  })()}

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
            <h2 className="text-lg font-semibold">
              {t("common.total", "Total")}
            </h2>
          </div>
          <span className="text-2xl font-semibold">
            €{bookingData.total.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 text-left">
          {t("bookingDetails.cityTaxNote", {
            amount: cityTaxAmount.toFixed(2),
            rate: "2,50",
            defaultValue: `Excluding city tax of €${cityTaxAmount.toFixed(
              2,
            )}, payable at the hotel (€2.50 per person per night).`,
          })}
        </p>
      </div>
    </div>
  );
}

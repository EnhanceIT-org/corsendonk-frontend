
import React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { nl, enUS, fr } from "date-fns/locale";
import { Coffee, UtensilsCrossed, Users, Info } from "lucide-react";
import {
  HOTEL_NAME_MAPPING,
  lunchAdjustmentForChild6_12,
  lunchAdjustmentForChild3_5,
} from "../../mappings/mappings";
import { getPriceForSingleRoom } from "./pricing";


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

export function getProductMeta(
  hotel: string,
  key: string,
  arrangementLength: 3 | 4,
  products: any,
) {
  if (!products?.[hotel]) return null;
  if (key === "lunch" || key === "huisdier") return products[hotel][key];
  if (products[hotel].bicycleRent) {
    const lenKey = arrangementLength === 4 ? "3D" : "2D";
    return products[hotel].bicycleRent?.[lenKey]?.[key] ?? null;
  }
  return null;
}


interface BookingDetailsProps {
  bookingData: any; // Ensure this includes arrangementLength
  onShowRoomDetail: (room: any) => void;
  optionalProducts: { [hotel: string]: any };
}

function getHotelDisplayName(hotelKey: string): string {
  return HOTEL_NAME_MAPPING[hotelKey] ?? hotelKey;
}

export function BookingDetails({
  bookingData,
  onShowRoomDetail,
  optionalProducts,
}: Readonly<BookingDetailsProps>) {
  const { t, i18n } = useTranslation();
  // Calculate City Tax
  const numberOfNights = bookingData.reservations.length;
  const firstNight = bookingData.reservations[0]; // Assume guest count is constant
  const totalGuests = firstNight.chosen_rooms.reduce((sum, room) => {
    return (
      sum +
      (room.occupant_countAdults ?? 0) +
      (room.occupant_countChildren6_12 ?? 0) +
      (room.occupant_countChildren3_5 ?? 0)
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
          // Resolve this night's pricing object (match by date + hotel) so we
          // can hand the shared helper the per-night `.pricing` directly.
          const nightPricing = nightlyPricing?.nightlyPricing?.find(
            (e: any) =>
              e.date === reservation.date && e.hotel === reservation.hotel,
          )?.pricing;

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
                      {t("bookingDetails.warning.externalRestaurantsFull")}
                    </p>
                  )}
                {reservation.chosen_rooms.map((room, roomIndex) => {
                  
                  const selectedExtrasForThisRoom = Object.entries(room.extras ?? {})
                    .filter(([key, value]: any) => value.selected && (value.amount ?? 0) > 0);
                  

                  return (
                    <div key={roomIndex} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{room.category_name}</span>
                          <button
                            className="text-[#2C4A3C] hover:text-[#2C4A3C]/80"
                            onClick={() => onShowRoomDetail({ ...room, hotel: reservation.hotel })}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-medium">
                          €{getPriceForSingleRoom(
                            nightPricing,
                            reservation.hotel,
                            boardKey,
                            bookingData.travelMode,
                            room,
                            bookingData.arrangementLength,
                            reservation.restaurant_chosen,
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                          {t("bookingDetails.occupancy", {
                            adults: room.occupant_countAdults,
                            children: room.occupant_countChildren6_12 + room.occupant_countChildren3_5,
                          })}
                        </span>
                      </div>

                      {/* Render extras only if there are any for THIS room */}
                      {selectedExtrasForThisRoom.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t("bookingDetails.selectedExtras", "Selected extras")}
                          </h4>
                          <ul className="space-y-1">
                            {selectedExtrasForThisRoom.map(([key, details]: any) => {
                              const meta = getProductMeta(
                                reservation.hotel,
                                key,
                                bookingData.arrangementLength as 3 | 4,
                                optionalProducts,
                              );
                              if (!meta) return null;

                              const name = meta.translations[i18n.language] || meta.translations.en || key;
                              const { price, chargingMode } = meta;

                              let lineTotal = 0;
                              let displayQuantity = details.amount;
                              const isBicycle = key === 'ElectricBike' || key === 'CityBike';
                              const adultsInRoom = room.occupant_countAdults ?? 0;
                              const childrenInRoom = (room.occupant_countChildren6_12 ?? 0) + (room.occupant_countChildren3_5 ?? 0);
                              const children3_5 = room.occupant_countChildren3_5 ?? 0;
                              const children6_12 = room.occupant_countChildren6_12 ?? 0;

                              if (isBicycle) {
                                const dailyRate = bookingData.arrangementLength === 4 ? price / 3 : price / 2;
                                lineTotal = dailyRate * displayQuantity;
                              } else if (chargingMode === 'PerPerson') {
                                const guestsInRoom = adultsInRoom + childrenInRoom;
                                displayQuantity = guestsInRoom; // The quantity to display is the number of guests

                                if (key === 'lunch' && childrenInRoom > 0) {
                                  const adjustment6_12 = lunchAdjustmentForChild6_12[reservation.hotel] ?? 0;
                                  const adjustment3_5 = lunchAdjustmentForChild3_5[reservation.hotel] ?? 0;
                                  const childPrice6_12 = Math.max(0, price - adjustment6_12);
                                  const childPrice3_5 = Math.max(0, price - adjustment3_5);
                                  lineTotal = (adultsInRoom * price) + ((children3_5 * childPrice3_5) + (children6_12 * childPrice6_12));
                                } else {
                                  lineTotal = price * guestsInRoom;
                                }
                              } else {
                                lineTotal = price * displayQuantity;
                              }

                              if (lineTotal === 0) return null;

                              return (
                                <li key={key} className="flex justify-between text-sm">
                                  <span>
                                    {name}
                                    {displayQuantity > 1 ? ` ×${displayQuantity}` : ""}
                                  </span>
                                  <span>€{lineTotal.toFixed(2)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
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

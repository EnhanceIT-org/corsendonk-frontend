import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MealPlanToggle } from "./MealPlanToggle";
import { RoomDetailModal } from "./RoomDetailModal";
import { format } from "date-fns";
import { nl, enUS, fr } from "date-fns/locale";
import axios from "axios";
import { fetchWithBaseUrl } from "../../lib/utils";
import {
  Coffee,
  UtensilsCrossed,
  Plus,
  Minus,
  User,
  Info,
  XCircle,
  Mountain,
  Bike,
  ChevronDown,
} from "lucide-react";

import {
  ageCategoryMapping,
  BoardMapping,
  HOTEL_NAME_MAPPING,
  lunchAdjustmentForChild6_12,
  lunchAdjustmentForChild3_5,
} from "../../mappings/mappings";

import { PricingSummary } from "./PricingSummary";
import { Breadcrumb } from "./Breadcrumb";

interface selectedArrangementInterface {
  night_details: {
    chosen_rooms: {
      bed_capacity: number;
      category_id: string;
      category_name: string;
      occupant_countAdults?: number;
      occupant_countBabies?: number;
      occupant_countChildren6_12?: number;
      occupant_countChildren3_5?: number;
      extras: {
        [key: string]: {
          selected: boolean;
          amount: number;
        };
      };
    }[];
    board_type: string;
    date: string;
    hotel: string;
    notes: string[];
    restaurant_chosen: string;
    extras: {
      [key: string]: {
        selected: boolean;
        amount: number;
      };
    };
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
    babies: number;
    children6_12: number;
    children3_5: number;
    travelMode: "walking" | "cycling";
    boardOption: "breakfast" | "halfboard";
  };
  onContinue: (
    selectedArrangement: selectedArrangementInterface, // Use interface
    pricingData: any,
    totalPrice: number,
    boardOption: any,
    travelMode: "walking" | "cycling",
    rawConfig: any,
    optionalProducts: { [hotel: string]: any },
  ) => void;
  onBack: () => void;
}

// ---------- OPTIONAL-PRODUCT HELPERS ----------
type ChargingMode = "Once" | "PerPerson" | "PerTimeUnit" | "PerPersonNight";

const sumNightAdults = (night: any) =>
  night.chosen_rooms.reduce(
    (acc: number, r: any) => acc + (r.occupant_countAdults ?? 0),
    0,
  );
// I don't count babies because this seems to never be used to calculate price or availability
const sumNightChildren = (night: any) =>
  night.chosen_rooms.reduce(
    (acc: number, r: any) => acc + (r.occupant_countChildren6_12 ?? 0) + (r.occupant_countChildren3_5 ?? 0),
    0,
  );

function getHotelDisplayName(hotelKey: string): string {
  return HOTEL_NAME_MAPPING[hotelKey] || hotelKey;
}

function getNightlyRateId(
  hotel: string,
  boardType: string,
  travelMode: string,
  arrangementLength: number,
  restaurantChosen: string | null,
) {
  const board = boardType === "HB" ? "halfboard" : "breakfast";
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  const lengthKey = arrangementLength === 3 ? "3D" : "4D";

  let rateId = "";
  const hotelRates = BoardMapping[hotel]?.[mode]?.[lengthKey];

  if (hotelRates) {
    if (
      hotel === "hotel3" &&
      board === "halfboard" &&
      restaurantChosen &&
      (restaurantChosen === "Bink" || restaurantChosen === "Bardo")
    ) {
      rateId = hotelRates[board]?.[restaurantChosen] || "";
    } else {
      rateId = hotelRates[board] || "";
    }
  }

  return rateId;
}

function calculateTotalPrice(
  arrangement: selectedArrangementInterface | null,
  pricesPerNight: number[],
  arrangementLen: 3 | 4,
  productData: { [hotel: string]: any } | null,
): number {
  if (!arrangement?.night_details) {
    return 0;
  }

  // Start with the total price of all room nights
  let total = pricesPerNight.reduce((sum, price) => sum + price, 0);

  // Loop through each night to add extras
  arrangement.night_details.forEach((night: any) => {
    for (const room of night.chosen_rooms) {
      if (!room.extras) continue;

      const productsForThisRoom = Object.keys(room.extras).filter(
        (key) => room.extras[key].selected,
      );

      for (const productKey of productsForThisRoom) {
        const meta = getProductMeta(
          night.hotel,
          productKey,
          arrangementLen,
          productData,
        );
        if (!meta) continue;

        const { price, chargingMode } = meta;
        let added = 0;

        const isBicycle = productKey === 'ElectricBike' || productKey === 'CityBike';

        if (isBicycle) {
          const dailyRate = arrangementLen === 4 ? price / 3 : price / 2;
          added = dailyRate * room.extras[productKey].amount;
        } else {
          switch (chargingMode as ChargingMode) {
            case "Once":
            case "PerTimeUnit":
              added = price * room.extras[productKey].amount;
              break;
            case "PerPerson":
            default:
              const adultsInRoom = room.occupant_countAdults ?? 0;
              const babiesInRoom = room.occupant_countBabies ?? 0;
              const children3_5 = room.occupant_countChildren3_5 ?? 0;
              const children6_12 = room.occupant_countChildren6_12 ?? 0;

              // Didn't add lunch for babies as price in mews is 0
              if (productKey === 'lunch' && (children3_5 > 0 || children6_12 > 0)) {
                const adjustment6_12 = lunchAdjustmentForChild6_12[night.hotel] ?? 0;
                const adjustment3_5 = lunchAdjustmentForChild3_5[night.hotel] ?? 0;
                const childPrice6_12 = Math.max(0, price - adjustment6_12);
                const childPrice3_5 = Math.max(0, price - adjustment3_5);
                added = (adultsInRoom * price) + ((children3_5 * childPrice3_5) + (children6_12 * childPrice6_12));
              } else {
                const guestsInRoom = adultsInRoom + children3_5 + children6_12;
                added = price * guestsInRoom;
              }
              break;
          }
        }
        total += added;
      }
    }
  });

  return total;
}

function distributeGuestsEvenly(
  count: number,
  chosenRooms: any[],
  isAdult: boolean,
  childAgeGroup?: '3_5' | '6_12'
): number {
  const n = chosenRooms.length;
  if (n === 0) return 0;

  let remainingToPlace = count;
  let totalPlaced = 0;

  while (remainingToPlace > 0 && totalPlaced < count) {
    const prevPlaced = totalPlaced;

    for (let i = 0; i < n && remainingToPlace > 0; i++) {
      const room = chosenRooms[i];
      const existingAdults = room.occupant_countAdults ?? 0;
      const existingChildren = (room.occupant_countChildren6_12 ?? 0) + (room.occupant_countChildren3_5 ?? 0);
      const used = existingAdults + existingChildren;
      const free = Math.max(0, room.bed_capacity - used);

      if (free > 0) {
        const toPlace = Math.min(1, free, remainingToPlace);

        if (isAdult) {
          room.occupant_countAdults = (room.occupant_countAdults ?? 0) + toPlace;
        } else {
          const prop = `occupant_countChildren${childAgeGroup}`;
          room[prop] = (room[prop] ?? 0) + toPlace;
        }

        remainingToPlace -= toPlace;
        totalPlaced += toPlace;
      }
    }

    // Prevent infinite loop if no progress
    if (totalPlaced === prevPlaced) break;
  }

  return totalPlaced;
}

// --- Helper functions: Date/String Formatting ---
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


function allowedProductKeys(travelMode: "walking" | "cycling") {
  // keys must match the leaf-names in the Mews mapping
  return travelMode === "walking"
    ? ["lunch", "huisdier"]
    : ["lunch", "huisdier", "ElectricBike", "CityBike"];
}

const GLOBAL_OPTIONAL_PRODUCT_KEYS = ["ElectricBike", "CityBike", "huisdier"] as const;

/**
 * Resolve a flat key (eg "lunch", "ElectricBike") to the leaf node that
 * contains the price + chargingMode for the *current* hotel & length.
 */
function getProductMeta(
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



// --- Main Component ---
export const RoomPicker: React.FC<RoomPickerProps> = ({
  bookingData,
  onBack,
  onContinue,
}) => {
  const { t, i18n } = useTranslation();
  const [rawConfig, setRawConfig] = useState<any>(null);
  const [arrangements, setArrangements] = useState<{
    breakfast: any;
    halfboard: any;
  }>({
    breakfast: null,
    halfboard: null,
  });
  const [selectedArrangement, setSelectedArrangement] =
    useState<selectedArrangementInterface | null>(null);
  const [pricingData, setPricingData] = useState<{
    breakfast: any;
    halfboard: any;
  }>({
    breakfast: null,
    halfboard: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoardOption, setSelectedBoardOption] = useState<
    "breakfast" | "halfboard"
  >(bookingData.boardOption);
  const [defaultDistributed, setDefaultDistributed] = useState(false);

  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [modalRoomData, setModalRoomData] = useState<any>(null);

  const { startDate, arrangementLength, rooms, adults, babies, children6_12, children3_5, travelMode } =
    bookingData;

  const [openExtrasSections, setOpenExtrasSections] = useState<boolean[]>(() =>
    Array(rooms).fill(rooms === 1)
  );

  const [optionalProducts, setOptionalProducts] = useState<null | {
    [hotel: string]: any;
  }>(null);


  function getPriceForSingleRoom(
    nightlyPricing: any,
    hotel: string,
    boardType: string, // "HB" or "B&B" based on night.board_type
    travelMode: string,
    room: any,
    children6_12Count: number,
    children3_5Count: number,
    adultsCount: number,
    arrangementLengthParam: number,
    restaurantChosen: string | null,
  ): number {
    if (!nightlyPricing?.CategoryPrices) {
      return 0;
    }
    const cat = nightlyPricing.CategoryPrices.find(
      (cp: any) => cp.CategoryId === room.category_id,
    );
    if (!cat) {
      return 0;
    }

    const occupantTotal = adultsCount + children6_12Count + children3_5Count;
    const occupantArray: any[] = [];
    const adultAgeCatId = ageCategoryMapping[hotel]?.adult;
    const child6_12AgeCatId = ageCategoryMapping[hotel]?.child6_12;
    const child3_5AgeCatId = ageCategoryMapping[hotel]?.child3_5;


    if (adultsCount > 0) {
      occupantArray.push({
        AgeCategoryId: adultAgeCatId,
        PersonCount: adultsCount,
      });
    }
    if (children6_12Count > 0) {
      occupantArray.push({
        AgeCategoryId: child6_12AgeCatId,
        PersonCount: children6_12Count,
      });
    }
    if (children3_5Count > 0) {
      occupantArray.push({
        AgeCategoryId: child3_5AgeCatId,
        PersonCount: children3_5Count,
      });
    }


    let occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
      if (!op.Occupancies || op.Occupancies.length !== occupantArray.length) {
        return false;
      }
      const sortedApiOccupancies = [...op.Occupancies].sort((a, b) =>
        (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
      );
      const sortedTargetOccupancies = [...occupantArray].sort((a, b) =>
        (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
      );

      console.log(sortedApiOccupancies);
      console.log(sortedTargetOccupancies);
      console.log(sortedApiOccupancies.length)

      for (let i = 0; i < sortedApiOccupancies.length; i++) {
        console.log(sortedApiOccupancies[i])
        console.log(sortedTargetOccupancies[i]);
        if (
          sortedApiOccupancies[i].AgeCategoryId !==
          sortedTargetOccupancies[i].AgeCategoryId ||
          sortedApiOccupancies[i].PersonCount <
          sortedTargetOccupancies[i].PersonCount
        ) {
          return false;
        }
      }
      console.log("great success");
      return true;
    });

    console.log("occupantPriceEntry", occupantPriceEntry);

    if (!occupantPriceEntry) {
      occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
        const sum = op.Occupancies.reduce(
          (acc: number, x: any) => acc + x.PersonCount,
          0,
        );
        return sum === occupantTotal;
      });
    }

    if (!occupantPriceEntry) {
      console.log("no occupant price entry");
      return 0;
    }

    const rateId = getNightlyRateId(
      hotel,
      boardType,
      travelMode,
      arrangementLengthParam,
      restaurantChosen,
    );

    const rPrice = occupantPriceEntry.RateGroupPrices.find(
      (rgp: any) => rgp.MinRateId === rateId,
    );
    if (!rPrice) {
      console.log("no rate price");
      return 0;
    }

    const val = rPrice.MinPrice?.TotalAmount?.GrossValue;
    if (typeof val === "number") {
      return val;
    }

    console.log("no value");
    return 0;
  }

  const [pricesPerNight, setPricesPerNight] = useState<number[]>(
    Array(arrangementLength - 1).fill(0),
  );
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const [year, month, day] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = `${day}-${month}-${year}`;

  const handleExtrasToggle = (toggledIndex: number) => {
    setOpenExtrasSections(currentOpenState => {
      const newState = [...currentOpenState];
      newState[toggledIndex] = !newState[toggledIndex];
      return newState;
    });
  };

  // --- Action: Reserve Button ---
  const onReserve = () => {
    // Validate occupant assignment
    const unassignedGuests = selectedArrangement?.night_details.some(
      (night: any) => {
        const totalAssignedAdults = sumNightAdults(night);
        const totalAssignedChildren = sumNightChildren(night);
        return totalAssignedAdults < adults || totalAssignedChildren < (children6_12 + children3_5);
      },
    );

    const emptyRooms = selectedArrangement?.night_details.some((night: any) =>
      night.chosen_rooms.some(
        (room: any) =>
          (room.occupant_countAdults ?? 0) +
          (room.occupant_countChildren6_12 ?? 0) +
          (room.occupant_countChildren3_5 ?? 0) ===
          0,
      ),
    );

    if (unassignedGuests || emptyRooms) {
      setError(t("roomPicker.error.guestsNotAssigned"));
      return;
    }

    if (!selectedArrangement) {
      setError(t("roomPicker.error.noArrangementSelected"));
      return;
    }

    onContinue(
      selectedArrangement, // Pass the arrangement with per-night extras
      pricingData,
      totalPrice,
      selectedBoardOption,
      travelMode,
      rawConfig,
      optionalProducts,
    );
  };

  // --- Effect: Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const configRes = await fetchWithBaseUrl(
          `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangementLength}`,
        );
        if (!configRes.ok) {
          throw new Error(
            `Failed to fetch configuration (${configRes.status})`,
          );
        }
        const configData = await configRes.json();
        setRawConfig(configData.data.hotels);

        const payload = {
          startDate: formattedStartDatePOST,
          length: arrangementLength,
          guests: { adults, children3_5, children6_12, babies },
          amountOfRooms: rooms,
        };
        const optionalRes = await fetchWithBaseUrl("/reservations/optional-products/");
        if (!optionalRes.ok) throw new Error("Failed to fetch optional products");
        const optionalJson = await optionalRes.json();
        const optionalData = optionalJson.data;     // <- keep a local copy
        setOptionalProducts(optionalData);


        const [availBreakfastRes, availHalfBoardRes] = await Promise.all([
          axios.post(
            `${import.meta.env.VITE_API_URL}/reservations/availability/`,
            { ...payload, useHalfBoard: false },
          ),
          axios.post(
            `${import.meta.env.VITE_API_URL}/reservations/availability/`,
            { ...payload, useHalfBoard: true },
          ),
        ]);

        const availBreakfast = availBreakfastRes.data.data;
        const availHalfBoard = availHalfBoardRes.data.data;

        if (availBreakfast?.error && availHalfBoard?.error) {
          setError(
            availBreakfast.error ??
            availHalfBoard.error ??
            t(
              "roomPicker.error.noRoomsFoundTryDifferentDates",
              "No available rooms found, please try different dates",
            ),
          );
          setLoading(false);
          return;
        }
        if (
          !availBreakfast?.optimal_sequence &&
          !availHalfBoard?.optimal_sequence
        ) {
          setError(
            t(
              "roomPicker.error.noArrangementsAvailableBody",
              "No arrangements available for this selection.",
            ),
          );
          setLoading(false);
          return;
        }

        if (availBreakfast?.optimal_sequence) {
          availBreakfast.optimal_sequence.adults = adults;
          availBreakfast.optimal_sequence.children6_12 = children6_12;
          availBreakfast.optimal_sequence.children3_5 = children3_5;
          availBreakfast.optimal_sequence.babies = babies;
        }
        if (availHalfBoard?.optimal_sequence) {
          availHalfBoard.optimal_sequence.adults = adults;
          availHalfBoard.optimal_sequence.children6_12 = children6_12;
          availHalfBoard.optimal_sequence.children3_5 = children3_5;
          availHalfBoard.optimal_sequence.babies = babies;
        }
        setArrangements({
          breakfast: availBreakfast?.optimal_sequence,
          halfboard: availHalfBoard?.optimal_sequence,
        });

        const initialArrangement =
          bookingData.boardOption === "breakfast"
            ? availBreakfast?.optimal_sequence
            : availHalfBoard?.optimal_sequence;

        if (!initialArrangement) {
          const fallbackArrangement =
            bookingData.boardOption === "breakfast"
              ? availHalfBoard?.optimal_sequence
              : availBreakfast?.optimal_sequence;

          if (!fallbackArrangement) {
            setError(
              t(
                "roomPicker.error.noArrangementsAvailableTitle",
                "No Arrangements Available",
              ),
            );
            setLoading(false);
            return;
          } else {
            setSelectedArrangement(fallbackArrangement);
            setSelectedBoardOption(
              bookingData.boardOption === "breakfast"
                ? "halfboard"
                : "breakfast",
            );
          }
        } else {
          setSelectedArrangement(initialArrangement);
          // Ensure selectedBoardOption matches the initial one from bookingData
          setSelectedBoardOption(bookingData.boardOption);
        }

        const initializeExtras = (
          arrangement: selectedArrangementInterface | null,
          prodData: { [hotel: string]: any } | null,
        ) => {
          if (!arrangement?.night_details || !prodData) return arrangement;


          arrangement.night_details.forEach((night) => {
            const keys = allowedProductKeys(travelMode);
            night.chosen_rooms.forEach((room) => {
              room.extras = room.extras || {};
              keys.forEach((k) => {
                if (getProductMeta(night.hotel, k, arrangementLength as 3 | 4, prodData))
                  room.extras[k] = room.extras[k] ?? { selected: false, amount: 0 };
              });
            });
          });
          return arrangement;
        };


        let initialArrangementToSet =
          bookingData.boardOption === "breakfast"
            ? availBreakfast?.optimal_sequence
            : availHalfBoard?.optimal_sequence;

        if (!initialArrangementToSet) {
          initialArrangementToSet =
            bookingData.boardOption === "breakfast"
              ? availHalfBoard?.optimal_sequence
              : availBreakfast?.optimal_sequence;

          if (initialArrangementToSet) {
            // Update board option state if fallback is used
            setSelectedBoardOption(
              bookingData.boardOption === "breakfast"
                ? "halfboard"
                : "breakfast",
            );
          } else {
            setError(
              t(
                "roomPicker.error.noArrangementsAvailableTitle",
                "No Arrangements Available",
              ),
            ); // Keep this key
            setLoading(false);
            return; // Exit early
          }
        } else {
          // Ensure board option state matches the one successfully loaded
          setSelectedBoardOption(bookingData.boardOption);
        }

        // Initialize extras on the arrangement *before* setting state
        const arrangementWithExtras = initializeExtras(initialArrangementToSet, optionalData);
        setSelectedArrangement(arrangementWithExtras);

        // Fetch pricing data *only if* we have valid arrangements to fetch for
        const pricingPromises = [];
        if (availBreakfast?.optimal_sequence) {
          pricingPromises.push(
            axios.post(
              `${import.meta.env.VITE_API_URL}/reservations/pricing/`,
              {
                selectedArrangement: availBreakfast.optimal_sequence,
              },
            ),
          );
        } else {
          pricingPromises.push(Promise.resolve({ data: { data: null } })); // Placeholder if no breakfast arrangement
        }

        if (availHalfBoard?.optimal_sequence) {
          pricingPromises.push(
            axios.post(
              `${import.meta.env.VITE_API_URL}/reservations/pricing/`,
              {
                selectedArrangement: availHalfBoard.optimal_sequence,
              },
            ),
          );
        } else {
          pricingPromises.push(Promise.resolve({ data: { data: null } })); // Placeholder if no halfboard arrangement
          // console.warn(
          //   "[RoomPicker InitEffect] No halfboard arrangement, skipping halfboard pricing fetch.",
          // );
        }

        const [pricingBreakfastRes, pricingHalfBoardRes] =
          await Promise.all(pricingPromises);
        const validatePricing = (
          pricingResult: any,
          boardType: string,
        ): boolean => {
          if (!pricingResult?.data?.data?.nightlyPricing) {
            console.log(
              `[Pricing Validation] No nightlyPricing for ${boardType}. Skipping validation.`,
            );
            return true; // No data to validate, consider it valid for now
          }
          for (const nightPrice of pricingResult.data.data.nightlyPricing) {
            if (
              !nightPrice.pricing ||
              nightPrice.pricing.RateGroups?.length === 0 ||
              nightPrice.pricing.Rates?.length === 0 ||
              nightPrice.pricing.CategoryPrices?.length === 0
            ) {
              console.error(
                `[Pricing Validation] Empty pricing found for ${boardType} on date ${nightPrice.date}, hotel ${nightPrice.hotel}.`,
                nightPrice.pricing,
              );
              return false; // Invalid pricing found
            }
          }
          // console.log(`[Pricing Validation] Pricing for ${boardType} seems valid.`);
          return true; // All nights have pricing data
        };


        const isBreakfastPricingValid = validatePricing(
          pricingBreakfastRes,
          "breakfast",
        );
        const isHalfboardPricingValid = validatePricing(
          pricingHalfBoardRes,
          "halfboard",
        );

        // Check validity based on the *selected* arrangement's board type initially
        const currentSelectedArrangementBoard =
          selectedArrangement?.night_details?.[0]?.board_type === "HB"
            ? "halfboard"
            : "breakfast";

        let isCurrentPricingValid = true;
        if (
          currentSelectedArrangementBoard === "breakfast" &&
          availBreakfast?.optimal_sequence
        ) {
          isCurrentPricingValid = isBreakfastPricingValid;
        } else if (
          currentSelectedArrangementBoard === "halfboard" &&
          availHalfBoard?.optimal_sequence
        ) {
          isCurrentPricingValid = isHalfboardPricingValid;
        } else if (
          !availBreakfast?.optimal_sequence &&
          !availHalfBoard?.optimal_sequence
        ) {
          // If no arrangements were found initially, this check isn't the primary issue
          isCurrentPricingValid = true; // Allow existing error handling to take precedence
        } else {
          // If the initially selected board option didn't have an arrangement,
          // check the validity of the fallback option that *was* selected.
          const fallbackBoard = selectedBoardOption; // This state holds the actual selected board
          if (
            fallbackBoard === "breakfast" &&
            availBreakfast?.optimal_sequence
          ) {
            isCurrentPricingValid = isBreakfastPricingValid;
          } else if (
            fallbackBoard === "halfboard" &&
            availHalfBoard?.optimal_sequence
          ) {
            isCurrentPricingValid = isHalfboardPricingValid;
          }
        }

        if (!isCurrentPricingValid) {
          setError(
            t(
              "roomPicker.error.noArrangementsAvailableBody",
              "No arrangements available for the selected criteria.",
            ),
          ); // Keep this key
          setLoading(false);
          return; // Stop processing
        }


        setPricingData({
          breakfast: pricingBreakfastRes.data.data,
          halfboard: pricingHalfBoardRes.data.data,
        });
      } catch (err: any) {
        if (err.response) {
          // console.error(
          //   "[RoomPicker InitEffect] Error response data:",
          //   err.response.data,
          // );
          // console.error(
          //   "[RoomPicker InitEffect] Error response status:",
          //   err.response.status,
          // );
        }
        setError(err.message || t("common.error", "Error fetching data")); // Keep this key
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    // Dependencies remain the same
    bookingData,
    formattedStartDateGET,
    formattedStartDatePOST,
    arrangementLength,
    adults,
    babies,
    children3_5,
    children6_12,
    rooms,
    travelMode, // Added travelMode as it impacts rate IDs used in pricing
  ]);

  // --- Effect: Distribute Guests ---
  useEffect(() => {
    if (
      !selectedArrangement ||
      defaultDistributed ||
      !selectedArrangement.night_details
    ) {
      return;
    }

    setSelectedArrangement((currentArrangement) => {
      if (!currentArrangement) return null; // Should not happen if guarded above, but safe check

      const updated = JSON.parse(JSON.stringify(currentArrangement)); // Deep copy
      let distributionApplied = false;

      updated.night_details.forEach((night: any) => {
        const chosenRooms = night.chosen_rooms || [];
        // Ensure occupant counts are initialized
        chosenRooms.forEach((r: any) => {
          r.occupant_countAdults ??= 0;
          r.occupant_countChildren3_5 ??= 0;
          r.occupant_countChildren6_12 ??= 0;
        });

        if (chosenRooms.length === 1) {
          chosenRooms[0].occupant_countAdults = adults;
          chosenRooms[0].occupant_countChildren3_5 = children3_5;
          chosenRooms[0].occupant_countChildren6_12 = children6_12;
          distributionApplied = true;
        } else if (chosenRooms.length >= 2) {
          // Reset first
          chosenRooms.forEach((r: any) => {
            r.occupant_countAdults = 0;
            r.occupant_countChildren3_5 = 0;
            r.occupant_countChildren6_12 = 0;
          });
          // distributeGuestsEvenly mutates chosenRooms inside the 'updated' copy
          distributeGuestsEvenly(
            adults,
            chosenRooms,
            true,
            "3_5"
          );
          distributeGuestsEvenly(
            children3_5,
            chosenRooms,
            false,
            "3_5"
          );
          distributeGuestsEvenly(
            children6_12,
            chosenRooms,
            false,
            "6_12"
          );
          distributionApplied = true;
        }
      });

      if (distributionApplied) {
        setDefaultDistributed(true);
        return updated;
      } else {
        setDefaultDistributed(true);
        return currentArrangement;
      }
    });
  }, [selectedArrangement, defaultDistributed, adults, children3_5, children6_12]); // Keep dependencies

  // --- Effect: Calculate Prices Per Night ---
  useEffect(() => {
    // Wait until automatic distribution finished
    if (!defaultDistributed) return;
    if (!selectedArrangement || !pricingData) return;

    let isPriceMissingForOccupiedRoom = false;


    const nightlyTotals = selectedArrangement.night_details.map(
      (night) => {
        const chosenRooms = night.chosen_rooms ?? [];
        const boardKey = selectedBoardOption;
        const nightlyPricingForBoard = pricingData[boardKey]?.nightlyPricing ?? [];

        const foundEntry = nightlyPricingForBoard.find(
          (x: any) => x.date === night.date && x.hotel === night.hotel,
        );
        // If the entire pricing structure for the night is missing, it's an error
        // ONLY if there are guests assigned to this night (even if not yet in rooms).
        if (!foundEntry?.pricing) {
          // We check against the total booking guests, as they are intended for this night.
          if (adults + children3_5 + children6_12 > 0) {
            isPriceMissingForOccupiedRoom = true;
          }
          return 0; // No pricing, so night total is 0.
        }

        // Calculate the total for the night, room by room.
        const nightTotal = chosenRooms.reduce((acc: number, room: any) => {
          const roomAdults = room.occupant_countAdults ?? 0;
          const roomChildren6_12 = room.occupant_countChildren6_12 ?? 0;
          const roomChildren3_5 = room.occupant_countChildren3_5 ?? 0;
          const guestsInRoom = roomAdults + roomChildren6_12 + roomChildren3_5;

          // An empty room costs 0 and is NOT a pricing error.
          if (guestsInRoom === 0) {
            return acc;
          }

          // This room is occupied, so let's get its price.
          const priceForThisRoom = getPriceForSingleRoom(
            foundEntry.pricing,
            night.hotel,
            night.board_type,
            travelMode,
            room,
            roomChildren6_12,
            roomChildren3_5,
            roomAdults,
            arrangementLength,
            night.restaurant_chosen,

          );

          console.log("priceForThisRoom", priceForThisRoom);

          // If the room is occupied but has no price, it's a fatal error.
          if (priceForThisRoom === 0) {
            isPriceMissingForOccupiedRoom = true;
          }

          return acc + priceForThisRoom;
        }, 0);

        return nightTotal;
      },
    );

    setPricesPerNight(nightlyTotals);

    if (isPriceMissingForOccupiedRoom) {
      console.error("[RoomPicker] Pricing data is missing for an occupied room. This indicates a configuration or data issue that needs to be addressed.");
    }
    // Set the error state based ONLY on our more intelligent check.
    // The old `hasMissingPrice` logic is now removed.
    setError(
      isPriceMissingForOccupiedRoom
        ? t(
          "roomPicker.error.noArrangementsAvailableBody",
          "No arrangements available for the selected criteria.",
        )
        : null,
    );
  }, [
    selectedArrangement,
    pricingData,
    defaultDistributed, // NEW dep
    selectedBoardOption,
    travelMode,
    arrangementLength,
    adults,
    children6_12,
    children3_5,
    t, // Include translation function to avoid stale closure issues
  ]);

  useEffect(() => {
    const newTotal = calculateTotalPrice(
      selectedArrangement,
      pricesPerNight,
      arrangementLength as 3 | 4,
      optionalProducts,
    );
    setTotalPrice(newTotal);
  }, [selectedArrangement, pricesPerNight, arrangementLength, optionalProducts]);

  const handleBoardToggle = (option: "breakfast" | "halfboard") => {
    setError(null);
    setSelectedBoardOption(option);

    const newArrangementData = arrangements[option];

    if (newArrangementData) {
      // Initialize extras for the new arrangement before setting it

      const initialExtrasState: {
        [key: string]: { selected: boolean; amount: number };
      } = {};

      allowedProductKeys(travelMode).forEach((k) => {
        if (
          getProductMeta(
            newArrangementData.night_details[0].hotel, // any night is fine – we only need the hotel key
            k,
            arrangementLength as 3 | 4,
            optionalProducts,
          )
        ) {
          initialExtrasState[k] = { selected: false, amount: 0 };
        }
      });


      const arrangementWithInitializedExtras = JSON.parse(
        JSON.stringify(newArrangementData),
      );
      arrangementWithInitializedExtras.night_details.forEach((night: any) => {
        if (night.chosen_rooms) {
          night.chosen_rooms.forEach((room) => {
            if (typeof room.extras !== "object" || room.extras === null) {
              room.extras = { ...initialExtrasState };
            }
          });
        } else {
          // console.warn("No chosen_rooms found for this night:", night);
        }
      });

      setSelectedArrangement(arrangementWithInitializedExtras);
      // Reset distribution flag so guest distribution runs for the new arrangement
      setDefaultDistributed(false);
    } else {
      // console.warn(
      //   `[handleBoardToggle] No arrangement data found for option: ${option}`,
      // );
      setSelectedArrangement(null); // Clear arrangement if none exists for this option
    }
  };

  const handleToggleExtra = useCallback(
    (nightIndex: number, roomIndex: number, extraKey: string) => {
      setSelectedArrangement((currentArrangement) => {
        if (!currentArrangement) return null;
        const updated = JSON.parse(JSON.stringify(currentArrangement));

        // Determine new state for this toggle based on the clicked room
        const sourceRoom =
          updated.night_details[nightIndex].chosen_rooms[roomIndex];
        if (!sourceRoom.extras?.[extraKey]) return updated;
        const willBeSelected = !sourceRoom.extras[extraKey].selected;

        // If it's a global extra, apply horizontally to the same room index across all nights
        const isGlobal = GLOBAL_OPTIONAL_PRODUCT_KEYS.includes(extraKey as any);
        if (isGlobal) {
          updated.night_details.forEach((night: any) => {
            // Target the same room index in each night
            const targetRoom = night.chosen_rooms[roomIndex];
            if (targetRoom?.extras?.[extraKey]) {
              targetRoom.extras[extraKey].selected = willBeSelected;
              targetRoom.extras[extraKey].amount = willBeSelected ? 1 : 0;
            }
          });
        } else {
          // For non-global extras, only toggle this single room
          sourceRoom.extras[extraKey].selected = willBeSelected;
          sourceRoom.extras[extraKey].amount = willBeSelected ? 1 : 0;
        }

        return updated;
      });
    },
    [],
  );


  const handleExtraAmountChange = useCallback(
    (nightIdx: number, roomIdx: number, extraKey: string, delta: number) => {
      setSelectedArrangement(prev => {
        if (!prev) return null;
        const updated = JSON.parse(JSON.stringify(prev)); // deep clone

        const isGlobal = GLOBAL_OPTIONAL_PRODUCT_KEYS.includes(extraKey as any);
        const guestsInRoom = (room: any) => (room.occupant_countAdults ?? 0) + (room.occupant_countChildren6_12 ?? 0) + (room.occupant_countChildren3_5 ?? 0);

        if (isGlobal) {
          const triggerRoom = updated.night_details[nightIdx].chosen_rooms[roomIdx];
          const currentAmount = triggerRoom.extras[extraKey].amount ?? 1;
          const newAmount = Math.max(1, currentAmount + delta);

          updated.night_details.forEach((night: any) => {
            const targetRoom = night.chosen_rooms[roomIdx];
            if (targetRoom?.extras?.[extraKey]?.selected) {
              const capacity = guestsInRoom(targetRoom);
              // The amount for each room is the new amount, but capped at its own capacity.
              targetRoom.extras[extraKey].amount = Math.min(newAmount, capacity > 0 ? capacity : 1);
            }
          });
        } else {
          /* ---------- SINGLE-ROOM BEHAVIOUR ---------- */
          const room = updated.night_details[nightIdx].chosen_rooms[roomIdx];
          if (room?.extras?.[extraKey]?.selected) {
            const currentAmount = room.extras[extraKey].amount ?? 1;
            const capacity = guestsInRoom(room);
            const newAmount = Math.min(
              Math.max(1, currentAmount + delta),
              capacity > 0 ? capacity : 1 // Cap by guests in this room
            );
            room.extras[extraKey].amount = newAmount;
          }
        }
        return updated;
      });
    },
    []
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <img
          src="/corsendonk_green_png.png" // Use relative path from public folder
          alt={t("common.loading", "Loading Logo")}
          className="w-auto max-w-[180px] md:max-w-[220px] h-auto mb-6 animate-pulse"
        />
        <p className="text-lg text-gray-700">
          {t("common.pleaseWait", "Just a moment please")}
        </p>
      </div>
    );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <XCircle className="text-red-500 w-12 h-12" />
          </div>
          <h2 className="text-xl font-semibold text-[#2C4A3C] mb-4">
            {/* Display the specific error message */}
            {error || t("common.error", "An error occurred")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t(
              "roomPicker.error.checkSelectionOrTryLater",
              "Please check your selection or try again later.",
            )}
          </p>
          <button
            onClick={onBack}
            className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            {t("common.backToArrangementForm", "Back to arrangement form")}
          </button>
        </div>
      </div>
    );
  }

  // Handle case where arrangements might still be null after loading and no error
  if (!selectedArrangement) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <XCircle className="text-orange-500 w-12 h-12" />
          </div>
          <h2 className="text-xl font-semibold text-[#2C4A3C] mb-4">
            {t("roomPicker.error.noOptionsFoundTitle", "No Options Found")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t(
              "roomPicker.error.noArrangementsAvailableBody",
              "No arrangements available for the selected criteria.",
            )}
          </p>
          <button
            onClick={onBack}
            className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            {t("common.backToArrangementForm", "Back to arrangement form")}
          </button>
        </div>
      </div>
    );
  }

  if (!optionalProducts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <img src="/corsendonk_green_png.png" alt="loading" className="w-28 h-auto mb-4 animate-pulse" />
        <p className="text-lg text-gray-700">{t("common.loading")}</p>
      </div>
    );
  }


  return (
    <main
      className="min-h-screen w-full bg-gray-50 pb-32 flex items-center justify-center"
      data-prototypeid="2"
    >
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumb
          currentStep={2}
          title={t("breadcrumb.yourBooking", "Your Booking")}
          onNavigate={(step) => {
            if (step === 1) {
              onBack(); // Keep existing logic, just translate title
            }
          }}
        />

        <div className="mb-4 text-left">
          <MealPlanToggle
            selected={selectedBoardOption}
            onChange={handleBoardToggle}
          />
        </div>

        {/* Use appropriate icon based on travel mode */}
        {travelMode === "cycling" ? (
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
            <Bike size={16} />
            <span>{t("travelMode.cycling", "Cycling")}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
            <Mountain size={16} />
            <span>{t("travelMode.walking", "Walking")}</span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {selectedArrangement.night_details.map(
            (night: any, nightIdx: number) => {
              // Use the actual helper functions here for accuracy in the warning display
              const currentAssignedAdults = sumNightAdults(night);
              const currentAssignedChildren = sumNightChildren(night);

              return (
                <div key={night.date}>
                  <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-medium text-[#2C4A3C]">
                        {formatDateForLocale(night.date, i18n.language)}
                      </h2>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-[#2C4A3C]">
                        {getHotelDisplayName(night.hotel)}
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {night.chosen_rooms.map((room: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-[#2C4A3C]">
                                {t("room.roomNumber", {
                                  number: index + 1,
                                  defaultValue: `Room ${index + 1}`,
                                })}
                              </h4>
                              <button
                                onClick={() => {
                                  setModalRoomData({
                                    ...room,
                                    hotel: night.hotel,
                                  });
                                  setShowRoomDetailModal(true);
                                }}
                                className="text-[#2C4A3C] hover:text-[#2C4A3C]/80 ml-2 flex items-center text-xs" // Added flex and text-xs
                              >
                                <Info className="w-4 h-4 mr-1" />
                              </button>
                            </div>
                            <div className="flex flex-col gap-2">
                              <select
                                className="w-full text-sm border rounded-md px-2 py-1.5 bg-white"
                                value={room.category_name}
                                onChange={(e) => {
                                  const newArrangement = JSON.parse(
                                    JSON.stringify(selectedArrangement),
                                  );
                                  const option = night.room_options.find(
                                    (r: any) =>
                                      r.category_name === e.target.value,
                                  );
                                  if (
                                    option &&
                                    newArrangement.night_details[nightIdx]
                                  ) {
                                    const currentRoomData =
                                      newArrangement.night_details[nightIdx]
                                        .chosen_rooms[index];
                                    newArrangement.night_details[
                                      nightIdx
                                    ].chosen_rooms[index] = {
                                      ...currentRoomData, // Preserve existing occupant counts
                                      category_name: option.category_name,
                                      category_id: option.category_id,
                                      bed_capacity: option.bed_capacity,
                                    };
                                    setSelectedArrangement(newArrangement);
                                  } else {
                                    // console.error(
                                    //   "[RoomPicker Render] Could not find selected room option or night detail.",
                                    //   { option, nightIdx },
                                    // );
                                  }
                                }}
                              >
                                {night.room_options.map((roomOption: any) => {
                                  // how many of this category are already chosen tonight?
                                  const currentSelectedCount =
                                    night.chosen_rooms.filter(
                                      (r: any) =>
                                        r.category_id ===
                                        roomOption.category_id,
                                    ).length;

                                  const isExhausted =
                                    currentSelectedCount >=
                                    roomOption.available_count;

                                  const isSelectedHere =
                                    room.category_id === roomOption.category_id;

                                  const guestsInThisSlot =
                                    (room.occupant_countAdults ?? 0) +
                                    (room.occupant_countChildren6_12 ?? 0) +
                                    (room.occupant_countChildren3_5 ?? 0);

                                  const isOverCapacity =
                                    roomOption.bed_capacity < guestsInThisSlot;

                                  const shouldDisable =
                                    isOverCapacity ||
                                    (isExhausted && !isSelectedHere);

                                  return (
                                    <option
                                      key={roomOption.category_id}
                                      value={roomOption.category_name}
                                      disabled={shouldDisable}
                                    >
                                      {roomOption.category_name}
                                      {isExhausted && !isSelectedHere
                                        ? ` (${t("room.full", "Full")})`
                                        : ""}
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>
                                  {(() => {
                                    const boardKey = selectedBoardOption;
                                    const nightlyPricingForBoard =
                                      pricingData[boardKey]?.nightlyPricing ??
                                      [];
                                    const foundEntry =
                                      nightlyPricingForBoard.find(
                                        (x: any) =>
                                          x.date === night.date &&
                                          x.hotel === night.hotel,
                                      );
                                    if (!foundEntry?.pricing) {
                                      return t(
                                        "room.priceUnavailable",
                                        "Price unavailable",
                                      );
                                    }
                                    const price = getPriceForSingleRoom(
                                      foundEntry.pricing,
                                      night.hotel,
                                      night.board_type,
                                      travelMode,
                                      room,
                                      room.occupant_countChildren6_12 ?? 0,
                                      room.occupant_countChildren3_5 ?? 0,
                                      room.occupant_countAdults ?? 0,
                                      arrangementLength,
                                      night.restaurant_chosen, // NEW: Pass restaurant_chosen here too for display consistency
                                    );
                                    return price > 0
                                      ? `€${price.toFixed(2)}` // Format price
                                      : t(
                                        "room.priceUnavailable",
                                        "Price unavailable",
                                      );
                                  })()}
                                </span>
                              </div>
                            </div>
                            {rooms > 1 && (
                              <div className="mt-2 space-y-2">
                                {adults > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">
                                      {t("occupancy.adults", "Adults")}:
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetRoom =
                                              newArrangement.night_details[
                                                nightIdx
                                              ]?.chosen_rooms[index];
                                            if (targetRoom) {
                                              targetRoom.occupant_countAdults =
                                                Math.max(
                                                  0,
                                                  (targetRoom.occupant_countAdults ||
                                                    0) - 1,
                                                );
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countAdults || 0) === 0
                                      }
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countAdults || 0}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetNight =
                                              newArrangement.night_details[
                                              nightIdx
                                              ];
                                            const targetRoom =
                                              targetNight?.chosen_rooms[index];

                                            if (targetRoom) {
                                              const currentAdultsInRoom =
                                                targetRoom.occupant_countAdults ||
                                                0;
                                              const currentChildrenInRoom =
                                                (targetRoom.occupant_countChildren6_12 ?? 0) +
                                                (targetRoom.occupant_countChildren3_5 ?? 0);
                                              const totalAdultsAssignedThisNight =
                                                sumNightAdults(targetNight);

                                              if (
                                                currentAdultsInRoom +
                                                currentChildrenInRoom +
                                                1 <=
                                                targetRoom.bed_capacity &&
                                                totalAdultsAssignedThisNight <
                                                adults
                                              ) {
                                                targetRoom.occupant_countAdults =
                                                  currentAdultsInRoom + 1;
                                              }
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countAdults || 0) +
                                        (room.occupant_countChildren6_12 || 0) +
                                        (room.occupant_countChildren3_5 || 0) >=
                                        room.bed_capacity ||
                                        currentAssignedAdults >= adults
                                      }
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {children6_12 > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">
                                      {t("occupancy.children6-12", "Children 6-12")}:
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetRoom =
                                              newArrangement.night_details[
                                                nightIdx
                                              ]?.chosen_rooms[index];
                                            if (targetRoom) {
                                              targetRoom.occupant_countChildren =
                                                Math.max(
                                                  0,
                                                  (targetRoom.occupant_countChildren ||
                                                    0) - 1,
                                                );
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countChildren6_12 || 0) === 0
                                      }
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countChildren6_12 || 0}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetNight =
                                              newArrangement.night_details[
                                              nightIdx
                                              ];
                                            const targetRoom =
                                              targetNight?.chosen_rooms[index];

                                            if (targetRoom) {
                                              const currentAdultsInRoom =
                                                targetRoom.occupant_countAdults ||
                                                0;
                                              const currentChildrenInRoom =
                                                targetRoom.occupant_countChildren6_12 + targetRoom.occupant_countChildren3_5 ||
                                                0;
                                              const totalChildrenAssignedThisNight =
                                                sumNightChildren(targetNight);

                                              if (
                                                currentAdultsInRoom +
                                                currentChildrenInRoom +
                                                1 <=
                                                targetRoom.bed_capacity &&
                                                totalChildrenAssignedThisNight <
                                                children6_12 + children3_5
                                              ) {
                                                targetRoom.occupant_countChildren6_12 += 1;
                                              }
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countAdults ?? 0) +
                                        (room.occupant_countChildren6_12 ?? 0) +
                                        (room.occupant_countChildren3_5 ?? 0) >=
                                        room.bed_capacity ||
                                        currentAssignedChildren >= children6_12 + children3_5
                                      }
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {children3_5 > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">
                                      {t("occupancy.children3_5", "Children 3-5")}:
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetRoom =
                                              newArrangement.night_details[
                                                nightIdx
                                              ]?.chosen_rooms[index];
                                            if (targetRoom) {
                                              targetRoom.occupant_countChildren =
                                                Math.max(
                                                  0,
                                                  (targetRoom.occupant_countChildren ||
                                                    0) - 1,
                                                );
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countChildren3_5 || 0) === 0
                                      }
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countChildren3_5 || 0}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedArrangement(
                                          (currentArrangement) => {
                                            if (!currentArrangement)
                                              return null;
                                            const newArrangement = JSON.parse(
                                              JSON.stringify(
                                                currentArrangement,
                                              ),
                                            );
                                            const targetNight =
                                              newArrangement.night_details[
                                              nightIdx
                                              ];
                                            const targetRoom =
                                              targetNight?.chosen_rooms[index];

                                            if (targetRoom) {
                                              const currentAdultsInRoom =
                                                targetRoom.occupant_countAdults ||
                                                0;
                                              const currentChildrenInRoom =
                                                targetRoom.occupant_countChildren3_5 + targetRoom.occupant_countChildren6_12 ||
                                                0;
                                              const totalChildrenAssignedThisNight =
                                                sumNightChildren(targetNight);

                                              if (
                                                currentAdultsInRoom +
                                                currentChildrenInRoom +
                                                1 <=
                                                targetRoom.bed_capacity &&
                                                totalChildrenAssignedThisNight <
                                                children6_12 + children3_5
                                              ) {
                                                targetRoom.occupant_countChildren3_5 +=1;
                                              }
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countAdults ?? 0) +
                                        (room.occupant_countChildren3_5 ?? 0) +
                                        (room.occupant_countChildren6_12 ?? 0) >=
                                        room.bed_capacity ||
                                        currentAssignedChildren >= children6_12 + children3_5
                                      }
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {rooms > 1 &&
                            (currentAssignedAdults < adults ||
                              currentAssignedChildren < children6_12 + children3_5) && (
                              <div className="mt-2 text-sm min-h-6 text-red-600">
                                {currentAssignedAdults < adults && (
                                  <p>
                                    {t("roomPicker.warning.adultsUnassigned", {
                                      count: adults - currentAssignedAdults,
                                      defaultValue: `${adults - currentAssignedAdults
                                        } adult(s) unassigned!`,
                                    })}
                                  </p>
                                )}
                                {currentAssignedChildren < children6_12 + children3_5 && (
                                  <p>
                                    {t(
                                      "roomPicker.warning.childrenUnassigned",
                                      {
                                        count:
                                          children6_12 + children3_5 - currentAssignedChildren,
                                        defaultValue: `${children6_12 + children3_5 - currentAssignedChildren
                                          } child(ren) unassigned!`,
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          {rooms > 1 &&
                            room.occupant_countAdults === 0 &&
                            room.occupant_countChildren3_5 === 0 &&
                            room.occupant_countChildren6_12 === 0 && (
                              <div className="mt-2 text-sm text-red-600">
                                {t(
                                  "roomPicker.warning.noGuestsAssigned",
                                  "No guests assigned to this room!",
                                )}
                              </div>
                            )}

                          <div className="mt-6 pt-4 border-t">
                            <details open={openExtrasSections[index]} className="group">
                              <summary
                                // We add an onClick handler here
                                onClick={(e) => {
                                  // Prevent the default browser action to let React control the state
                                  e.preventDefault();
                                  handleExtrasToggle(index);
                                }}
                                className="list-none flex justify-between items-center cursor-pointer"
                              >
                                <h4 className="text-md font-medium text-gray-800">
                                  {t('room.optionalExtras', 'Optional Extras')}:
                                </h4>
                                {/* This ChevronDown part remains the same */}
                                {rooms > 1 && (
                                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                                )}
                              </summary>
                              <div className="space-y-3 mt-4">
                                {allowedProductKeys(travelMode)
                                  .filter((k) =>
                                    getProductMeta(night.hotel, k, arrangementLength as 3 | 4, optionalProducts),
                                  )
                                  .map((k) => {
                                    const meta = getProductMeta(
                                      night.hotel,
                                      k,
                                      arrangementLength as 3 | 4,
                                      optionalProducts,
                                    )!;

                                    let displayPrice = meta.price;
                                    let priceSuffix = t(`chargingMethods.${meta.chargingMode.toLowerCase()}`, { defaultValue: meta.chargingMode });

                                    const isBicycle = k === 'ElectricBike' || k === 'CityBike';
                                    if (isBicycle) {
                                      displayPrice = arrangementLength === 4 ? meta.price / 3 : meta.price / 2;
                                      priceSuffix = t('optionalProducts.perDay', 'per day');
                                    }

                                    const getTranslatedName = () => {
                                      if (meta?.translations && Object.keys(meta.translations).length > 0) {
                                        return meta.translations[i18n.language] || meta.translations.en || Object.values(meta.translations)[0];
                                      }
                                      return t(`optionalProducts.${k.toLowerCase()}`, k);
                                    };
                                    const label = getTranslatedName();
                                    const selected = room.extras?.[k]?.selected ?? false;
                                    const amount = room.extras?.[k]?.amount ?? 0;
                                    const guestsInThisRoom = (room.occupant_countAdults ?? 0) + (room.occupant_countChildren3_5 ?? 0) + (room.occupant_countChildren6_12 ?? 0);
                                    const disablePlus = amount >= guestsInThisRoom;

                                    return (
                                      <label
                                        key={k}
                                        htmlFor={`extra-${nightIdx}-${index}-${k}`}
                                        className="flex items-center gap-3 cursor-pointer w-full"
                                      >
                                        <input
                                          type="checkbox"
                                          id={`extra-${nightIdx}-${index}-${k}`}
                                          checked={selected}
                                          onChange={() => handleToggleExtra(nightIdx, index, k)}
                                          className="rounded border-gray-300 text-[#2C4A3C] focus:ring-[#2C4A3C]/50 h-4 w-4"
                                        />
                                        <div className="flex-1">
                                          <span className="font-medium text-sm">{label}</span>
                                          <span className="text-xs text-gray-500 ml-2">
                                            €{displayPrice.toFixed(2)} {priceSuffix}
                                          </span>
                                        </div>
                                        {selected && meta.chargingMode === "Once" && (
                                          <div className="flex items-center gap-2 ml-auto">
                                            <button
                                              onClick={(e) => { e.preventDefault(); handleExtraAmountChange(nightIdx, index, k, -1); }}
                                              className="p-0.3 border rounded text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                                              disabled={amount <= 1}
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm">{amount}</span>
                                            <button
                                              onClick={(e) => { e.preventDefault(); handleExtraAmountChange(nightIdx, index, k, 1); }}
                                              className="p-0.3 border rounded text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                                              disabled={disablePlus}
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </label>
                                    );
                                  })}
                                {allowedProductKeys(travelMode).filter((k) =>
                                  getProductMeta(night.hotel, k, arrangementLength as 3 | 4, optionalProducts)
                                ).length === 0 && (
                                    <div className="text-sm text-gray-500 italic">
                                      {t('room.noExtrasAvailableForTravelMode', 'No extras available for this travel mode.')}
                                    </div>
                                  )}
                              </div>
                            </details>
                          </div>

                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                          <span className="text-sm text-gray-600">
                            {t("mealPlan.breakfast", "Breakfast")}
                          </span>
                        </div>
                        {night.board_type === "HB" && (
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                            <span className="text-sm text-gray-600">
                              {t("mealPlan.halfBoard", "Half Board")}
                            </span>
                          </div>
                        )}
                      </div>
                      {night.hotel === "hotel3" &&
                        night.board_type === "B&B" &&
                        selectedBoardOption === "halfboard" && (
                          <p className="mt-2 text-sm text-orange-600">
                            {t(
                              "roomPicker.warning.externalRestaurantsFull",
                              "External restaurants fully booked, only breakfast possible",
                            )}
                          </p>
                        )}
                      <div className="mt-2 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#2C4A3C]" />
                        <span className="text-sm text-gray-600">
                          {t("roomPicker.totalGuests", {
                            count: adults + children3_5 + children6_12,
                            defaultValue: `Total ${adults + children3_5 + children6_12} guests`,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>

        <PricingSummary
          totalPrice={totalPrice}
          nights={selectedArrangement.night_details.length}
          rooms={bookingData.rooms} // Use prop directly
          onReserve={onReserve}
        />
      </div>
      {showRoomDetailModal && modalRoomData && (
        <RoomDetailModal
          room={modalRoomData}
          rawConfig={rawConfig}
          onClose={() => setShowRoomDetailModal(false)}
        />
      )}
    </main>
  );
};

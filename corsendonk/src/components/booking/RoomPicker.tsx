import * as React from "react";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useTranslation } from "react-i18next"; // Import useTranslation
import { MealPlanToggle } from "./MealPlanToggle";
import { RoomDetailModal } from "./RoomDetailModal";
import { format } from "date-fns";
import { nl, enUS, fr } from "date-fns/locale"; // Import required locales
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
} from "lucide-react";

import {
  ageCategoryMapping,
  BoardMapping,
  optionalProducts,
  HOTEL_NAME_MAPPING,
} from "../../mappings/mappings";

// Removed chargingMethodToDutch function - use t('chargingMethods...') instead

import { PricingSummary } from "./PricingSummary";
import { Breadcrumb } from "./Breadcrumb";

interface selectedArrangementInterface {
  night_details: {
    chosen_rooms: {
      bed_capacity: number;
      category_id: string;
      category_name: string;
      occupant_countAdults?: number;
      occupant_countChildren?: number;
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
    children: number;
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
  ) => void;
  onBack: () => void;
}

const sumNightAdults = (night: any) =>
  night.chosen_rooms.reduce(
    (acc: number, r: any) => acc + (r.occupant_countAdults ?? 0),
    0,
  );
const sumNightChildren = (night: any) =>
  night.chosen_rooms.reduce(
    (acc: number, r: any) => acc + (r.occupant_countChildren ?? 0),
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
    // NEW: Check for hotel3 halfboard with restaurant
    if (
      hotel === "hotel3" &&
      board === "halfboard" &&
      restaurantChosen &&
      (restaurantChosen === "Bink" || restaurantChosen === "Bardo")
    ) {
      rateId = hotelRates[board]?.[restaurantChosen] || "";
    } else {
      // Original logic for other hotels/boards or if restaurant is not applicable/provided
      rateId = hotelRates[board] || "";
    }
  }

  return rateId;
}

function calculateTotalPrice(
  arrangement: selectedArrangementInterface | null,
  sumNightAdultsFn: (night: any) => number,
  sumNightChildrenFn: (night: any) => number,
  pricesPerNight: number[],
): number {
  if (!arrangement?.night_details) {
    // console.warn(
    //   "[calculateTotalPrice] No night_details in arrangement. Returning 0.",
    // );
    return 0;
  }

  let total = pricesPerNight.reduce((sum, price) => sum + price, 0);

  arrangement.night_details.forEach((night: any, nightIndex: number) => {
    const assignedAdults = sumNightAdultsFn(night);
    const assignedChildren = sumNightChildrenFn(night);
    const totalGuestsThisNight = assignedAdults + assignedChildren;

    for (const room of night.chosen_rooms) {
      const productsForThisRoom = Object.keys(room?.extras ?? {}).filter(
        (key) => room.extras[key].selected,
      );
      for (const productKey of productsForThisRoom) {
        const product = optionalProducts.find((p) => p.key === productKey);

        if (!product) {
          // console.warn(
          //   `  - Optional product with key "${productKey}" not found in mappings. Skipping.`,
          // );
          continue;
        }

        let addedCost = 0;

        switch (product.chargingMethod) {
          case "Once":
            addedCost =
              product.price[night.hotel] * room.extras[productKey].amount;
            break;
          case "PerPerson":
            addedCost =
              product.price[night.hotel] *
              (parseInt(room.occupant_countChildren ?? "0") +
                parseInt(room.occupant_countAdults ?? "0"));
            break;
          case "PerPersonNight":
            addedCost =
              product.price[night.hotel] *
              (parseInt(room.occupant_countChildren ?? 0) +
                parseInt(room.occupant_countAdults ?? 0));
            break;
          default:
            // console.warn(
            //   `  - Product "${product.name}" (${productKey}): Unknown charging method "${product.chargingMethod}". Skipping.`,
            // );
            break;
        }
        total += addedCost;
      }
    }
  });

  return total;
}

// --- Helper function: Distribute Guests ---
// NOTE: This function mutates the chosenRooms array passed to it.
function distributeGuestsEvenly(
  count: number,
  chosenRooms: any[],
  isAdult: boolean,
): number {
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

  // Adjust based on capacity
  for (let i = 0; i < n; i++) {
    const room = chosenRooms[i];
    const existingAdults = room.occupant_countAdults ?? 0;
    const existingChildren = room.occupant_countChildren ?? 0;
    const used = existingAdults + existingChildren;
    const free = room.bed_capacity - used;
    occupantWanted[i] = Math.min(occupantWanted[i], free);
  }

  // Apply distribution
  let totalPlaced = 0;
  for (let i = 0; i < n; i++) {
    const room = chosenRooms[i];
    if (isAdult) {
      room.occupant_countAdults =
        (room.occupant_countAdults ?? 0) + occupantWanted[i];
    } else {
      room.occupant_countChildren =
        (room.occupant_countChildren ?? 0) + occupantWanted[i];
    }
    totalPlaced += occupantWanted[i];
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

function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Main Component ---
export const RoomPicker: React.FC<RoomPickerProps> = ({
  bookingData,
  onBack,
  onContinue,
}) => {
  const { t, i18n } = useTranslation(); // Instantiate hook
  const [rawConfig, setRawConfig] = useState<any>(null);
  const [arrangements, setArrangements] = useState<{
    breakfast: any;
    halfboard: any;
  }>({
    breakfast: null,
    halfboard: null,
  });
  const [selectedArrangement, setSelectedArrangement] =
    useState<selectedArrangementInterface | null>(null); // Allow null initially
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

  const { startDate, arrangementLength, rooms, adults, children, travelMode } =
    bookingData;

  // Removed getProductPriceFn helper function

  function getPriceForSingleRoom(
    nightlyPricing: any,
    hotel: string,
    boardType: string, // "HB" or "B&B" based on night.board_type
    travelMode: string,
    room: any,
    childrenCount: number,
    adultsCount: number,
    arrangementLengthParam: number,
    restaurantChosen: string | null, // NEW: Add restaurant parameter
  ): number {
    if (!nightlyPricing?.CategoryPrices) {
      setError(
        t(
          "roomPicker.error.noArrangementsAvailableBody",
          "No arrangements available for the selected criteria.",
        ),
      );
      return 0;
    }
    const cat = nightlyPricing.CategoryPrices.find(
      (cp: any) => cp.CategoryId === room.category_id,
    );
    if (!cat) {
      setError(
        t(
          "roomPicker.error.noArrangementsAvailableBody",
          "No arrangements available for the selected criteria.",
        ),
      );
      return 0;
    }

    const occupantTotal = adultsCount + childrenCount;
    const occupantArray: any[] = [];
    const adultAgeCatId = ageCategoryMapping[hotel]?.adult; // Get IDs from imported mapping
    const childAgeCatId = ageCategoryMapping[hotel]?.child;

    if (adultsCount > 0) {
      occupantArray.push({
        AgeCategoryId: adultAgeCatId,
        PersonCount: adultsCount,
      });
    }
    if (childrenCount > 0) {
      occupantArray.push({
        AgeCategoryId: childAgeCatId,
        PersonCount: childrenCount,
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
      for (let i = 0; i < sortedApiOccupancies.length; i++) {
        if (
          sortedApiOccupancies[i].AgeCategoryId !==
            sortedTargetOccupancies[i].AgeCategoryId ||
          sortedApiOccupancies[i].PersonCount !==
            sortedTargetOccupancies[i].PersonCount
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

    if (!occupantPriceEntry) {
      setError(
        t(
          "roomPicker.error.noArrangementsAvailableBody",
          "No arrangements available for the selected criteria.",
        ),
      );
      return 0;
    }

    const rateId = getNightlyRateId(
      hotel,
      boardType,
      travelMode,
      arrangementLengthParam,
      restaurantChosen, // NEW: Pass restaurantChosen
    );

    const rPrice = occupantPriceEntry.RateGroupPrices.find(
      (rgp: any) => rgp.MinRateId === rateId,
    );
    if (!rPrice) {
      setError(
        t(
          "roomPicker.error.noArrangementsAvailableBody",
          "No arrangements available for the selected criteria.",
        ),
      );
      return 0;
    }

    const val = rPrice.MinPrice?.TotalAmount?.GrossValue;
    if (typeof val === "number") {
      return val;
    }

    return 0;
  }

  const [pricesPerNight, setPricesPerNight] = useState<number[]>(
    Array(arrangementLength - 1).fill(0),
  );
  const [totalPrice, setTotalPrice] = useState<number>(0); // Initialize total price to 0

  const [year, month, day] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = `${day}-${month}-${year}`;

  // --- Action: Reserve Button ---
  const onReserve = () => {
    // Validate occupant assignment
    const unassignedGuests = selectedArrangement?.night_details.some(
      (night: any) => {
        const totalAssignedAdults = sumNightAdults(night);
        const totalAssignedChildren = sumNightChildren(night);
        return totalAssignedAdults < adults || totalAssignedChildren < children;
      },
    );

    const emptyRooms = selectedArrangement?.night_details.some((night: any) =>
      night.chosen_rooms.some(
        (room: any) =>
          (room.occupant_countAdults ?? 0) +
            (room.occupant_countChildren ?? 0) ===
          0,
      ),
    );

    if (unassignedGuests || emptyRooms) {
      setError(t("roomPicker.error.guestsNotAssigned"));
      return;
    }

    // Ensure selectedArrangement is not null before proceeding
    if (!selectedArrangement) {
      setError(t("roomPicker.error.noArrangementSelected"));
      // console.error(
      //   "[onReserve] Attempted to continue without a selected arrangement.",
      // );
      return;
    }

    onContinue(
      selectedArrangement, // Pass the arrangement with per-night extras
      pricingData,
      totalPrice,
      selectedBoardOption,
      travelMode,
      rawConfig,
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
          guests: { adults, children },
          amountOfRooms: rooms,
        };

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

        // Check for errors/empty results from availability
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
          ); // Keep this key
          setLoading(false);
          return;
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
            ); // Keep this key
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
        ) => {
          if (!arrangement?.night_details) return arrangement;

          const initialExtrasState = optionalProducts.reduce(
            (acc, product) => {
              acc[product.key] = {
                selected: false,
                amount: 0,
              };
              return acc;
            },
            {} as { [key: string]: boolean },
          );

          arrangement.night_details.forEach((night) => {
            if (night.chosen_rooms) {
              night.chosen_rooms.forEach((room) => {
                if (typeof room.extras !== "object" || room.extras === null) {
                  room.extras = { ...initialExtrasState };
                }
              });
            }
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
        const arrangementWithExtras = initializeExtras(initialArrangementToSet);
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
          // console.warn(
          //   "[RoomPicker InitEffect] No breakfast arrangement, skipping breakfast pricing fetch.",
          // );
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
        console.log(pricingBreakfastRes);
        console.log(pricingHalfBoardRes);
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
        // --- END NEW ---

        setPricingData({
          breakfast: pricingBreakfastRes.data.data,
          halfboard: pricingHalfBoardRes.data.data,
        });
      } catch (err: any) {
        // ADDED LOG
        // console.error(
        //   "[RoomPicker InitEffect] Error during data fetching:",
        //   err,
        // );
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
    children,
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

    // Use functional update with deep copy to prevent race conditions/stale state
    setSelectedArrangement((currentArrangement) => {
      if (!currentArrangement) return null; // Should not happen if guarded above, but safe check

      const updated = JSON.parse(JSON.stringify(currentArrangement)); // Deep copy
      let distributionApplied = false;

      updated.night_details.forEach((night: any) => {
        const chosenRooms = night.chosen_rooms || [];
        // Ensure occupant counts are initialized
        chosenRooms.forEach((r: any) => {
          r.occupant_countAdults ??= 0;
          r.occupant_countChildren ??= 0;
        });

        if (chosenRooms.length === 1) {
          chosenRooms[0].occupant_countAdults = adults;
          chosenRooms[0].occupant_countChildren = children;
          distributionApplied = true;
        } else if (chosenRooms.length >= 2) {
          // Reset first
          chosenRooms.forEach((r: any) => {
            r.occupant_countAdults = 0;
            r.occupant_countChildren = 0;
          });
          // distributeGuestsEvenly mutates chosenRooms inside the 'updated' copy
          const adultsPlaced = distributeGuestsEvenly(
            adults,
            chosenRooms,
            true,
          );
          const childrenPlaced = distributeGuestsEvenly(
            children,
            chosenRooms,
            false,
          );
          // Logs are inside distributeGuestsEvenly now
          distributionApplied = true;
        }
      });

      if (distributionApplied) {
        setDefaultDistributed(true); // Mark as distributed *after* updating state
        return updated; // Return the updated state
      } else {
        setDefaultDistributed(true);
        return currentArrangement; // Return current state if no changes
      }
    });
  }, [selectedArrangement, defaultDistributed, adults, children]); // Keep dependencies

  // --- Effect: Calculate Prices Per Night ---
  useEffect(() => {
    if (
      !selectedArrangement ||
      !pricingData ||
      !selectedArrangement.night_details
    ) {
      return;
    }

    const newPricesPerNight = selectedArrangement.night_details.map(
      (night: any, nightIndex: number) => {
        const chosenRooms = night.chosen_rooms || [];
        const boardKey = selectedBoardOption; // Use the state for the currently selected board
        const nightlyPricingForBoard =
          pricingData[boardKey]?.nightlyPricing || [];

        const foundEntry = nightlyPricingForBoard.find(
          (x: any) => x.date === night.date && x.hotel === night.hotel,
        );

        if (!foundEntry?.pricing) {
          // // ADDED LOG
          // console.warn(`  - No pricing entry found.`);
          return 0;
        }

        const nightTotal = chosenRooms.reduce(
          (acc: number, room: any, roomIndex: number) => {
            const adultsCount = room.occupant_countAdults ?? 0;
            const childrenCount = room.occupant_countChildren ?? 0;

            const roomPrice = getPriceForSingleRoom(
              foundEntry.pricing,
              night.hotel,
              night.board_type, // Use the specific night's board type ('HB' or 'B&B') for rate lookup
              travelMode,
              room,
              childrenCount,
              adultsCount,
              arrangementLength,
              night.restaurant_chosen, // NEW: Pass restaurant_chosen
            );
            return acc + roomPrice;
          },
          0,
        );

        return nightTotal;
      },
    );

    setPricesPerNight(newPricesPerNight);
  }, [
    selectedArrangement,
    pricingData,
    selectedBoardOption,
    travelMode,
    arrangementLength,
  ]);

  // --- Effect: Calculate Total Price ---
  useEffect(() => {
    // Recalculate total price whenever relevant state changes
    const newTotal = calculateTotalPrice(
      selectedArrangement,
      sumNightAdults,
      sumNightChildren,
      pricesPerNight,
    );
    setTotalPrice(newTotal);
  }, [selectedArrangement, pricesPerNight]); // Depends on arrangement (for extras) and room prices

  const handleBoardToggle = (option: "breakfast" | "halfboard") => {
    setSelectedBoardOption(option);

    const newArrangementData = arrangements[option];

    if (newArrangementData) {
      // Initialize extras for the new arrangement before setting it

      const initialExtrasState = optionalProducts.reduce(
        (acc, product) => {
          acc[product.key] = {
            selected: false,
            amount: 0,
          };
          return acc;
        },
        {} as { [key: string]: boolean },
      );

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
        const updatedArrangement = JSON.parse(
          JSON.stringify(currentArrangement),
        );

        const room =
          updatedArrangement.night_details[nightIndex].chosen_rooms[roomIndex];
        if (room && typeof room.extras === "object" && room.extras !== null) {
          if (!room.extras[extraKey]?.selected) {
            room.extras[extraKey] = { selected: true, amount: 1 };
          } else {
            room.extras[extraKey].selected = false;
            room.extras[extraKey].amount = 0;
          }
        } else {
          // console.warn(
          //   `[handleToggleExtra] Could not find night or extras object at index ${roomIndex}`,
          // );
        }

        return updatedArrangement;
      });
    },
    [],
  );

  const handleExtraAmountChange = useCallback(
    (nightIdx: number, roomIndex: number, extraKey: string, delta: number) => {
      setSelectedArrangement((currentArrangement) => {
        if (!currentArrangement) return null;

        const updatedArrangement = JSON.parse(
          JSON.stringify(currentArrangement),
        );

        const room =
          updatedArrangement.night_details[nightIdx].chosen_rooms[roomIndex];
        if (room?.extras?.[extraKey]?.selected) {
          const currentAmount = room.extras[extraKey].amount ?? 1;
          room.extras[extraKey].amount = Math.max(1, currentAmount + delta);
        } else {
          // console.warn(
          //   `[handleExtraAmountChange] Could not find selected extra at index ${roomIndex}`,
          // );
        }

        return updatedArrangement;
      });
    },
    [],
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
    // console.warn(
    //   "[RoomPicker Render] No selectedArrangement available for rendering. Displaying 'Not Found' message.",
    // );
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
                                    (room.occupant_countChildren ?? 0);

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
                                      room.occupant_countChildren ?? 0,
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
                                                targetRoom.occupant_countChildren ||
                                                0;
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
                                          (room.occupant_countChildren || 0) >=
                                          room.bed_capacity ||
                                        currentAssignedAdults >= adults
                                      }
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {children > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">
                                      {t("occupancy.children", "Children")}:
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
                                        (room.occupant_countChildren || 0) === 0
                                      }
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countChildren || 0}
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
                                                targetRoom.occupant_countChildren ||
                                                0;
                                              const totalChildrenAssignedThisNight =
                                                sumNightChildren(targetNight);

                                              if (
                                                currentAdultsInRoom +
                                                  currentChildrenInRoom +
                                                  1 <=
                                                  targetRoom.bed_capacity &&
                                                totalChildrenAssignedThisNight <
                                                  children
                                              ) {
                                                targetRoom.occupant_countChildren =
                                                  currentChildrenInRoom + 1;
                                              }
                                            }
                                            return newArrangement;
                                          },
                                        );
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      disabled={
                                        (room.occupant_countAdults ?? 0) +
                                          (room.occupant_countChildren ?? 0) >=
                                          room.bed_capacity ||
                                        currentAssignedChildren >= children
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
                              currentAssignedChildren < children) && (
                              <div className="mt-2 text-sm min-h-6 text-red-600">
                                {currentAssignedAdults < adults && (
                                  <p>
                                    {t("roomPicker.warning.adultsUnassigned", {
                                      count: adults - currentAssignedAdults,
                                      defaultValue: `${
                                        adults - currentAssignedAdults
                                      } adult(s) unassigned!`,
                                    })}
                                  </p>
                                )}
                                {currentAssignedChildren < children && (
                                  <p>
                                    {t(
                                      "roomPicker.warning.childrenUnassigned",
                                      {
                                        count:
                                          children - currentAssignedChildren,
                                        defaultValue: `${
                                          children - currentAssignedChildren
                                        } child(ren) unassigned!`,
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          {rooms > 1 &&
                            room.occupant_countAdults === 0 &&
                            room.occupant_countChildren === 0 && (
                              <div className="mt-2 text-sm text-red-600">
                                {t(
                                  "roomPicker.warning.noGuestsAssigned",
                                  "No guests assigned to this room!",
                                )}
                              </div>
                            )}
                          {/* Optional Extras Section Start */}
                          {/*
                          <div className="mt-6 pt-4 border-t">
                            <h4 className="text-md font-medium text-gray-800 mb-3">
                              {t('room.optionalExtras', 'Optional Extras')}:
                            </h4>
                            <div className="space-y-3">
                              {optionalProducts
                                .filter((product) =>
                                  product.availableFor.includes(travelMode),
                                )
                                .map((product) => (
                                  <div
                                    key={product.key}
                                    className="flex items-center gap-3 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        night.chosen_rooms[index]?.extras?.[
                                          product.key
                                        ]?.selected ?? false
                                      }
                                      onChange={() =>
                                        handleToggleExtra(
                                          nightIdx,
                                          index,
                                          product.key,
                                        )
                                      }
                                      className="rounded border-gray-300 text-[#2C4A3C] focus:ring-[#2C4A3C]/50 h-4 w-4"
                                    />
                                    <div>
                                      <span className="font-medium text-sm">
                                        {product.name}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        {`€${product.price[night.hotel].toFixed(
                                          2,
                                        )} ${t(
                                          `chargingMethods.${product.chargingMethod.toLowerCase()}`,
                                          { defaultValue: product.chargingMethod } // Fallback if key missing
                                        )}`}
                                      </span>
                                    </div>
                                    {night.chosen_rooms[index]?.extras?.[
                                      product.key
                                    ]?.selected &&
                                      product.chargingMethod == "Once" && (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() =>
                                              handleExtraAmountChange(
                                                nightIdx,
                                                index,
                                                product.key,
                                                -1,
                                              )
                                            }
                                            className="p-1 border rounded text-gray-600 hover:bg-gray-100"
                                            disabled={
                                              night.chosen_rooms[index]
                                                ?.extras?.[product.key]
                                                ?.amount <= 1
                                            }
                                          >
                                            -
                                          </button>
                                          <span className="text-sm">
                                            {night.chosen_rooms[index]
                                              ?.extras?.[product.key]?.amount ??
                                              1}
                                          </span>
                                          <button
                                            onClick={() =>
                                              handleExtraAmountChange(
                                                nightIdx,
                                                index,
                                                product.key,
                                                1,
                                              )
                                            }
                                            className="p-1 border rounded text-gray-600 hover:bg-gray-100"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              {optionalProducts.filter((p) =>
                                p.availableFor.includes(travelMode),
                              ).length === 0 && (
                                <div className="text-sm text-gray-500 italic">
                                  {t('room.noExtrasAvailableForTravelMode', 'No extras available for this travel mode.')}
                                </div>
                              )}
                            </div>
                          </div>
                          */}
                          {/* Optional Extras Section End */}
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
                            count: adults + children,
                            defaultValue: `Total ${adults + children} guests`,
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

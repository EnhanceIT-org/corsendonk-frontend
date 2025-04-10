import * as React from "react";
import { useEffect, useState } from "react";
import { MealPlanToggle } from "./MealPlanToggle";
import { OptionalExtras } from "./OptionalExtras";
import { RoomDetailModal } from "./RoomDetailModal";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import axios from "axios";
import { fetchWithBaseUrl } from "@/lib/utils";
import {
  Coffee,
  UtensilsCrossed,
  Plus,
  Minus,
  Bike,
  Footprints,
  User,
  Info,
  ArrowLeft,
  XCircle,
} from "lucide-react";
// --- Ensure mappings are correctly imported ---
import {
  ageCategoryMapping,
  BoardMapping,
  PRODUCT_NAMES,
  OPTIONAL_PRODUCT_IDS,
  HOTEL_NAME_MAPPING,
} from "@/mappings/mappings";
// --- End mapping imports ---
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
    }[];
    board_type: string;
    date: string;
    hotel: string;
    notes: string[];
    restaurant_chosen: string;
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
    selectedArrangement: any,
    pricingData: any,
    totalPrice: number,
    optionalProducts: any,
    boardOption: any,
    travelMode: "walking" | "cycling",
    rawConfig: any, // NEW: added rawConfig as 7th parameter
  ) => void;
  onBack: () => void;
}


// --- START: Define sumNightAdults and sumNightChildren ---
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
// --- END: Define sumNightAdults and sumNightChildren ---

// Function to get display name (using mapping with fallback)
function getHotelDisplayName(hotelKey: string): string {
  return HOTEL_NAME_MAPPING[hotelKey] || hotelKey; // Use mapping, fallback to key if not found
}

// --- Helper function: Get Rate ID ---
function getNightlyRateId(
  hotel: string,
  boardType: string, // "HB" or "B&B"
  travelMode: string,
  arrangementLength: number,
) {
  // ADDED LOG
  console.log(`[getNightlyRateId] Args: hotel=${hotel}, boardType=${boardType}, travelMode=${travelMode}, length=${arrangementLength}`);

  const board = boardType === "HB" ? "halfboard" : "breakfast";
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  const lengthKey = arrangementLength === 3 ? "3D" : "4D";
  const rateId = BoardMapping[hotel]?.[mode]?.[lengthKey]?.[board] || "";

  // ADDED LOG
  console.log(`[getNightlyRateId] Result: Mapping Key Path: [${hotel}][${mode}][${lengthKey}][${board}], Found RateId: "${rateId}"`);
  return rateId;
}

// --- Helper function: Get Product Charging Method ---
function getProductChargingMethodFn(
  hotelKey: string,
  productName: string,
  config: any,
): string | null {
  // ADDED LOG
  console.log(`[getProductChargingMethodFn] Args: hotelKey=${hotelKey}, productName="${productName}"`);

  // Safeguards
  if (
    !config ||
    !config[hotelKey] ||
    !config[hotelKey].rawConfig ||
    !config[hotelKey].rawConfig.Configurations ||
    config[hotelKey].rawConfig.Configurations.length === 0
  ) {
    // ADDED LOG
    console.warn(`[getProductChargingMethodFn] Invalid config structure for hotel ${hotelKey}.`);
    return null;
  }

  const raw = config[hotelKey].rawConfig;
  const products = raw.Configurations[0].Enterprise?.Products || [];

   // ADDED LOG (Optional: uncomment if needed, can be verbose)
   // console.log(`[getProductChargingMethodFn] Searching products in hotel ${hotelKey}:`, products.map((p: any) => p.Name?.['en-GB']));

  // Find the product by matching its "Name" to productName
  const product = products.find((p: any) => p.Name?.["en-GB"] === productName);

  if (!product) {
     // ADDED LOG
     console.warn(`[getProductChargingMethodFn] Product "${productName}" not found in hotel ${hotelKey}.`);
     return null;
  }

  // ADDED LOG
  console.log(`[getProductChargingMethodFn] Found product "${productName}". Charging: ${product.Charging}`);
  return product.Charging || null;
}

// --- Helper function: Calculate Total Price ---
function calculateTotalPrice(
  arrangement: any,
  pricingDataObj: any, // Renamed to avoid conflict
  travelMode: string,
  adults: number,
  children: number,
  rooms: number,
  config: any,
  selectedOptionalProducts: { [key: string]: boolean },
  sumNightAdultsFn: (night: any) => number, // Pass the function type
  sumNightChildrenFn: (night: any) => number, // Pass the function type
  getProductPriceFn: (
    hotelKey: string,
    productName: string,
    config: any,
  ) => number,
  pricesPerNight: number[],
): number {
   // ADDED LOG
   console.log('[calculateTotalPrice] Args:', {
    nights: arrangement?.night_details?.length,
    travelMode,
    guests: { adults, children },
    rooms,
    selectedOptionalProducts,
    pricesPerNight,
  });

  if (!arrangement?.night_details) {
    // ADDED LOG
    console.warn('[calculateTotalPrice] No night_details in arrangement. Returning 0.');
    return 0;
  }

  // 1) Start total with the sum of all room-night prices.
  let total = 0;
  for (const price of pricesPerNight) {
    total += price;
  }
  // ADDED LOG
  console.log(`[calculateTotalPrice] Initial total from pricesPerNight: ${total}`);

  // 2) Build active optional product names lookup
  const activeOptionalProductNames = Object.keys(selectedOptionalProducts)
    .filter((key) => selectedOptionalProducts[key])
    .map((key) => PRODUCT_NAMES[key]); // Use the central mapping
  // ADDED LOG
  console.log('[calculateTotalPrice] Active optional product names:', activeOptionalProductNames);

  // 3) Keep track for 'Once' and 'PerPerson'
  const processedOnce = new Set<string>();
  const processedPerPerson = new Set<string>();

  // 4) Loop over each night for optional products
  for (const night of arrangement.night_details) {
    const assignedAdults = sumNightAdultsFn(night); // Use the passed function
    const assignedChildren = sumNightChildrenFn(night); // Use the passed function
    // ADDED LOG
    console.log(`[calculateTotalPrice] Processing Night: ${night.date} (${night.hotel}), Guests: ${assignedAdults}A, ${assignedChildren}C`);

    for (const optProductName of activeOptionalProductNames) {
      // Get price and charging method (these functions should log internally)
      const productPrice = getProductPriceFn( night.hotel, optProductName, config );
      const chargingMethod = getProductChargingMethodFn( night.hotel, optProductName, config );

      if (!chargingMethod) {
         // ADDED LOG
         console.warn(`  - Product "${optProductName}": No charging method found. Skipping.`);
         continue;
      }

      const hotelProductKey = `${night.hotel}-${optProductName}`;
      let addedCost = 0;

      switch (chargingMethod) {
        case "Once":
          if (!processedOnce.has(hotelProductKey)) {
            addedCost = productPrice;
            total += addedCost;
            processedOnce.add(hotelProductKey);
            // ADDED LOG
            console.log(`  - Product "${optProductName}": Added ${addedCost} (Once)`);
          } else {
            // ADDED LOG
            console.log(`  - Product "${optProductName}": Skipped (Already added Once for this hotel)`);
          }
          break;

        case "PerPerson":
           if (!processedPerPerson.has(hotelProductKey)) {
             addedCost = productPrice * (assignedAdults + assignedChildren);
             total += addedCost;
             processedPerPerson.add(hotelProductKey);
             // ADDED LOG
             console.log(`  - Product "${optProductName}": Added ${addedCost} (PerPerson: ${productPrice} * ${assignedAdults + assignedChildren})`);
          } else {
              // ADDED LOG
              console.log(`  - Product "${optProductName}": Skipped (Already added PerPerson for this hotel)`);
          }
          break;

        case "PerPersonNight":
          addedCost = productPrice * (assignedAdults + assignedChildren);
          total += addedCost;
          // ADDED LOG
          console.log(`  - Product "${optProductName}": Added ${addedCost} (PerPersonNight: ${productPrice} * ${assignedAdults + assignedChildren})`);
          break;

        default:
          // ADDED LOG
          console.warn(`  - Product "${optProductName}": Unknown charging method "${chargingMethod}". Skipping.`);
          break;
      }
    }
  }

  // ADDED LOG
  console.log(`[calculateTotalPrice] Final calculated total: ${total}`);
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

  // ADDED LOG
  console.log(`[distributeGuestsEvenly] Distributing ${count} ${isAdult ? 'Adults' : 'Children'} into ${n} rooms`);

  const base = Math.floor(count / n);
  let remainder = count % n;
  const occupantWanted = new Array(n).fill(base);
  for (let i = 0; i < n; i++) {
    if (remainder > 0) {
      occupantWanted[i] += 1;
      remainder--;
    }
  }

  // ADDED LOG
  console.log(`[distributeGuestsEvenly] Initial distribution plan:`, occupantWanted);

  // Adjust based on capacity
  for (let i = 0; i < n; i++) {
    const room = chosenRooms[i];
    const existingAdults = room.occupant_countAdults || 0;
    const existingChildren = room.occupant_countChildren || 0;
    const used = existingAdults + existingChildren;
    const free = room.bed_capacity - used;
    occupantWanted[i] = Math.min(occupantWanted[i], free);
  }

  // ADDED LOG
  console.log(`[distributeGuestsEvenly] Capacity-adjusted plan:`, occupantWanted);

  // Apply distribution
  let totalPlaced = 0;
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

  // ADDED LOG
  console.log(`[distributeGuestsEvenly] Total placed: ${totalPlaced}/${count}. Final room counts:`, chosenRooms.map(r => ({ a: r.occupant_countAdults, c: r.occupant_countChildren, cap: r.bed_capacity })));
  return totalPlaced;
}

// --- Helper functions: Date/String Formatting ---
function formatDutchDate(dateString: string) {
  const raw = format(new Date(dateString), "EEEE, d MMMM", { locale: nl });
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
  const [selectedOptionalProducts, setSelectedOptionalProducts] = useState<{
    lunch: boolean;
    bicycleRent: boolean;
    bicycleTransport: boolean;
  }>({
    lunch: false,
    bicycleRent: false,
    bicycleTransport: false,
  });
  const [selectedBoardOption, setSelectedBoardOption] = useState<
    "breakfast" | "halfboard"
  >(bookingData.boardOption);
  const [defaultDistributed, setDefaultDistributed] = useState(false);

  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [modalRoomData, setModalRoomData] = useState<any>(null);

  const { startDate, arrangementLength, rooms, adults, children, travelMode } =
    bookingData;

  // --- Helper function: Get Product Price (defined inside component scope) ---
  const getProductPriceFn = (
    hotelKey: string,
    productName: string,
    config: any,
  ): number => {
    // ADDED LOG
    console.log(`[getProductPriceFn] Args: hotelKey=${hotelKey}, productName="${productName}"`);

    if (
      config &&
      config[hotelKey] &&
      config[hotelKey].rawConfig &&
      config[hotelKey].rawConfig.Configurations &&
      config[hotelKey].rawConfig.Configurations.length > 0
    ) {
      const raw = config[hotelKey].rawConfig;
      const products = raw.Configurations[0].Enterprise?.Products || [];

      // ADDED LOG (Optional: uncomment if needed)
      // console.log(`[getProductPriceFn] Searching products in hotel ${hotelKey}:`, products.map((p: any) => p.Name?.['en-GB']));

      const product = products.find(
        (p: any) =>
          p.Name?.["en-GB"] === productName && p.Prices && p.Prices["EUR"],
      );

      if (product) {
        // ADDED LOG
        console.log(`[getProductPriceFn] Found product "${productName}" with price: ${product.Prices["EUR"]}`);
        return product.Prices["EUR"];
      } else {
        // ADDED LOG
        console.warn(`[getProductPriceFn] Product "${productName}" not found or has no EUR price in hotel ${hotelKey}.`);
      }
    } else {
      // ADDED LOG
      console.warn(`[getProductPriceFn] Invalid config structure for hotel ${hotelKey}.`);
    }
    // ADDED LOG
    console.log(`[getProductPriceFn] Returning 0 for product "${productName}".`);
    return 0;
  };

  // --- Helper function: Get Price for a Single Room/Night (defined inside component scope) ---
  function getPriceForSingleRoom(
    nightlyPricing: any, // Specific night's pricing object
    hotel: string,
    boardType: string, // "HB" or "B&B" based on night.board_type
    travelMode: string,
    room: any,
    childrenCount: number, // Renamed for clarity
    adultsCount: number,   // Renamed for clarity
    arrangementLengthParam: number, // Renamed for clarity
  ): number {
    // ADDED LOG
    console.log('[getPriceForSingleRoom] Args:', { hotel, boardType, travelMode, room_category_id: room.category_id, childrenCount, adultsCount, arrangementLengthParam });
    // ADDED LOG (Optional: uncomment if large)
    // console.log('[getPriceForSingleRoom] Searching nightlyPricing structure:', JSON.stringify(nightlyPricing, null, 2));


    if (!nightlyPricing?.CategoryPrices) {
      // ADDED LOG
      console.log('[getPriceForSingleRoom] Failed: No CategoryPrices found in nightlyPricing.');
      return 0;
    }
    const cat = nightlyPricing.CategoryPrices.find(
      (cp: any) => cp.CategoryId === room.category_id,
    );
    if (!cat) {
      // ADDED LOG
      console.log(`[getPriceForSingleRoom] Failed: CategoryPrice not found for CategoryId: ${room.category_id}`);
      return 0;
    }
    // ADDED LOG
    console.log(`[getPriceForSingleRoom] Found CategoryPrice for ${room.category_id}`); // Removed data object log for brevity

    const occupantTotal = adultsCount + childrenCount;
    const occupantArray: any[] = [];
    const adultAgeCatId = ageCategoryMapping[hotel]?.adult; // Get IDs from imported mapping
    const childAgeCatId = ageCategoryMapping[hotel]?.child;

    if (adultsCount > 0) {
      occupantArray.push({ AgeCategoryId: adultAgeCatId, PersonCount: adultsCount });
    }
    if (childrenCount > 0) {
      occupantArray.push({ AgeCategoryId: childAgeCatId, PersonCount: childrenCount });
    }
    // ADDED LOG
    console.log('[getPriceForSingleRoom] Constructed occupantArray for lookup:', occupantArray);
    // ADDED LOG (Optional: uncomment if needed)
    // console.log('[getPriceForSingleRoom] Available OccupancyPrices:', cat.OccupancyPrices);

    // --- Occupancy Price Lookup Logic ---
    let occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
      if (!op.Occupancies || op.Occupancies.length !== occupantArray.length) return false;
      const sortedApiOccupancies = [...op.Occupancies].sort((a, b) =>
        (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
      );
      const sortedTargetOccupancies = [...occupantArray].sort((a, b) =>
        (a.AgeCategoryId || "").localeCompare(b.AgeCategoryId || ""),
      );
      for (let i = 0; i < sortedApiOccupancies.length; i++) {
        if (
          sortedApiOccupancies[i].AgeCategoryId !== sortedTargetOccupancies[i].AgeCategoryId ||
          sortedApiOccupancies[i].PersonCount !== sortedTargetOccupancies[i].PersonCount
        ) {
          return false;
        }
      }
      return true;
    });

    if (occupantPriceEntry) {
      // ADDED LOG
      console.log('[getPriceForSingleRoom] Found matching OccupancyPrice (exact match)'); // Removed data object log
    } else {
      // ADDED LOG
      console.log('[getPriceForSingleRoom] No exact OccupancyPrice match found. Trying fallback (total occupancy).');
      occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
         const sum = op.Occupancies.reduce( (acc: number, x: any) => acc + x.PersonCount, 0, );
         return sum === occupantTotal;
      });
      if (occupantPriceEntry) {
         // ADDED LOG
         console.log('[getPriceForSingleRoom] Found matching OccupancyPrice (total occupancy fallback)'); // Removed data object log
      }
    }
    // --- End Occupancy Price Lookup ---

    if (!occupantPriceEntry) {
      // ADDED LOG
      console.log('[getPriceForSingleRoom] Failed: No OccupancyPrice found for specified adults/children or total occupancy.');
      return 0;
    }

    const rateId = getNightlyRateId( hotel, boardType, travelMode, arrangementLengthParam );
    // ADDED LOG
    console.log(`[getPriceForSingleRoom] Looking for RateId: ${rateId}`);
    // ADDED LOG (Optional: uncomment if needed)
    // console.log(`[getPriceForSingleRoom] Available RateGroupPrices:`, occupantPriceEntry.RateGroupPrices);

    const rPrice = occupantPriceEntry.RateGroupPrices.find(
      (rgp: any) => rgp.MinRateId === rateId,
    );
    if (!rPrice) {
      // ADDED LOG
      console.log(`[getPriceForSingleRoom] Failed: RateGroupPrice not found for MinRateId: ${rateId}`);
      return 0;
    }
    // ADDED LOG
    console.log(`[getPriceForSingleRoom] Found RateGroupPrice for ${rateId}`); // Removed data object log

    const val = rPrice.MinPrice?.TotalAmount?.GrossValue;
    if (typeof val === 'number') {
       // ADDED LOG
       console.log(`[getPriceForSingleRoom] Success: Returning price: ${val}`);
       return val;
    }

    // ADDED LOG
    console.log('[getPriceForSingleRoom] Failed: GrossValue not found or not a number in MinPrice.TotalAmount.');
    return 0;
  }
  // --- End getPriceForSingleRoom ---

  const [pricesPerNight, setPricesPerNight] = useState<number[]>(
    Array(arrangementLength - 1).fill(0),
  );
  const [totalPrice, setTotalPrice] = useState<number>(0); // Initialize total price to 0

  const [year, month, day] = startDate.split("-");
  const formattedStartDateGET = `${year}-${month}-${day}`;
  const formattedStartDatePOST = `${day}-${month}-${year}`;

  // --- Action: Reserve Button ---
  const onReserve = () => {
    // ADDED LOG
    console.log('[RoomPicker onReserve] Proceeding to next step with:', {
      selectedArrangement,
      pricingData,
      totalPrice,
      selectedOptionalProducts,
      selectedBoardOption,
      travelMode,
      rawConfig,
    });
    onContinue(
      selectedArrangement,
      pricingData,
      totalPrice,
      selectedOptionalProducts,
      selectedBoardOption,
      travelMode,
      rawConfig,
    );
  };

  // --- Effect: Fetch Initial Data ---
  useEffect(() => {
    // ADDED LOG: Log imported mappings used by this component instance
    console.log('[RoomPicker InitEffect] Using BoardMapping:', BoardMapping);
    console.log('[RoomPicker InitEffect] Using ageCategoryMapping:', ageCategoryMapping);
    console.log('[RoomPicker InitEffect] Using PRODUCT_NAMES:', PRODUCT_NAMES);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // ADDED LOG
      console.log('[RoomPicker InitEffect] Fetching data with:', { formattedStartDateGET, arrangementLength, adults, children, rooms, formattedStartDatePOST });
      try {
        const configRes = await fetchWithBaseUrl(
          `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangementLength}`,
        );
        if (!configRes.ok) {
           // ADDED LOG
           console.error('[RoomPicker InitEffect] Failed to fetch config response:', configRes.status, configRes.statusText);
           throw new Error(`Failed to fetch configuration (${configRes.status})`);
        }
        const configData = await configRes.json();
        // ADDED LOG (Log the whole structure initially)
        console.log('[RoomPicker InitEffect] Received rawConfig data:', JSON.stringify(configData, null, 2)); // Stringify for better inspection
        // ADDED LOG (More specific)
        console.log('[RoomPicker InitEffect] Received hotels config:', configData?.data?.hotels);
        setRawConfig(configData.data.hotels); // Assuming structure is { data: { hotels: {...} } }

        const payload = {
          startDate: formattedStartDatePOST,
          length: arrangementLength,
          guests: { adults, children },
          amountOfRooms: rooms,
        };
        // ADDED LOG
        console.log('[RoomPicker InitEffect] Availability Payload:', payload);

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

        // ADDED LOG
        console.log('[RoomPicker InitEffect] Received Breakfast Availability Response:', availBreakfastRes.data);
        console.log('[RoomPicker InitEffect] Received Halfboard Availability Response:', availHalfBoardRes.data);

        const availBreakfast = availBreakfastRes.data.data;
        const availHalfBoard = availHalfBoardRes.data.data;

        // Check for errors/empty results from availability
        if (availBreakfast?.error && availHalfBoard?.error) {
          console.error("[RoomPicker InitEffect] Both availability calls returned errors:", { breakfastError: availBreakfast.error, halfboardError: availHalfBoard.error });
          setError(availBreakfast.error || availHalfBoard.error || "Geen beschikbare kamers gevonden, probeer andere data");
          setLoading(false);
          return;
        }
        if (!availBreakfast?.optimal_sequence && !availHalfBoard?.optimal_sequence) {
          console.error("[RoomPicker InitEffect] No optimal sequences found in either availability response.");
          setError("Geen beschikbare arrangementen gevonden voor deze selectie.");
          setLoading(false);
          return;
        }

        // ADDED LOG
        console.log('[RoomPicker InitEffect] Setting arrangements state with:', {
          breakfast: availBreakfast?.optimal_sequence,
          halfboard: availHalfBoard?.optimal_sequence
        });
        setArrangements({
          breakfast: availBreakfast?.optimal_sequence,
          halfboard: availHalfBoard?.optimal_sequence,
        });

        // Determine initial arrangement based on bookingData *after* fetching
        const initialArrangement = bookingData.boardOption === 'breakfast'
            ? availBreakfast?.optimal_sequence
            : availHalfBoard?.optimal_sequence;

        // ADDED LOG
        console.log(`[RoomPicker InitEffect] Initial board option from bookingData: ${bookingData.boardOption}`);
        console.log('[RoomPicker InitEffect] Initial selected arrangement candidate:', initialArrangement ? 'Found' : 'Not Found');

        if (!initialArrangement) {
           console.warn(`[RoomPicker InitEffect] No optimal sequence available for the initial board option: ${bookingData.boardOption}. Trying the other board option.`);
           // Try falling back to the *other* option if the preferred one is missing
           const fallbackArrangement = bookingData.boardOption === 'breakfast'
               ? availHalfBoard?.optimal_sequence
               : availBreakfast?.optimal_sequence;

            if (!fallbackArrangement) {
                 console.error("[RoomPicker InitEffect] No optimal sequence found for either board option.");
                 setError("Geen beschikbaar arrangement gevonden voor de geselecteerde opties.");
                 setLoading(false);
                 return;
            } else {
                 console.log(`[RoomPicker InitEffect] Using fallback arrangement: ${bookingData.boardOption === 'breakfast' ? 'halfboard' : 'breakfast'}`);
                 setSelectedArrangement(fallbackArrangement);
                 // IMPORTANT: Update the selectedBoardOption state to match the fallback!
                 setSelectedBoardOption(bookingData.boardOption === 'breakfast' ? 'halfboard' : 'breakfast');
            }

        } else {
           console.log('[RoomPicker InitEffect] Setting selectedArrangement with initial candidate.');
           setSelectedArrangement(initialArrangement);
           // Ensure selectedBoardOption matches the initial one from bookingData
           setSelectedBoardOption(bookingData.boardOption);
        }


        // Fetch pricing data *only if* we have valid arrangements to fetch for
        const pricingPromises = [];
        if (availBreakfast?.optimal_sequence) {
             pricingPromises.push(axios.post(`${import.meta.env.VITE_API_URL}/reservations/pricing/`, {
                 selectedArrangement: availBreakfast.optimal_sequence,
             }));
        } else {
             pricingPromises.push(Promise.resolve({ data: { data: null } })); // Placeholder if no breakfast arrangement
             console.warn("[RoomPicker InitEffect] No breakfast arrangement, skipping breakfast pricing fetch.");
        }

        if (availHalfBoard?.optimal_sequence) {
              pricingPromises.push(axios.post(`${import.meta.env.VITE_API_URL}/reservations/pricing/`, {
                 selectedArrangement: availHalfBoard.optimal_sequence,
             }));
        } else {
             pricingPromises.push(Promise.resolve({ data: { data: null } })); // Placeholder if no halfboard arrangement
             console.warn("[RoomPicker InitEffect] No halfboard arrangement, skipping halfboard pricing fetch.");
        }


        const [pricingBreakfastRes, pricingHalfBoardRes] = await Promise.all(pricingPromises);

        // ADDED LOG
        console.log('[RoomPicker InitEffect] Received Breakfast Pricing Response:', pricingBreakfastRes.data);
        console.log('[RoomPicker InitEffect] Received Halfboard Pricing Response:', pricingHalfBoardRes.data);

        setPricingData({
          breakfast: pricingBreakfastRes.data.data,
          halfboard: pricingHalfBoardRes.data.data,
        });

      } catch (err: any) {
        // ADDED LOG
        console.error('[RoomPicker InitEffect] Error during data fetching:', err);
        if (err.response) {
            console.error('[RoomPicker InitEffect] Error response data:', err.response.data);
            console.error('[RoomPicker InitEffect] Error response status:', err.response.status);
        }
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ // Dependencies remain the same
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
    if (!selectedArrangement || defaultDistributed || !selectedArrangement.night_details) {
       // ADDED LOG (Optional: uncomment if needed)
       // console.log('[RoomPicker DistributeGuestsEffect] Skipping distribution:', { hasArrangement: !!selectedArrangement, defaultDistributed, hasNightDetails: !!selectedArrangement?.night_details });
       return;
    }

    // ADDED LOG
    console.log('[RoomPicker DistributeGuestsEffect] Running guest distribution:', { adults, children, rooms: selectedArrangement.night_details[0]?.chosen_rooms?.length });

    // Use functional update with deep copy to prevent race conditions/stale state
    setSelectedArrangement(currentArrangement => {
        if (!currentArrangement) return null; // Should not happen if guarded above, but safe check

        const updated = JSON.parse(JSON.stringify(currentArrangement)); // Deep copy
        let distributionApplied = false;

        updated.night_details.forEach((night: any) => {
          const chosenRooms = night.chosen_rooms || [];
          // Ensure occupant counts are initialized
          chosenRooms.forEach((r: any) => {
               r.occupant_countAdults = r.occupant_countAdults ?? 0;
               r.occupant_countChildren = r.occupant_countChildren ?? 0;
          });

          if (chosenRooms.length === 1) {
            console.log(`[RoomPicker DistributeGuestsEffect] Night ${night.date}: Assigning all guests to single room.`);
            chosenRooms[0].occupant_countAdults = adults;
            chosenRooms[0].occupant_countChildren = children;
            distributionApplied = true;
          } else if (chosenRooms.length >= 2) {
            console.log(`[RoomPicker DistributeGuestsEffect] Night ${night.date}: Distributing guests among ${chosenRooms.length} rooms.`);
            // Reset first
            chosenRooms.forEach((r: any) => {
              r.occupant_countAdults = 0;
              r.occupant_countChildren = 0;
            });
            // distributeGuestsEvenly mutates chosenRooms inside the 'updated' copy
            const adultsPlaced = distributeGuestsEvenly(adults, chosenRooms, true);
            const childrenPlaced = distributeGuestsEvenly(children, chosenRooms, false);
            // Logs are inside distributeGuestsEvenly now
            distributionApplied = true;
          }
        });

         if (distributionApplied) {
             // ADDED LOG
             console.log('[RoomPicker DistributeGuestsEffect] Setting updated arrangement and marking as distributed.');
             setDefaultDistributed(true); // Mark as distributed *after* updating state
             return updated; // Return the updated state
         } else {
              // ADDED LOG
              console.log('[RoomPicker DistributeGuestsEffect] No distribution logic applied (e.g., no rooms). Marking distributed.');
              setDefaultDistributed(true);
              return currentArrangement; // Return current state if no changes
         }
    });

  }, [selectedArrangement, defaultDistributed, adults, children]); // Keep dependencies

  // --- Effect: Calculate Prices Per Night ---
  useEffect(() => {
    if (!selectedArrangement || !pricingData || !selectedArrangement.night_details) {
       // ADDED LOG (Optional: uncomment if needed)
       // console.log('[RoomPicker PricesPerNightEffect] Skipping: Missing data', { hasArrangement: !!selectedArrangement, hasPricing: !!pricingData, hasDetails: !!selectedArrangement?.night_details });
       return;
    }
    // ADDED LOG
    console.log(`[RoomPicker PricesPerNightEffect] Calculating pricesPerNight for board: ${selectedBoardOption}...`);

    const newPricesPerNight = selectedArrangement.night_details.map((night: any, nightIndex: number) => {
      const chosenRooms = night.chosen_rooms || [];
      const boardKey = selectedBoardOption; // Use the state for the currently selected board
      const nightlyPricingForBoard = pricingData[boardKey]?.nightlyPricing || [];

      const foundEntry = nightlyPricingForBoard.find(
        (x: any) => x.date === night.date && x.hotel === night.hotel,
      );

      // ADDED LOG
      console.log(`[RoomPicker PricesPerNightEffect] Night ${nightIndex + 1} (${night.date}, ${night.hotel}, Board: ${boardKey}):`);
      if (!foundEntry || !foundEntry.pricing) {
        // ADDED LOG
        console.warn(`  - No pricing entry found.`);
        return 0;
      }

      const nightTotal = chosenRooms.reduce((acc: number, room: any, roomIndex: number) => {
         const adultsCount = room.occupant_countAdults ?? 0;
         const childrenCount = room.occupant_countChildren ?? 0;
         // ADDED LOG
         console.log(`  - Room ${roomIndex + 1} (${room.category_name}): Calculating price for ${adultsCount} adults, ${childrenCount} children.`);
         // Use the getPriceForSingleRoom defined within this component's scope
         const roomPrice = getPriceForSingleRoom(
           foundEntry.pricing,
           night.hotel,
           night.board_type, // Use the specific night's board type ('HB' or 'B&B') for rate lookup
           travelMode,
           room,
           childrenCount,
           adultsCount,
           arrangementLength,
         );
          // ADDED LOG (price logging is now inside getPriceForSingleRoom)
         // console.log(`  - Room ${roomIndex + 1} Price: ${roomPrice}`);
         return acc + roomPrice;
      }, 0);

      // ADDED LOG
      console.log(`  - Night Total: ${nightTotal}`);
      return nightTotal;
    });

    // ADDED LOG
    console.log('[RoomPicker PricesPerNightEffect] Setting pricesPerNight state:', newPricesPerNight);
    setPricesPerNight(newPricesPerNight);

  }, [selectedArrangement, pricingData, selectedBoardOption, travelMode, arrangementLength]); // Ensure selectedBoardOption is a dependency

  // --- Effect: Calculate Total Price ---
  useEffect(() => {
    // ADDED LOG
    console.log('[RoomPicker TotalPriceEffect] Calculating total price...');
    const newTotal = calculateTotalPrice(
      selectedArrangement,
      pricingData, // Pass the state variable
      travelMode,
      adults,
      children,
      rooms, // Pass the prop directly
      rawConfig,
      selectedOptionalProducts,
      sumNightAdults, // Pass the function defined above
      sumNightChildren, // Pass the function defined above
      getProductPriceFn, // Pass the function defined in this component
      pricesPerNight,
    );
    // ADDED LOG
    console.log('[RoomPicker TotalPriceEffect] Setting total price state:', newTotal);
    setTotalPrice(newTotal);
  }, [ // Dependencies match calculateTotalPrice inputs that change
    pricesPerNight,
    selectedArrangement,
    pricingData,
    rawConfig,
    selectedOptionalProducts,
    travelMode,
    adults,
    children,
    rooms, // Add rooms prop as dependency
    // getProductPriceFn is defined in scope and stable, no need to list usually
    // sumNightAdults/Children are defined above component and stable
    arrangementLength, // Needed by calculateTotalPrice -> getNightlyRateId
  ]);

  // --- Handler: Board Toggle ---
  const handleBoardToggle = (option: "breakfast" | "halfboard") => {
    // ADDED LOG
    console.log(`[RoomPicker handleBoardToggle] Called with: ${option}`);
    setSelectedBoardOption(option);

    const newArrangement = arrangements[option]; // Get the corresponding *fetched* arrangement
    // ADDED LOG
    console.log(`[RoomPicker handleBoardToggle] Toggling to ${option}. Corresponding arrangement found:`, !!newArrangement);

    if (newArrangement) {
        // Don't manually update board_type here, use the fetched arrangement directly
        setSelectedArrangement(newArrangement);
        // Reset distribution flag so guest distribution runs for the new arrangement
        setDefaultDistributed(false);
         // ADDED LOG
        console.log('[RoomPicker handleBoardToggle] Switched selectedArrangement and reset distribution flag.');
    } else {
        // ADDED LOG
        console.warn(`[RoomPicker handleBoardToggle] No arrangement data available in state for board option: ${option}. Setting selectedArrangement to null.`);
        setSelectedArrangement(null); // Clear arrangement if none exists for this option
    }
  };

  // --- Helper: Get Category Details (for Modal) ---
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

  // --- Helper: Compute Optional Product Mapping (for final booking) ---
  function computeOptionalProductsMapping(): Record<string, string[]> {
    const mapping: Record<string, string[]> = {
      hotel1: [],
      hotel2: [],
      hotel3: [],
    };

    // ADDED LOG
    console.log('[computeOptionalProductsMapping] Computing mapping with selected:', selectedOptionalProducts, 'and OPTIONAL_PRODUCT_IDS:', OPTIONAL_PRODUCT_IDS);

    if (selectedOptionalProducts.lunch && OPTIONAL_PRODUCT_IDS.lunch) {
      mapping.hotel1.push(OPTIONAL_PRODUCT_IDS.lunch.hotel1);
      mapping.hotel2.push(OPTIONAL_PRODUCT_IDS.lunch.hotel2);
      mapping.hotel3.push(OPTIONAL_PRODUCT_IDS.lunch.hotel3);
    }

    if (travelMode === "cycling") {
      if (selectedOptionalProducts.bicycleRent && OPTIONAL_PRODUCT_IDS.bicycleRent) {
        mapping.hotel1.push(OPTIONAL_PRODUCT_IDS.bicycleRent.hotel1);
        mapping.hotel2.push(OPTIONAL_PRODUCT_IDS.bicycleRent.hotel2);
        mapping.hotel3.push(OPTIONAL_PRODUCT_IDS.bicycleRent.hotel3);
      }
      if (selectedOptionalProducts.bicycleTransport && OPTIONAL_PRODUCT_IDS.bicycleTransport) {
        mapping.hotel1.push(OPTIONAL_PRODUCT_IDS.bicycleTransport.hotel1);
        mapping.hotel2.push(OPTIONAL_PRODUCT_IDS.bicycleTransport.hotel2);
        mapping.hotel3.push(OPTIONAL_PRODUCT_IDS.bicycleTransport.hotel3);
      }
    }
    // ADDED LOG
    console.log('[computeOptionalProductsMapping] Result:', mapping);
    return mapping;
  }

  // --- Render Logic ---
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <img
          src="/corsendonk_green_png.png" // Use relative path from public folder
          alt="Loading Logo"
          className="w-auto max-w-[180px] md:max-w-[220px] h-auto mb-6 animate-pulse"
        />
        <p className="text-lg text-gray-700">Eventjes Geduld Aub</p>
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
            {error || "Er is een fout opgetreden"}
          </h2>
          <p className="text-gray-600 mb-4">
            Controleer uw selectie of probeer het later opnieuw.
          </p>
          <button
            onClick={onBack}
            className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            Terug naar arrangement formulier
          </button>
        </div>
      </div>
    );
  }

  // Handle case where arrangements might still be null after loading and no error
  if (!selectedArrangement) {
     console.warn("[RoomPicker Render] No selectedArrangement available for rendering. Displaying 'Not Found' message.");
     return (
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                 <XCircle className="text-orange-500 w-12 h-12" />
              </div>
              <h2 className="text-xl font-semibold text-[#2C4A3C] mb-4">
                 Geen Opties Gevonden
              </h2>
              <p className="text-gray-600 mb-4">
                 Er zijn geen arrangementen beschikbaar die voldoen aan uw criteria voor de geselecteerde data.
              </p>
              <button
                 onClick={onBack}
                 className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
               >
                 Terug naar arrangement formulier
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
          title="Uw Boeking"
          onNavigate={(step) => {
            if (step === 1) {
              onBack();
            }
          }}
        />

        <div className="mb-8 text-left">
          <MealPlanToggle
            selected={selectedBoardOption}
            onChange={handleBoardToggle}
          />
        </div>

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
                        {formatDutchDate(night.date)}
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
                                Kamer {index + 1}
                              </h4>
                              <button
                                onClick={() => {
                                  // ADDED LOG
                                  console.log(`[RoomPicker Render] Opening modal for room:`, { ...room, hotel: night.hotel });
                                  setModalRoomData({
                                    ...room,
                                    hotel: night.hotel,
                                  });
                                  setShowRoomDetailModal(true);
                                }}
                                className="text-[#2C4A3C] hover:text-[#2C4A3C]/80 ml-2"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex flex-col gap-2">
                              <select
                                className="w-full text-sm border rounded-md px-2 py-1.5 bg-white"
                                value={room.category_name}
                                onChange={(e) => {
                                  // ADDED LOG
                                  console.log(`[RoomPicker Render] Room ${index + 1} category changed to: ${e.target.value} for night ${nightIdx}`);
                                  const newArrangement = JSON.parse(JSON.stringify(selectedArrangement)); // Deep copy
                                  const option = night.room_options.find(
                                    (r: any) =>
                                      r.category_name === e.target.value,
                                  );
                                  if (option && newArrangement.night_details[nightIdx]) {
                                      const currentRoomData = newArrangement.night_details[nightIdx].chosen_rooms[index];
                                      newArrangement.night_details[nightIdx].chosen_rooms[index] = {
                                        ...currentRoomData, // Preserve existing occupant counts
                                        category_name: option.category_name,
                                        category_id: option.category_id,
                                        bed_capacity: option.bed_capacity,
                                        // TODO: Potentially reset/revalidate occupant counts if capacity changes significantly
                                      };
                                      // ADDED LOG
                                      console.log(`[RoomPicker Render] Updating selectedArrangement state after room change.`);
                                      setSelectedArrangement(newArrangement);
                                      // Optional: Reset distribution flag if changing room type requires redistribution
                                      // setDefaultDistributed(false);
                                  } else {
                                      console.error("[RoomPicker Render] Could not find selected room option or night detail.", { option, nightIdx });
                                  }
                                }}
                              >
                                {night.room_options.map((roomOption: any) => (
                                  <option
                                    key={roomOption.category_id}
                                    value={roomOption.category_name}
                                  >
                                    {roomOption.category_name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>
                                  {(() => {
                                     // ADDED LOG
                                     // console.log(`[RoomPicker Render] Getting display price for Room ${index + 1}, Night ${nightIdx}`);
                                    const boardKey = selectedBoardOption; // Use current state
                                    const nightlyPricingForBoard = pricingData[boardKey]?.nightlyPricing || [];
                                    const foundEntry = nightlyPricingForBoard.find(
                                      (x: any) =>
                                        x.date === night.date &&
                                        x.hotel === night.hotel,
                                    );
                                    if (!foundEntry || !foundEntry.pricing) {
                                        // ADDED LOG
                                        console.warn(`[RoomPicker Render] Price display: No pricing entry found for Room ${index+1}, Night ${nightIdx}`);
                                        return "Prijs niet beschikbaar";
                                    }
                                    // Use the component's getPriceForSingleRoom
                                    const price = getPriceForSingleRoom(
                                      foundEntry.pricing,
                                      night.hotel,
                                      night.board_type, // Use night's board type for rate lookup
                                      travelMode,
                                      room,
                                      room.occupant_countChildren || 0,
                                      room.occupant_countAdults || 0,
                                      arrangementLength,
                                    );
                                    // Price calculation logs are inside getPriceForSingleRoom
                                    return price > 0
                                      ? `€${price}`
                                      : "Prijs niet beschikbaar";
                                  })()}
                                </span>
                              </div>
                            </div>
                            {/* Only show guest adjustments if more than 1 room is selected */}
                            {rooms > 1 && (
                              <div className="mt-2 space-y-2">
                                {/* Only show adult adjustment if there are adults */}
                                {adults > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">Volwassenen:</span>
                                    <button
                                      onClick={() => {
                                        // ADDED LOG
                                        console.log(`[RoomPicker Render] Decrementing adults for Room ${index + 1}, Night ${nightIdx}`);
                                        setSelectedArrangement(currentArrangement => {
                                            if (!currentArrangement) return null;
                                            const newArrangement = JSON.parse(JSON.stringify(currentArrangement));
                                            const targetRoom = newArrangement.night_details[nightIdx]?.chosen_rooms[index];
                                            if (targetRoom) {
                                                targetRoom.occupant_countAdults = Math.max(0, (targetRoom.occupant_countAdults || 0) - 1);
                                            }
                                            return newArrangement;
                                        });
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      // Disable if count is 0
                                      disabled={(room.occupant_countAdults || 0) === 0}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countAdults || 0}
                                    </span>
                                    <button
                                      onClick={() => {
                                          // ADDED LOG
                                         console.log(`[RoomPicker Render] Incrementing adults for Room ${index + 1}, Night ${nightIdx}`);
                                         setSelectedArrangement(currentArrangement => {
                                             if (!currentArrangement) return null;
                                             const newArrangement = JSON.parse(JSON.stringify(currentArrangement));
                                             const targetNight = newArrangement.night_details[nightIdx];
                                             const targetRoom = targetNight?.chosen_rooms[index];

                                             if (targetRoom) {
                                                 const currentAdultsInRoom = targetRoom.occupant_countAdults || 0;
                                                 const currentChildrenInRoom = targetRoom.occupant_countChildren || 0;
                                                 // Use the accurate sum from the helper function for the night
                                                 const totalAdultsAssignedThisNight = sumNightAdults(targetNight);

                                                 // Check room capacity AND total adult limit for the whole booking
                                                 if (currentAdultsInRoom + currentChildrenInRoom + 1 <= targetRoom.bed_capacity && totalAdultsAssignedThisNight < adults) {
                                                     targetRoom.occupant_countAdults = currentAdultsInRoom + 1;
                                                 } else {
                                                     // ADDED LOG
                                                     console.warn(`[RoomPicker Render] Cannot increment adults. Room Cap: ${targetRoom.bed_capacity}, Current Occ: ${currentAdultsInRoom + currentChildrenInRoom}, Total Adults Assigned Night: ${totalAdultsAssignedThisNight}, Max Adults Booking: ${adults}`);
                                                 }
                                             }
                                             return newArrangement;
                                         });
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      // Disable if room is full or all adults for the booking are assigned to this night
                                      disabled={(room.occupant_countAdults || 0) + (room.occupant_countChildren || 0) >= room.bed_capacity || currentAssignedAdults >= adults}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {/* Only show child adjustment if there are children */}
                                {children > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-24">Kinderen:</span>
                                    <button
                                      onClick={() => {
                                         // ADDED LOG
                                         console.log(`[RoomPicker Render] Decrementing children for Room ${index + 1}, Night ${nightIdx}`);
                                         setSelectedArrangement(currentArrangement => {
                                            if (!currentArrangement) return null;
                                            const newArrangement = JSON.parse(JSON.stringify(currentArrangement));
                                            const targetRoom = newArrangement.night_details[nightIdx]?.chosen_rooms[index];
                                            if (targetRoom) {
                                                targetRoom.occupant_countChildren = Math.max(0, (targetRoom.occupant_countChildren || 0) - 1);
                                            }
                                            return newArrangement;
                                        });
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      // Disable if count is 0
                                      disabled={(room.occupant_countChildren || 0) === 0}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center">
                                      {room.occupant_countChildren || 0}
                                    </span>
                                    <button
                                      onClick={() => {
                                          // ADDED LOG
                                          console.log(`[RoomPicker Render] Incrementing children for Room ${index + 1}, Night ${nightIdx}`);
                                          setSelectedArrangement(currentArrangement => {
                                              if (!currentArrangement) return null;
                                              const newArrangement = JSON.parse(JSON.stringify(currentArrangement));
                                              const targetNight = newArrangement.night_details[nightIdx];
                                              const targetRoom = targetNight?.chosen_rooms[index];

                                              if (targetRoom) {
                                                 const currentAdultsInRoom = targetRoom.occupant_countAdults || 0;
                                                 const currentChildrenInRoom = targetRoom.occupant_countChildren || 0;
                                                 // Use the accurate sum from the helper function for the night
                                                 const totalChildrenAssignedThisNight = sumNightChildren(targetNight);

                                                 // Check room capacity AND total children limit for the whole booking
                                                  if (currentAdultsInRoom + currentChildrenInRoom + 1 <= targetRoom.bed_capacity && totalChildrenAssignedThisNight < children) {
                                                     targetRoom.occupant_countChildren = currentChildrenInRoom + 1;
                                                  } else {
                                                      // ADDED LOG
                                                      console.warn(`[RoomPicker Render] Cannot increment children. Room Cap: ${targetRoom.bed_capacity}, Current Occ: ${currentAdultsInRoom + currentChildrenInRoom}, Total Children Assigned Night: ${totalChildrenAssignedThisNight}, Max Children Booking: ${children}`);
                                                  }
                                              }
                                              return newArrangement;
                                          });
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      // Disable if room is full or all children for the booking are assigned to this night
                                      disabled={(room.occupant_countAdults || 0) + (room.occupant_countChildren || 0) >= room.bed_capacity || currentAssignedChildren >= children}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Show warning only if multiple rooms AND not all guests are assigned */}
                          {rooms > 1 && (currentAssignedAdults < adults || currentAssignedChildren < children) && (
                            <div className="mt-2 text-sm min-h-6 text-red-600">
                              {currentAssignedAdults < adults && (
                                <p>
                                  {adults - currentAssignedAdults} volwassene(n)
                                  niet toegewezen!
                                </p>
                              )}
                              {currentAssignedChildren < children && (
                                <p>
                                  {children - currentAssignedChildren}{" "}
                                  kind(eren) niet toegewezen!
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                          <span className="text-sm text-gray-600">Ontbijt</span>
                        </div>
                        {selectedBoardOption === "halfboard" && (
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                            <span className="text-sm text-gray-600">
                              Avondeten
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#2C4A3C]" />
                        <span className="text-sm text-gray-600">
                          {/* Display total from bookingData, not calculated sum */}
                          Totaal {adults + children} gasten
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Separator visuals */}
                  {nightIdx < selectedArrangement.night_details.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center w-16">
                       {/* Use appropriate icon based on travel mode */}
                       {travelMode === 'cycling' ? <Bike className="w-6 h-6 text-[#2C4A3C]" /> : <Footprints className="w-6 h-6 text-[#2C4A3C]" />}
                    </div>
                  )}
                  {nightIdx < selectedArrangement.night_details.length - 1 && (
                    <div className="lg:hidden flex justify-center h-16">
                       {travelMode === 'cycling' ? <Bike className="w-6 h-6 text-[#2C4A3C] self-center" /> : <Footprints className="w-6 h-6 text-[#2C4A3C] self-center" />}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
        <OptionalExtras
          travelMode={travelMode}
          selectedOptionalProducts={selectedOptionalProducts}
          setSelectedOptionalProducts={setSelectedOptionalProducts}
          rawConfig={rawConfig}
          getProductPriceFn={getProductPriceFn} // Pass the function
          getProductChargingMethodFn={getProductChargingMethodFn} // Pass the function
        />

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
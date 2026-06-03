import { ageCategoryMapping, BoardMapping } from "../../mappings/mappings";

export type Board = "breakfast" | "halfboard";

/**
 * Normalise a board value to the canonical app key.
 * Accepts either Mews board codes ("HB" / "B&B") or app board keys
 * ("halfboard" / "breakfast"), since different call sites carry different forms.
 */
export function normalizeBoard(boardType: string): Board {
  return boardType === "HB" || boardType === "halfboard"
    ? "halfboard"
    : "breakfast";
}

/**
 * Resolve the Mews rate id for a hotel/board/mode/length, honouring hotel3's
 * restaurant-specific half-board rates (Bink / Bardo). Returns "" if no rate is
 * configured for the combination.
 */
export function getNightlyRateId(
  hotel: string,
  boardType: string,
  travelMode: string,
  arrangementLength: number,
  restaurantChosen: string | null,
): string {
  const board = normalizeBoard(boardType);
  let mode = travelMode;
  if (mode !== "walking" && mode !== "cycling") mode = "walking";
  const lengthKey = arrangementLength === 3 ? "3D" : "4D";

  const hotelRates = BoardMapping[hotel]?.[mode]?.[lengthKey];
  if (!hotelRates) return "";

  // hotel3 half-board rates are keyed by restaurant; every other case is flat.
  if (
    hotel === "hotel3" &&
    board === "halfboard" &&
    (restaurantChosen === "Bink" || restaurantChosen === "Bardo")
  ) {
    return hotelRates[board]?.[restaurantChosen] ?? "";
  }
  return hotelRates[board] ?? "";
}

/**
 * Price for a single occupied room on one night.
 *
 * @param nightPricing  the per-night pricing object (i.e. `foundEntry.pricing`,
 *                      the thing that holds `CategoryPrices`). Callers resolve
 *                      the night entry first (match by date + hotel).
 * @param room          room object; reads `category_id` and the
 *                      `occupant_count*` fields off it.
 * @param boardType     either Mews code ("HB"/"B&B") or app key.
 *
 * Returns 0 when pricing, category, occupancy, or rate can't be resolved.
 *
 * Occupancy matching accepts any priced occupancy that can *hold* the guests
 * (priced count >= requested count), not only an exact match — Mews frequently
 * prices a category at its bed capacity only (e.g. a 3-bed room priced for 3
 * even when 2 guests stay). A strict match returns 0 for those rooms.
 */
export function getPriceForSingleRoom(
  nightPricing: any,
  hotel: string,
  boardType: string,
  travelMode: string,
  room: any,
  arrangementLength: number,
  restaurantChosen: string | null,
): number {
  if (!nightPricing?.CategoryPrices) return 0;

  const cat = nightPricing.CategoryPrices.find(
    (cp: any) => cp.CategoryId === room.category_id,
  );
  if (!cat) return 0;

  const adults = room.occupant_countAdults ?? 0;
  const children6_12 = room.occupant_countChildren6_12 ?? 0;
  const children3_5 = room.occupant_countChildren3_5 ?? 0;
  const occupantTotal = adults + children6_12 + children3_5;

  const occupantArray: { AgeCategoryId: string; PersonCount: number }[] = [];
  if (adults > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.adult,
      PersonCount: adults,
    });
  }
  if (children6_12 > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.child6_12,
      PersonCount: children6_12,
    });
  }
  if (children3_5 > 0) {
    occupantArray.push({
      AgeCategoryId: ageCategoryMapping[hotel]?.child3_5,
      PersonCount: children3_5,
    });
  }

  // Primary: same age-category buckets, each priced for at least the requested
  // headcount (>=, not exact — see the doc comment above).
  let occupantPriceEntry = cat.OccupancyPrices.find((op: any) => {
    if (!op.Occupancies || op.Occupancies.length !== occupantArray.length) {
      return false;
    }
    const api = [...op.Occupancies].sort((a, b) =>
      (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
    );
    const target = [...occupantArray].sort((a, b) =>
      (a.AgeCategoryId ?? "").localeCompare(b.AgeCategoryId ?? ""),
    );
    return api.every(
      (o, i) =>
        o.AgeCategoryId === target[i].AgeCategoryId &&
        o.PersonCount >= target[i].PersonCount,
    );
  });

  // Fallback: any occupancy whose total headcount matches.
  occupantPriceEntry ??= cat.OccupancyPrices.find(
    (op: any) =>
      op.Occupancies.reduce((acc: number, x: any) => acc + x.PersonCount, 0) ===
      occupantTotal,
  );

  if (!occupantPriceEntry) return 0;

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
  return typeof val === "number" ? val : 0;
}

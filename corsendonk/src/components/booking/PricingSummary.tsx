import React from "react";

interface PricingSummaryProps {
  totalPrice: number;
  nights: number;
  rooms: number;
  onReserve: () => void;
}

export function PricingSummary({
  totalPrice,
  nights,
  rooms,
  onReserve,
}: PricingSummaryProps) {
  // Compute the average price per room per night if valid numbers are provided
  const avgPricePerRoomPerNight =
    nights > 0 && rooms > 0
      ? (totalPrice / (nights * rooms)).toFixed(2)
      : "0.00";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-sm text-gray-500">Totale Prijs</div>
            <div className="text-2xl font-semibold">€ {totalPrice}</div>
            <div className="text-sm text-gray-500">
              Gemiddelde prijs per kamer per nacht: € {avgPricePerRoomPerNight}
            </div>
          </div>
          <button
            onClick={onReserve}
            className="w-full sm:w-auto bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            Reserveer uw kamers nu
          </button>
        </div>
      </div>
    </div>
  );
}

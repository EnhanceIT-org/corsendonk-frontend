import React from "react";
import { useTranslation } from 'react-i18next'; // Import hook

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
  const { t } = useTranslation(); // Instantiate hook
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
            <div className="text-sm text-gray-500">{t('pricingSummary.totalPriceLabel', 'Total Price')}</div>
            <div className="text-2xl font-semibold">€ {totalPrice.toFixed(2)}</div> {/* Ensure price is formatted */}
            <div className="text-sm text-gray-500">
              {t('pricingSummary.avgPriceLabel', { price: avgPricePerRoomPerNight, defaultValue: `Average price per room per night: € ${avgPricePerRoomPerNight}` })}
            </div>
          </div>
          <button
            onClick={onReserve}
            className="w-full sm:w-auto bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            {t('pricingSummary.reserveButton', 'Reserve your rooms now')}
          </button>
        </div>
      </div>
    </div>
  );
}

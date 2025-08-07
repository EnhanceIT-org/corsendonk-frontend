import React, { useState } from "react";
import { useTranslation } from "react-i18next"; // Import hook
import {
  Minus,
  Plus,
  Bike,
  Coffee,
  UtensilsCrossed,
  Footprints,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Breadcrumb } from "@/components/booking/Breadcrumb";

interface ArrangementFormData {
  arrangementLength: 3 | 4;
  startDate: string;
  adults: number;
  children: number;
  rooms: number;
  travelMode: "walking" | "cycling";
  boardOption: "breakfast" | "halfboard";
}

interface ArrangementFormProps {
  onContinue: (data: ArrangementFormData) => void;
  bookingData: {
    arrangementLength: number;
    startDate: string;
    adults: number;
    children: number;
    rooms: number;
    travelMode: "walking" | "cycling";
    boardOption: "breakfast" | "halfboard";
  };
}

export const ArrangementForm: React.FC<ArrangementFormProps> = ({
  onContinue,
  bookingData,
}) => {
  const { t } = useTranslation(); // Instantiate hook
  const [formData, setFormData] = useState<ArrangementFormData>({
    arrangementLength:
      bookingData.arrangementLength === 3 || bookingData.arrangementLength === 4
        ? bookingData.arrangementLength
        : 4,
    startDate: bookingData.startDate || format(new Date(), "yyyy-MM-dd"),
    adults: bookingData.adults >= 0 ? bookingData.adults : 2,
    children: bookingData.children >= 0 ? bookingData.children : 0,
    rooms: bookingData.rooms > 0 ? bookingData.rooms : 1,
    travelMode:
      bookingData.travelMode === "walking" ||
      bookingData.travelMode === "cycling"
        ? bookingData.travelMode
        : "walking",
    boardOption:
      bookingData.boardOption === "breakfast" ||
      bookingData.boardOption === "halfboard"
        ? bookingData.boardOption
        : "breakfast",
  });

  const handleIncrement = (field: "adults" | "children" | "rooms") => {
    setFormData((prev) => {
      // total guests to 10 (mews api call doesnt allow more)
      if (
        (field === "adults" || field === "children") &&
        prev.adults + prev.children >= 10
      ) {
        return prev;
      }

      return {
        ...prev,
        [field]: prev[field] + 1,
      };
    });
  };

  const handleDecrement = (field: "adults" | "children" | "rooms") => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(field === "rooms" ? 1 : 0, prev[field] - 1),
    }));
  };

  const handleContinue = () => {
    onContinue(formData);
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 pb-32" data-prototypeid="2">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumb
          currentStep={1}
          title={t("breadcrumb.planStay", "Plan your stay")}
        />

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {t(
                "arrangementForm.selectDurationTitle",
                "Select the duration of your stay",
              )}
            </h2>
            <div className="flex gap-2">
              {" "}
              {/* Added a div to group the buttons */}
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.arrangementLength === 3
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    arrangementLength: 3,
                  }))
                }
              >
                {/* You can add an icon here if desired, similar to Footprints */}
                <CalendarDays className="w-5 h-5" />
                <span>{t("arrangementForm.duration.3days", "3 Days")}</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.arrangementLength === 4
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    arrangementLength: 4,
                  }))
                }
              >
                <CalendarDays className="w-5 h-5" />
                <span>{t("arrangementForm.duration.4days", "4 Days")}</span>
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {t(
                "arrangementForm.selectStartDateTitle",
                "Choose a start date for your stay",
              )}
            </h2>
            <DateRangePicker
              arrangementLength={formData.arrangementLength}
              onChange={(range) => {
                if (range.from) {
                  // Store the start date in "yyyy-MM-dd" format
                  setFormData((prev) => ({
                    ...prev,
                    startDate: format(range.from, "yyyy-MM-dd"),
                  }));
                }
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("arrangementForm.guestCountTitle", "Number of Guests")}
            </h2>
            <div className="space-y-4 align-start">
              <div className="flex sm:flex-row flex-col sm:items-center justify-between items-start max-w-[300px]">
                <span className="sm:mb-0 mb-1">
                  {t("occupancy.adults", "Adults")}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => handleDecrement("adults")}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center">{formData.adults}</span>
                  <button
                    onClick={() => handleIncrement("adults")}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
                <div className="flex sm:flex-row flex-col sm:items-center items-start justify-between max-w-[300px]">
                <span className="sm:mb-0 mb-1">{t("occupancy.children", "Children")}</span>
                <div className="flex items-center">
                  <button
                  onClick={() => handleDecrement("children")}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                  <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center">{formData.children}</span>
                  <button
                  onClick={() => handleIncrement("children")}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                  <Plus className="w-4 h-4" />
                  </button>
                </div>
                </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("arrangementForm.roomCountTitle", "Number of Rooms")}
            </h2>
            <div className="flex items-center justify-between max-w-[300px]">
              <span>{t("arrangementForm.roomsLabel", "Rooms")}</span>
              <div className="flex items-center">
                <button
                  onClick={() => handleDecrement("rooms")}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center">{formData.rooms}</span>
                {formData.rooms < formData.adults + formData.children && (
                  <button
                    onClick={() => {
                      if (
                        formData.rooms <
                        formData.adults + formData.children
                      ) {
                        handleIncrement("rooms");
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {formData.rooms === formData.adults + formData.children && (
              <span className="text-sm text-gray-500">
                {t(
                  "arrangementForm.maxRoomsReached",
                  "Maximum number of rooms reached",
                )}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("arrangementForm.travelPreferenceTitle", "Travel Preference")}
            </h2>
            <div className="gap-4 flex flex-col sm:flex-row">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.travelMode === "walking"
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    travelMode: "walking",
                  }))
                }
              >
                <Footprints className="w-5 h-5" />
                <span>{t("travelMode.walking", "Walking")}</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.travelMode === "cycling"
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    travelMode: "cycling",
                  }))
                }
              >
                <Bike className="w-5 h-5" />
                <span>{t("travelMode.cycling", "Cycling")}</span>
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {t("arrangementForm.mealsTitle", "Meals")}
            </h2>
            <div className="gap-4 flex flex-col sm:flex-row">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.boardOption === "breakfast"
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    boardOption: "breakfast",
                  }))
                }
              >
                <Coffee className="w-5 h-5" />
                <span>{t("mealPlan.breakfastOnly", "Breakfast Only")}</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  formData.boardOption === "halfboard"
                    ? "border-[#2C4A3C] bg-[#2C4A3C] text-white"
                    : "border-gray-200 hover:border-[#2C4A3C]"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    boardOption: "halfboard",
                  }))
                }
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span>{t("mealPlan.halfBoard", "Half Board")}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            {t(
              "arrangementForm.continueToRoomSelection",
              "Continue to room selection",
            )}
          </button>
        </div>
      </div>
    </main>
  );
};
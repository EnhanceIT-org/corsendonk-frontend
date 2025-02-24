import React, { useState, Children } from "react";
import {
  Calendar,
  Minus,
  Plus,
  Bike,
  Coffee,
  UtensilsCrossed,
  Footprints,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
}

export const ArrangementForm: React.FC<ArrangementFormProps> = ({
  onContinue,
}) => {
  const [formData, setFormData] = useState<ArrangementFormData>({
    arrangementLength: 3,
    startDate: format(new Date(), "yyyy-MM-dd"),
    adults: 2,
    children: 0,
    rooms: 1,
    travelMode: "walking",
    boardOption: "breakfast",
  });

  const handleIncrement = (field: "adults" | "children" | "rooms") => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] + 1,
    }));
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
        <div className="mb-8">
          <img
            src="https://placehold.co/200x60?text=Hotel+Chain+Logo"
            alt="Hotel Chain Logo"
            className="h-12 mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#2C4A3C] mb-6">
            Plan uw arrangement
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Selecteer Arrangement lengte
            </h2>
            <select
              className="w-full max-w-[200px] border border-gray-200 rounded-lg px-4 py-2.5 appearance-none bg-white hover:border-[#2C4A3C] transition-colors focus:outline-none focus:border-[#2C4A3C] cursor-pointer"
              value={formData.arrangementLength}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  arrangementLength: parseInt(e.target.value) === 3 ? 3 : 4,
                }))
              }
            >
              <option value={3}>3 Dagen</option>
              <option value={4}>4 Dagen</option>
            </select>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Kies een startdatum van uw verblijf
            </h2>
            <div
              className="relative max-w-[400px]"
              onClick={() => {
                const dateInput = document.getElementById(
                  "date-input",
                ) as HTMLInputElement;
                if (dateInput) dateInput.showPicker();
              }}
            >
              <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between hover:border-[#2C4A3C] transition-colors cursor-pointer">
                <span>
                  {format(new Date(formData.startDate), "MMMM dd, yyyy", {
                    locale: nl,
                  })}
                </span>
                <Calendar
                  className="h-5 w-5 text-gray-400"
                  onClick={() => {
                    const dateInput = document.getElementById(
                      "date-input",
                    ) as HTMLInputElement;
                    if (dateInput) dateInput.showPicker();
                  }}
                />
              </div>
              <input
                id="date-input"
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: format(new Date(e.target.value), "DD-MM-YYYY"),
                  }))
                }
              />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Aantal Gasten</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between max-w-[300px]">
                <span>Volwassenen</span>
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
              <div className="flex items-center justify-between max-w-[300px]">
                <span>Kinderen</span>
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
            <h2 className="text-lg font-semibold mb-4">Aantal Kamers</h2>
            <div className="flex items-center justify-between max-w-[300px]">
              <span>Kamers</span>
              <div className="flex items-center">
                <button
                  onClick={() => handleDecrement("rooms")}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center">{formData.rooms}</span>
                <button
                  onClick={() => handleIncrement("rooms")}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Voorkeur verplaatsing
            </h2>
            <div className="flex gap-4">
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
                <span>Wandelen</span>
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
                <span>Fietsen</span>
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Maaltijden</h2>
            <div className="flex gap-4">
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
                <span>Enkel Ontbijt</span>
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
                <span>Halfpension</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            Ga door naar kamerselectie
          </button>
        </div>
      </div>
    </main>
  );
};

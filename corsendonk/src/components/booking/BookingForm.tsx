import React, { useState } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { OccupancySelector } from "@/components/OccupancySelector";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

export interface BookingFormData {
  startDate: string; // formatted as DD-MM-YYYY
  arrangementLength: number;
  rooms: number;
  adults: number;
  children: number;
  travelMode: "walking" | "cycling";
  boardOption: "breakfast" | "halfBoard";
}

interface BookingFormProps {
  onContinue: (data: BookingFormData) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onContinue }) => {
  const today = new Date();
  const [startDate, setStartDate] = useState<DateRange | undefined>({ from: today, to: today });
  const [arrangementLength, setArrangementLength] = useState<number>(3);
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [travelMode, setTravelMode] = useState<"walking" | "cycling">("walking");
  const [boardOption, setBoardOption] = useState<"breakfast" | "halfBoard">("breakfast");

  // Format the selected start date as "DD-MM-YYYY"
  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range || !range.from) return "";
    const d = range.from;
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  const handleContinue = () => {
    const formattedStartDate = formatDateRange(startDate);
    onContinue({
      startDate: formattedStartDate,
      arrangementLength,
      rooms,
      adults,
      children,
      travelMode,
      boardOption,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Dates</h2>
        <DateRangePicker onChange={(date) => setStartDate(date)} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Number of Guests</h2>
        <OccupancySelector
          adults={adults}
          children={children}
          onAdultsChange={(val) => setAdults(Number(val))}
          onChildrenChange={(val) => setChildren(Number(val))}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Arrangement Length</h2>
        <select value={arrangementLength} onChange={(e) => setArrangementLength(Number(e.target.value))}>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Amount of Rooms</h2>
        <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>
          {Array.from({ length: adults + children }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Travel Mode</h2>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="travelMode"
              value="walking"
              checked={travelMode === "walking"}
              onChange={(e) => setTravelMode(e.target.value as "walking")}
              className="mr-2"
            />
            Walking
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="travelMode"
              value="cycling"
              checked={travelMode === "cycling"}
              onChange={(e) => setTravelMode(e.target.value as "cycling")}
              className="mr-2"
            />
            Cycling
          </label>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Board Option</h2>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="boardOption"
              value="breakfast"
              checked={boardOption === "breakfast"}
              onChange={(e) => setBoardOption(e.target.value as "breakfast")}
              className="mr-2"
            />
            Breakfast Only
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="boardOption"
              value="halfBoard"
              checked={boardOption === "halfBoard"}
              onChange={(e) => setBoardOption(e.target.value as "halfBoard")}
              className="mr-2"
            />
            Half Board
          </label>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={handleContinue}>Continue to Room Selection</Button>
      </div>
    </div>
  );
};

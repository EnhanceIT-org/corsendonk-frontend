import React, { useState } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";

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
  // Select arrangement length first.
  const [arrangementLength, setArrangementLength] = useState<number>(3);
  const [startDate, setStartDate] = useState<Date>(today);
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [travelMode, setTravelMode] = useState<"walking" | "cycling">(
    "walking",
  );
  const [boardOption, setBoardOption] = useState<"breakfast" | "halfBoard">(
    "breakfast",
  );

  const handleDateChange = (range: { from: Date; to: Date }) => {
    if (range.from) {
      setStartDate(range.from);
    }
  };

  // Format the start date as "DD-MM-YYYY"
  const formatDate = (date: Date): string =>
    `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;

  const handleContinue = () => {
    onContinue({
      startDate: formatDate(startDate),
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
      {/* Arrangement Length Selector */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Select Arrangement Length
        </h2>
        <select
          value={arrangementLength}
          onChange={(e) => setArrangementLength(Number(e.target.value))}
        >
          <option value={3}>3 Days</option>
          <option value={4}>4 Days</option>
        </select>
      </div>

      {/* Date Picker */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pick Start Date</h2>
        <DateRangePicker
          arrangementLength={arrangementLength}
          onChange={handleDateChange}
        />
      </div>

      {/* Guests Selector */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Number of Guests</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block mb-1">Adults</label>
            <div className="flex items-center">
              <button
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="px-2 border"
              >
                -
              </button>
              <input
                type="number"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-16 text-center border"
              />
              <button
                onClick={() => setAdults(adults + 1)}
                className="px-2 border"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1">Children</label>
            <div className="flex items-center">
              <button
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="px-2 border"
              >
                -
              </button>
              <input
                type="number"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-16 text-center border"
              />
              <button
                onClick={() => setChildren(children + 1)}
                className="px-2 border"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Selector */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Amount of Rooms</h2>
        <div className="flex items-center">
          <button
            onClick={() => setRooms(Math.max(1, rooms - 1))}
            className="px-2 border"
          >
            -
          </button>
          <input
            type="number"
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-16 text-center border"
          />
          <button onClick={() => setRooms(rooms + 1)} className="px-2 border">
            +
          </button>
        </div>
      </div>

      {/* Travel Mode */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Travel Mode</h2>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="travelMode"
              value="walking"
              checked={travelMode === "walking"}
              onChange={() => setTravelMode("walking")}
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
              onChange={() => setTravelMode("cycling")}
              className="mr-2"
            />
            Cycling
          </label>
        </div>
      </div>

      {/* Board Option */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Board Option</h2>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="boardOption"
              value="breakfast"
              checked={boardOption === "breakfast"}
              onChange={() => setBoardOption("breakfast")}
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
              onChange={() => setBoardOption("halfBoard")}
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

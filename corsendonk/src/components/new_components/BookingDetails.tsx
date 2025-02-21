import React, { useState } from "react";
import { format } from "date-fns";
import { Coffee, UtensilsCrossed, Users, Info } from "lucide-react";
import { RoomDetailModal } from "./RoomDetailModal";
export function BookingDetails({ bookingData }) {
  const [selectedRoom, setSelectedRoom] = useState<null | {
    type: string;
    hotelName: string;
  }>(null);
  const calculateTotalPrice = () => {
    const roomsTotal = bookingData.dates.reduce((total, date) => {
      return (
        total +
        date.rooms.reduce((roomTotal, room) => roomTotal + room.price, 0)
      );
    }, 0);
    const extrasTotal =
      ((bookingData.optionalExtras.lunchPackage ? 15 : 0) +
        (bookingData.optionalExtras.bicycleRental ? 25 : 0)) *
      bookingData.dates.length;
    return roomsTotal + extrasTotal;
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Your Arrangement Details</h2>
        {bookingData.dates.map((date, index) => (
          <div
            key={index}
            className="border-b last:border-b-0 pb-6 mb-6 last:pb-0 last:mb-0"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-[#2C4A3C]">
                  {format(new Date(date.date), "EEE, MMM d, yyyy")}
                </h3>
                <p className="text-sm text-gray-500">{date.hotel.name}</p>
                <p className="text-sm text-gray-500">{date.hotel.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#2C4A3C]" />
                {bookingData.mealPlan === "halfboard" && (
                  <UtensilsCrossed className="w-5 h-5 text-[#2C4A3C]" />
                )}
              </div>
            </div>
            <div className="space-y-4">
              {date.rooms.map((room, roomIndex) => (
                <div key={roomIndex} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.type}</span>
                      <button
                        className="text-[#2C4A3C] hover:text-[#2C4A3C]/80"
                        onClick={() =>
                          setSelectedRoom({
                            type: room.type,
                            hotelName: date.hotel.name,
                          })
                        }
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-medium">€{room.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {room.adults} adults, {room.children} children
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Optional Extras</h2>
        {bookingData.optionalExtras.lunchPackage && (
          <div className="flex justify-between items-center mb-2">
            <span>Lunch Package</span>
            <span>€{15 * bookingData.dates.length}</span>
          </div>
        )}
        {bookingData.optionalExtras.bicycleRental && (
          <div className="flex justify-between items-center">
            <span>Bicycle Rental</span>
            <span>€{25 * bookingData.dates.length}</span>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Total Price</h2>
            <p className="text-sm text-gray-500">
              Including all taxes and fees
            </p>
          </div>
          <span className="text-2xl font-semibold">
            €{calculateTotalPrice()}
          </span>
        </div>
      </div>
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}

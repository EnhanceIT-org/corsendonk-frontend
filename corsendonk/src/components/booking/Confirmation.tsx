// components/booking/Confirmation.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

// We can define a mapping for product IDs to names based on our hardcoded values.
const productNames = {
  lunch: "Lunch package",
  bicycleRent: "Bicylce renting",
  bicycleTransport: "Bicycle transport cost",
};

export interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  telephone: string;
  nationality: string;
  sendMarketingEmails: boolean;
}

interface ConfirmationProps {
  selectedArrangement: any; // from /availability/ (with optionalProducts mapping already attached)
  totalPrice: number;
  onBack: () => void;
  onBookingSuccess: (reservationData: any) => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({
  selectedArrangement,
  totalPrice,
  onBack,
  onBookingSuccess,
}) => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    email: "",
    firstName: "",
    lastName: "",
    telephone: "",
    nationality: "",
    sendMarketingEmails: false,
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Build payload matching what the backend expects.
  const buildReservationPayload = (
    arrangement: any,
    customer: CustomerData
  ) => {
    return {
      selectedArrangement: arrangement,
      customer: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        telephone: customer.telephone,
        nationality: customer.nationality,
        sendMarketingEmails: customer.sendMarketingEmails,
      },
    };
  };

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    setBookingError(null);
    try {
      const payload = buildReservationPayload(selectedArrangement, customerData);
      const res = await axios.post(
        "http://localhost:8000/reservations/book/",
        payload
      );
      onBookingSuccess(res.data);
    } catch (err: any) {
      setBookingError(err.message || "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  // Render a detailed summary for each night.
  const renderNightSummary = () => {
    return selectedArrangement.night_details.map((night: any, idx: number) => {
      // Get optional products mapping for this hotel if available.
      // We assume that the selectedArrangement includes an "optionalProducts" object.
      const optionalForHotel =
        selectedArrangement.optionalProducts?.[night.hotel] || [];
      return (
        <div key={idx} className="border p-4 rounded mb-4">
          <p>
            <strong>Date:</strong> {night.date}
          </p>
          <p>
            <strong>Hotel:</strong> {night.hotel}
          </p>
          <p>
            <strong>Board Type:</strong> {night.board_type}
            {night.board_type === "HB" && night.restaurant_chosen && (
              <> (Dinner at {night.restaurant_chosen})</>
            )}
          </p>
          <div className="mt-2">
            <strong>Chosen Room(s):</strong>
            {night.chosen_rooms.map((room: any, roomIdx: number) => (
              <div key={roomIdx} className="ml-4">
                <p>
                  {room.category_name} (Bed Capacity: {room.bed_capacity})
                </p>
              </div>
            ))}
          </div>
          {optionalForHotel.length > 0 && (
            <div className="mt-2">
              <strong>Optional Products:</strong>
              <ul className="list-disc ml-6">
                {optionalForHotel.map((pid: string, pIdx: number) => (
                  <li key={pIdx}>{productNames.lunch /* Adjust mapping as needed based on pid */}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in space-y-6">
      <h2 className="text-xl font-bold">Booking Summary</h2>
      
      {/* Detailed booking summary */}
      <div className="space-y-4">
        {renderNightSummary()}
      </div>

      {/* Overall Price */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-bold">Total Price:</h3>
        <p className="text-xl">{totalPrice} EUR</p>
      </div>

      {/* Customer Information */}
      <div className="border p-4 rounded">
        <h3 className="text-lg font-bold mb-2">Customer Information</h3>
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            value={customerData.email}
            onChange={(e) =>
              setCustomerData({ ...customerData, email: e.target.value })
            }
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="First Name"
            value={customerData.firstName}
            onChange={(e) =>
              setCustomerData({ ...customerData, firstName: e.target.value })
            }
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={customerData.lastName}
            onChange={(e) =>
              setCustomerData({ ...customerData, lastName: e.target.value })
            }
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Telephone"
            value={customerData.telephone}
            onChange={(e) =>
              setCustomerData({ ...customerData, telephone: e.target.value })
            }
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Nationality (e.g. BE)"
            value={customerData.nationality}
            onChange={(e) =>
              setCustomerData({ ...customerData, nationality: e.target.value })
            }
            className="border p-2 w-full"
          />
        </div>
      </div>

      {bookingError && <div className="text-red-500">{bookingError}</div>}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleConfirmBooking} disabled={isBooking}>
          {isBooking ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;

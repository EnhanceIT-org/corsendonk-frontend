import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  telephone: string;
  nationality: string;
  sendMarketingEmails: boolean;
}

interface ConfirmationProps {
  selectedArrangement: any;
  totalPrice: number;
  onBack: () => void;
  onBookingSuccess: (reservationData: any) => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({ selectedArrangement, totalPrice, onBack, onBookingSuccess }) => {
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
  const buildReservationPayload = (arrangement: any, customer: CustomerData) => {
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
      // Make sure the endpoint URL ends with a slash.
      const res = await axios.post("http://localhost:8000/reservations/book/", payload);
      onBookingSuccess(res.data);
    } catch (err: any) {
      setBookingError(err.message || "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
      <div>
        <h3>Total Price:</h3>
        <p>{totalPrice} EUR</p>
      </div>
      <div className="mb-4">
        <h3>Customer Information</h3>
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="First Name"
            value={customerData.firstName}
            onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={customerData.lastName}
            onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Telephone"
            value={customerData.telephone}
            onChange={(e) => setCustomerData({ ...customerData, telephone: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            type="text"
            placeholder="Nationality (e.g. US)"
            value={customerData.nationality}
            onChange={(e) => setCustomerData({ ...customerData, nationality: e.target.value })}
            className="border p-2 w-full"
          />
        </div>
      </div>
      {bookingError && <div className="text-red-500 mb-4">{bookingError}</div>}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleConfirmBooking} disabled={isBooking}>
          {isBooking ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;

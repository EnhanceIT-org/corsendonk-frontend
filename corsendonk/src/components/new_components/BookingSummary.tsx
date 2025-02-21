import React, { useState } from "react";
import { format } from "date-fns";
import { PersonalInformationForm } from "./PersonalInformationForm";
import { BookingDetails } from "./BookingDetails";
interface BookingData {
  dates: {
    date: string;
    hotel: {
      name: string;
      location: string;
    };
    rooms: {
      type: string;
      adults: number;
      children: number;
      price: number;
    }[];
  }[];
  optionalExtras: {
    lunchPackage: boolean;
    bicycleRental: boolean;
  };
  mealPlan: "breakfast" | "halfboard";
  total: number;
}

interface BookingSummaryProps {
  selectedArrangement: any; // from /availability/ (with optionalProducts mapping already attached)
  totalPrice: number;
  onBack: () => void;
  onBookingSuccess: (reservationData: any) => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedArrangement,
  totalPrice,
  onBack,
  onBookingSuccess,
}) => {
  const [bookingData, setBookingData] = useState<BookingData>({
    dates: selectedArrangement.nights,
    optionalExtras: {
      lunchPackage: false,
      bicycleRental: false,
    },
    mealPlan: selectedArrangement.boardOption,
    total: totalPrice,
  });

  return (
    <main className="min-h-screen w-full bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <img
            src="https://placehold.co/200x60?text=Hotel+Chain+Logo"
            alt="Hotel Chain Logo"
            className="h-12 mb-4"
          />
          <h1 className="text-3xl font-semibold text-[#2C4A3C] mb-6">
            Complete Your Booking
          </h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <BookingDetails bookingData={bookingData} />
          </div>
          <div className="lg:w-[400px]">
            <PersonalInformationForm />
          </div>
        </div>
      </div>
    </main>
  );
};

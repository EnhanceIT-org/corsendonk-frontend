import React, { useState } from "react";
import { BookingForm } from "@/components/booking/BookingForm";
import { RoomSelection } from "@/components/booking/RoomSelection";
import { Confirmation } from "@/components/booking/Confirmation";
import { Button } from "@/components/ui/button";
import { Check, CircleDot } from "lucide-react";
import { ArrangementForm } from "@/components/new_components/ArrangementForm";
import { RoomPicker } from "@/components/new_components/RoomPicker";
import { BookingSummary } from "@/components/new_components/BookingSummary";

export interface BookingFormData {
  startDate: string; // formatted as DD-MM-YYYY
  arrangementLength: number;
  rooms: number;
  adults: number;
  children: number;
  travelMode: "walking" | "cycling";
  boardOption: "breakfast" | "halfboard";
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [finalReservationData, setFinalReservationData] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleFormContinue = (data: BookingFormData) => {
    setBookingData(data);
    setCurrentStep(2);
  };

  const handleRoomSelectionContinue = (
    selectedArrangement: any,
    pricingData: any,
    rawConfig: any,
    computedPrice: number,
  ) => {
    setFinalReservationData({ selectedArrangement, pricingData, rawConfig });
    setTotalPrice(computedPrice);
    setCurrentStep(3);
  };

  const handleBookingSuccess = (reservationData: any) => {
    console.log("Booking successful!", reservationData);
    // You can redirect or display a final confirmation message here.
  };

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container py-8 max-w-3xl mx-auto">
        {/* Progress Timeline */}
        {/* {currentStep === 1 && <BookingForm onContinue={handleFormContinue} />} */}
        {currentStep === 1 && (
          <ArrangementForm onContinue={handleFormContinue} />
        )}
        {/* {currentStep === 2 && bookingData && (
          <RoomSelection
            bookingData={bookingData}
            onBack={() => setCurrentStep(1)}
            onContinue={handleRoomSelectionContinue}
          />
        )} */}
        {currentStep === 2 && (
          <RoomPicker
            bookingData={bookingData}
            onBack={() => setCurrentStep(1)}
            onContinue={handleRoomSelectionContinue}
          />
        )}
        {/* {currentStep === 3 && finalReservationData && (
          <Confirmation
            selectedArrangement={finalReservationData.selectedArrangement}
            totalPrice={totalPrice}
            onBack={() => setCurrentStep(2)}
            onBookingSuccess={handleBookingSuccess}
          />
        )} */}
        {currentStep == 3 && (
          <BookingSummary
            selectedArrangement={finalReservationData.selectedArrangement}
            totalPrice={totalPrice}
            onBack={() => setCurrentStep(2)}
            onBookingSuccess={handleBookingSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Index;

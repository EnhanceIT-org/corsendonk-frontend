import React, { useState } from "react";
import { BookingForm, BookingFormData } from "@/components/booking/BookingForm";
import { RoomSelection } from "@/components/booking/RoomSelection";
import { Confirmation } from "@/components/booking/Confirmation";
import { Button } from "@/components/ui/button";
import { Check, CircleDot } from "lucide-react";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [finalReservationData, setFinalReservationData] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleFormContinue = (data: BookingFormData) => {
    setBookingData(data);
    setCurrentStep(2);
  };

  const handleRoomSelectionContinue = (selectedArrangement: any, pricingData: any, rawConfig: any, computedPrice: number) => {
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
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-primary">Hotel Booking</h1>
        </div>
      </header>
      <main className="container py-8 max-w-3xl mx-auto">
        {/* Progress Timeline */}
        <div className="relative flex justify-between mb-12">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  step < currentStep
                    ? "bg-primary border-primary text-white"
                    : step === currentStep
                    ? "bg-white border-primary text-primary"
                    : "bg-white border-gray-300 text-gray-300"
                }`}
              >
                {step < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : step === currentStep ? (
                  <CircleDot className="w-5 h-5" />
                ) : (
                  step
                )}
              </div>
              <div className={`mt-2 font-medium ${step <= currentStep ? "text-primary" : "text-gray-400"}`}>
                {step === 1 ? "Dates, Guests & Options" : step === 2 ? "Select Rooms & Extras" : "Confirm"}
              </div>
            </div>
          ))}
        </div>
        {currentStep === 1 && <BookingForm onContinue={handleFormContinue} />}
        {currentStep === 2 && bookingData && (
          <RoomSelection
            bookingData={bookingData}
            onBack={() => setCurrentStep(1)}
            onContinue={handleRoomSelectionContinue}
          />
        )}
        {currentStep === 3 && finalReservationData && (
          <Confirmation
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

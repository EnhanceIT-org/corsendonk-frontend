import { DateRangePicker } from "@/components/DateRangePicker";
import { OccupancySelector } from "@/components/OccupancySelector";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, CircleDot } from "lucide-react";

const SAMPLE_ROOMS = [
  {
    title: "Deluxe King Room",
    description: "Spacious room with king-size bed and city view",
    price: 299,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80",
    amenities: ["King Bed", "City View", "Free WiFi", "Mini Bar"],
  },
  {
    title: "Superior Twin Room",
    description: "Comfortable room with two single beds",
    price: 249,
    image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80",
    amenities: ["Twin Beds", "Garden View", "Free WiFi", "Work Desk"],
  },
  {
    title: "Executive Suite",
    description: "Luxury suite with separate living area",
    price: 499,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80",
    amenities: ["King Bed", "Living Room", "Ocean View", "Bathtub"],
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
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
          {/* Connecting Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
          
          {/* Steps */}
          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  step < currentStep 
                    ? 'bg-primary border-primary text-white' 
                    : step === currentStep
                    ? 'bg-white border-primary text-primary'
                    : 'bg-white border-gray-300 text-gray-300'
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
              <div 
                className={`mt-2 font-medium ${
                  step <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step === 1 ? 'Dates & Guests' : step === 2 ? 'Select Room' : 'Confirm'}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Dates and Guests */}
        {currentStep === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Dates</h2>
              <DateRangePicker />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Number of Guests</h2>
              <OccupancySelector />
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleNextStep}>Continue to Room Selection</Button>
            </div>
          </div>
        )}

        {/* Step 2: Room Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-6">
              {SAMPLE_ROOMS.map((room) => (
                <RoomCard key={room.title} {...room} />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>Continue to Confirmation</Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            {/* Add booking summary content here */}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button>Confirm Booking</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
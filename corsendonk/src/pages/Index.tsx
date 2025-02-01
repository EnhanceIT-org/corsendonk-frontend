import { DateRangePicker } from "@/components/DateRangePicker";
import { OccupancySelector } from "@/components/OccupancySelector";
import { ArrangmentCard } from "@/components/ArrangmentCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, CircleDot } from "lucide-react";
import { fetchWithBaseUrl } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import axios from "axios";

const SAMPLE_ROOMS = [
  {
    title: "Deluxe King Room",
    description: "Spacious room with king-size bed and city view",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80",
    amenities: ["King Bed", "City View", "Free WiFi", "Mini Bar"],
  },
  {
    title: "Superior Twin Room",
    description: "Comfortable room with two single beds",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80",
    amenities: ["Twin Beds", "Garden View", "Free WiFi", "Work Desk"],
  },
  {
    title: "Executive Suite",
    description: "Luxury suite with separate living area",
    price: 499,
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80",
    amenities: ["King Bed", "Living Room", "Ocean View", "Bathtub"],
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArrangement, setSelectedArrangement] = useState(null); // State to hold the selected room
  const [arrangement, setArrangement] = useState(3); // Default to 3
  const today = new Date();
  const [startDate, setStartDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  }); // State for start date
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const handleAdultsChange = (adults: string) => {
    setAdults(Number(adults));
  };

  const handleChildrenChange = (children: string) => {
    setChildren(Number(children));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleToRoomSelectionStep = () => {
    requestPossibleArrangments.mutate();
    setCurrentStep(2);
  };

  const handleArrangementChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setArrangement(Number(event.target.value));
  };

  const handleRoomsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRooms(Number(event.target.value));
  };

  const handleToConfirmation = () => {
    //TODO: add a prettier confirmation
    const confirmed = window.confirm(
      `Are you sure you want to select room ${selectedArrangement}?`,
    );
    if (confirmed) {
      console.log(selectedArrangement); // Log the selected arrangement
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Example of a query
  const initialQuery = useQuery({
    queryKey: ["initialSetup"],
    queryFn: async () => {
      const response = await fetchWithBaseUrl(
        "/reservations/initial-setup-basics/",
      );
      return response.json();
    },
  });
  // post request with data
  const requestPossibleArrangments = useMutation({
    mutationFn: async () => {
      return axios.post("http://localhost:8000/reservations/availability/", {
        startDate: `${startDate?.from.getDate().toString().padStart(2, "0")}-${(
          startDate?.from.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${startDate?.from.getFullYear()}`, // (DD-MM-YYYY)
        length: arrangement,
        guests: {
          adults: adults,
          children: children,
        },
        amountOfRooms: rooms,
        useHalfBoard: true,
      });
    },
    onSuccess: (data) => {
      console.log("Request successful:", data);
    },
    onError: (error) => {
      console.error("Request failed:", error);
    },
  });

  if (initialQuery.isPending) {
    return "Loading... initial";
  }
  if (initialQuery.isError) {
    return <div>Error: {initialQuery.error.message}</div>;
  }

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
            <div
              key={step}
              className="relative z-10 flex flex-col items-center"
            >
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
              <div
                className={`mt-2 font-medium ${
                  step <= currentStep ? "text-primary" : "text-gray-400"
                }`}
              >
                {step === 1
                  ? "Dates & Guests"
                  : step === 2
                    ? "Select Room"
                    : "Confirm"}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Dates and Guests */}
        {currentStep === 1 && (
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
                onAdultsChange={handleAdultsChange}
                onChildrenChange={handleChildrenChange}
              />
            </div>
            {/* New Arrangement Picker */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Select Arrangement Length
              </h2>
              <select value={arrangement} onChange={handleArrangementChange}>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            {/* Amount of rooms picker */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Amount of Rooms</h2>
              <select value={rooms} onChange={handleRoomsChange}>
                {[...Array(adults + children).keys()].map((i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleToRoomSelectionStep}>
                Continue to Room Selection
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Room Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {requestPossibleArrangments.isPending && (
              <div>Loading arrangements...</div>
            )}
            {requestPossibleArrangments.isError && (
              <div className="text-red-500">
                Error: {requestPossibleArrangments.error.message}
              </div>
            )}

            {requestPossibleArrangments.isSuccess && <div>Succes</div>}

            <div className="grid gap-6">
              {SAMPLE_ROOMS.map((room) => (
                <ArrangmentCard
                  key={room.title}
                  {...room}
                  selectedArrangement={selectedArrangement}
                  setSelectedArrangement={setSelectedArrangement}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleToConfirmation}>
                Continue to Confirmation
              </Button>
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

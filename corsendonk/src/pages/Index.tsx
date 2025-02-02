import { DateRangePicker } from "@/components/DateRangePicker";
import { OccupancySelector } from "@/components/OccupancySelector";
import { ArrangmentCard } from "@/components/ArrangmentCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  // -------------------------
  // STATE DECLARATIONS
  // -------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArrangement, setSelectedArrangement] = useState(null);
  const [arrangement, setArrangement] = useState(3); // Arrangement length: 3 or 4 nights
  const today = new Date();
  const [startDate, setStartDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [availableArrangements, setAvailableArrangements] = useState<any>(null);
  const [isLoadingArrangements, setIsLoadingArrangements] = useState(false);
  const [arrangementError, setArrangementError] = useState<any>(null);

  // -------------------------
  // HANDLER FUNCTIONS
  // -------------------------
  const handleAdultsChange = (adults: string) => {
    setAdults(Number(adults));
  };

  const handleChildrenChange = (children: string) => {
    setChildren(Number(children));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleArrangementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setArrangement(Number(e.target.value));
  };

  const handleRoomsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRooms(Number(e.target.value));
  };

  // Format the start date for the GET endpoint (YYYY-MM-DD)
  const formattedStartDateGET = startDate?.from
    ? startDate.from.toISOString().split("T")[0]
    : null;

  // Format the start date for the POST payload (DD-MM-YYYY)
  const formattedStartDatePOST = startDate?.from
    ? `${startDate.from.getDate().toString().padStart(2, "0")}-${(
        startDate.from.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${startDate.from.getFullYear()}`
    : null;

  // -------------------------
  // REACT QUERY: GET CONFIG DATA
  // -------------------------
  // This query is defined with enabled: false so it does not run immediately.
  // We’ll trigger it manually when the user clicks "Continue to Room Selection."
  const {
    data: initialSetupData,
    refetch: fetchInitialSetup,
    isLoading: initialSetupLoading,
    error: initialSetupError,
  } = useQuery({
    queryKey: ["initialSetup", formattedStartDateGET, arrangement],
    queryFn: async () => {
      if (!formattedStartDateGET) {
        throw new Error("No start date provided");
      }
      // Note the trailing slash to avoid Django's 301 redirect.
      const response = await fetchWithBaseUrl(
        `/reservations/initial-setup/?startDate=${formattedStartDateGET}&length=${arrangement}`
      );
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    },
    enabled: false,
  });

  // -------------------------
  // HANDLER TO MOVE TO ROOM SELECTION STEP
  // -------------------------
  const handleToRoomSelectionStep = async () => {
    try {
      setArrangementError(null);
      setIsLoadingArrangements(true);

      // 1. Manually trigger the GET call for configuration data.
      const configResponse = await fetchInitialSetup();
      // (You can use configResponse.data later if needed.)

      // 2. Build the payload for the availability endpoint.
      if (!formattedStartDatePOST) {
        throw new Error("Start date is missing for availability call");
      }
      const payload = {
        startDate: formattedStartDatePOST,
        length: arrangement,
        guests: {
          adults,
          children,
        },
        amountOfRooms: rooms,
      };

      // 3. Make two POST requests concurrently for half board true and false.
      const [availabilityHBTrue, availabilityHBFalse] = await Promise.all([
        axios.post("http://localhost:8000/reservations/availability/", {
          ...payload,
          useHalfBoard: true,
        }),
        axios.post("http://localhost:8000/reservations/availability/", {
          ...payload,
          useHalfBoard: false,
        }),
      ]);

      // 4. Save the returned arrangements along with the config data.
      setAvailableArrangements({
        halfBoardTrue: availabilityHBTrue.data,
        halfBoardFalse: availabilityHBFalse.data,
        config: configResponse.data,
      });

      // 5. Advance to Step 2 (Room Selection).
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error in room selection step:", error);
      setArrangementError(error);
    } finally {
      setIsLoadingArrangements(false);
    }
  };

  const handleToConfirmation = () => {
    const confirmed = window.confirm(
      `Are you sure you want to select room ${selectedArrangement}?`
    );
    if (confirmed) {
      console.log("Selected arrangement:", selectedArrangement);
      setCurrentStep(3);
    }
  };

  // -------------------------
  // RENDERING
  // -------------------------
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

        {/* Step 1: Dates & Guests */}
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
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Select Arrangement Length
              </h2>
              <select value={arrangement} onChange={handleArrangementChange}>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
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
            {isLoadingArrangements && (
              <div className="mb-4 text-blue-600">
                Loading arrangements...
              </div>
            )}
            {arrangementError && (
              <div className="mb-4 text-red-500">
                Error: {arrangementError.message}
              </div>
            )}
            {availableArrangements && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Available Arrangements
                </h2>
                <div>
                  <h3 className="text-lg font-medium">Half Board: Yes</h3>
                  <pre className="bg-gray-100 p-2 rounded">
                    {JSON.stringify(availableArrangements.halfBoardTrue, null, 2)}
                  </pre>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Half Board: No</h3>
                  <pre className="bg-gray-100 p-2 rounded">
                    {JSON.stringify(availableArrangements.halfBoardFalse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* (Optional) You can still display SAMPLE_ROOMS or merge these with the arrangements */}
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
            {/* Booking summary details go here */}
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

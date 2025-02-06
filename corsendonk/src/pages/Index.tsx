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

// Dummy placeholder – you can remove SAMPLE_ROOMS once your UI is complete.
const SAMPLE_ROOMS = [
  {
    title: "Deluxe King Room",
    description: "Spacious room with king-size bed and city view",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80",
    amenities: ["King Bed", "City View", "Free WiFi", "Mini Bar"],
  },
  // ... more sample rooms if needed
];

const Index = () => {
  // -------------------------
  // STATE DECLARATIONS
  // -------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArrangement, setSelectedArrangement] = useState<any>(null);
  const [arrangement, setArrangement] = useState(3); // 3 or 4 nights
  const today = new Date();
  const [startDate, setStartDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // These state vars hold our combined responses from our API calls:
  // availableArrangements contains the two availability responses and the raw config.
  const [availableArrangements, setAvailableArrangements] = useState<any>(null);
  // pricingData holds the pricing responses (one for half board true and one for false)
  const [pricingData, setPricingData] = useState<any>(null);
  const [isLoadingArrangements, setIsLoadingArrangements] = useState(false);
  const [arrangementError, setArrangementError] = useState<any>(null);

  // -------------------------
  // HELPER FUNCTIONS
  // -------------------------
  // Given a hotel key and a category id, look up the corresponding category details from the raw config.
  const getCategoryDetails = (hotelKey: string, categoryId: string) => {
    // availableArrangements.config is expected to be an object keyed by hotel key.
    if (
      availableArrangements &&
      availableArrangements.config &&
      availableArrangements.config[hotelKey] &&
      availableArrangements.config[hotelKey].rawConfig &&
      availableArrangements.config[hotelKey].rawConfig.Configurations &&
      availableArrangements.config[hotelKey].rawConfig.Configurations.length > 0
    ) {
      const rawConfig = availableArrangements.config[hotelKey].rawConfig;
      const imageBaseUrl = rawConfig.ImageBaseUrl;
      // Assume the first configuration's Enterprise object contains the Categories.
      const categories =
        rawConfig.Configurations[0].Enterprise.Categories || [];
      const category = categories.find((cat: any) => cat.Id === categoryId);
      if (category) {
        const name = category.Name["en-GB"] || "Unknown";
        const imageId =
          category.ImageIds && category.ImageIds.length > 0
            ? category.ImageIds[0]
            : null;
        const imageUrl = imageId ? `${imageBaseUrl}/${imageId}` : null;
        return { name, imageUrl };
      }
    }
    return { name: "Unknown", imageUrl: null };
  };

  // Given a hotel key, a date, and a category id, find the price from pricingData.
  const getPriceForNight = (
    hotelKey: string,
    date: string,
    categoryId: string,
    halfBoard: boolean
  ) => {
    if (!pricingData) return "N/A";
    // pricingData is stored with keys halfBoardTrue and halfBoardFalse.
    const key = halfBoard ? "halfBoardTrue" : "halfBoardFalse";
    if (!pricingData[key] || !pricingData[key].nightlyPricing) return "N/A";
    // Find the pricing record for this hotel and date.
    const record = pricingData[key].nightlyPricing.find(
      (item: any) => item.hotel === hotelKey && item.date === date
    );
    if (record && record.pricing && record.pricing.CategoryPrices) {
      const catPrice = record.pricing.CategoryPrices.find(
        (cp: any) => cp.CategoryId === categoryId
      );
      if (catPrice && catPrice.OccupancyPrices && catPrice.OccupancyPrices.length > 0) {
        // For simplicity, use the first RateGroupPrice's MinPrice.
        const rateGroup = catPrice.OccupancyPrices[0].RateGroupPrices[0];
        if (rateGroup && rateGroup.MinPrice && rateGroup.MinPrice.TotalAmount) {
          return `${rateGroup.MinPrice.TotalAmount.GrossValue} ${rateGroup.MinPrice.TotalAmount.Currency}`;
        }
      }
    }
    return "N/A";
  };

  // -------------------------
  // HANDLER FUNCTIONS
  // -------------------------
  const handleAdultsChange = (val: string) => setAdults(Number(val));
  const handleChildrenChange = (val: string) => setChildren(Number(val));
  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);
  const handleArrangementChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => setArrangement(Number(e.target.value));
  const handleRoomsChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setRooms(Number(e.target.value));

  // Format dates for API calls.
  const formattedStartDateGET = startDate?.from
    ? startDate.from.toISOString().split("T")[0]
    : null;
  const formattedStartDatePOST = startDate?.from
    ? `${startDate.from.getDate().toString().padStart(2, "0")}-${(
        startDate.from.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${startDate.from.getFullYear()}`
    : null;

  // React Query: GET full configuration (no pricing)
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
      // Trailing slash avoids Django 301 redirect.
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

  // Handler: When clicking "Continue to Room Selection"
  // Now this calls:
  // 1. The config endpoint.
  // 2. The availability endpoint twice (for halfBoard true and false).
  // 3. Immediately calls the new pricing endpoint for each optimal_sequence.
  const handleToRoomSelectionStep = async () => {
    try {
      setArrangementError(null);
      setIsLoadingArrangements(true);

      // 1. Fetch config data.
      const configResponse = await fetchInitialSetup();

      // 2. Build payload for availability.
      if (!formattedStartDatePOST) {
        throw new Error("Start date is missing for availability call");
      }
      const payload = {
        startDate: formattedStartDatePOST,
        length: arrangement,
        guests: { adults, children },
        amountOfRooms: rooms,
      };

      // 3. Call availability endpoint twice.
      const [availHBTrue, availHBFalse] = await Promise.all([
        axios.post("http://localhost:8000/reservations/availability/", {
          ...payload,
          useHalfBoard: false, // for example
        }),
        axios.post("http://localhost:8000/reservations/availability/", {
          ...payload,
          useHalfBoard: true,
        }),
      ]);

      // 4. Save availability responses along with config.
      setAvailableArrangements({
        config: configResponse.data.hotels, // config response per hotel
        halfBoardFalse: availHBFalse.data, // assume halfBoard true in one and false in the other
        halfBoardTrue: availHBTrue.data,
      });

      // 5. Immediately call the pricing endpoint for both sequences.
      const optimalFalse = availHBFalse.data.optimal_sequence;
      const optimalTrue = availHBTrue.data.optimal_sequence;
      const [pricingFalseRes, pricingTrueRes] = await Promise.all([
        axios.post("http://localhost:8000/reservations/pricing/", {
          selectedArrangement: optimalFalse,
        }),
        axios.post("http://localhost:8000/reservations/pricing/", {
          selectedArrangement: optimalTrue,
        }),
      ]);
      setPricingData({
        halfBoardFalse: pricingFalseRes.data,
        halfBoardTrue: pricingTrueRes.data,
      });

      // Optionally auto-select one arrangement to use (we default here to the false case)
      setSelectedArrangement(optimalFalse);

      // Advance to Step 2.
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error in room selection step:", error);
      setArrangementError(error);
    } finally {
      setIsLoadingArrangements(false);
    }
  };

  // -------------------------
  // UI RENDERING
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
              <h2 className="text-lg font-semibold mb-4">Select Arrangement Length</h2>
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

        {/* Step 2: Room Selection & Pricing Display */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {isLoadingArrangements && (
              <div className="mb-4 text-blue-600">Loading arrangements...</div>
            )}
            {arrangementError && (
              <div className="mb-4 text-red-500">
                Error: {arrangementError.message}
              </div>
            )}
            {availableArrangements && pricingData && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Available Arrangements
                </h2>

                {/* Section for Half Board: No */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-2">Half Board: No</h3>
                  {availableArrangements.halfBoardFalse.optimal_sequence && (
                    <div>
                      <p className="mb-2">
                        <strong>Sequence:</strong>{" "}
                        {availableArrangements.halfBoardFalse.optimal_sequence.sequence.join(
                          " → "
                        )}
                      </p>
                      {availableArrangements.halfBoardFalse.optimal_sequence.night_details.map(
                        (night: any, idx: number) => {
                          // Look up pricing for this night:
                          const price = getPriceForNight(
                            night.hotel,
                            night.date,
                            night.chosen_rooms[0].category_id,
                            false
                          );
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
                              </p>
                              {night.restaurant_chosen && (
                                <p>
                                  <strong>Restaurant:</strong>{" "}
                                  {night.restaurant_chosen}
                                </p>
                              )}
                              <p>
                                <strong>Price:</strong> {price}
                              </p>
                              <div className="mt-2">
                                <strong>Room Options:</strong>
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                  {night.room_options.map(
                                    (option: any, optIdx: number) => {
                                      const details = getCategoryDetails(
                                        night.hotel,
                                        option.category_id
                                      );
                                      return (
                                        <div
                                          key={optIdx}
                                          className="border rounded p-2"
                                        >
                                          {details.imageUrl && (
                                            <img
                                              src={details.imageUrl}
                                              alt={details.name}
                                              className="w-full h-24 object-cover mb-2"
                                            />
                                          )}
                                          <p className="font-bold">
                                            {option.category_name}
                                          </p>
                                          <p>Bed Capacity: {option.bed_capacity}</p>
                                          <p>
                                            Available: {option.available_count}
                                          </p>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                      {availableArrangements.halfBoardFalse.optimal_sequence.overall_notes && (
                        <div>
                          <strong>Notes:</strong>{" "}
                          {availableArrangements.halfBoardFalse.optimal_sequence.overall_notes.join(
                            "; "
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section for Half Board: Yes */}
                <div>
                  <h3 className="text-lg font-bold mb-2">Half Board: Yes</h3>
                  {availableArrangements.halfBoardTrue.optimal_sequence && (
                    <div>
                      <p className="mb-2">
                        <strong>Sequence:</strong>{" "}
                        {availableArrangements.halfBoardTrue.optimal_sequence.sequence.join(
                          " → "
                        )}
                      </p>
                      {availableArrangements.halfBoardTrue.optimal_sequence.night_details.map(
                        (night: any, idx: number) => {
                          const price = getPriceForNight(
                            night.hotel,
                            night.date,
                            night.chosen_rooms[0].category_id,
                            true
                          );
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
                              </p>
                              {night.restaurant_chosen && (
                                <p>
                                  <strong>Restaurant:</strong>{" "}
                                  {night.restaurant_chosen}
                                </p>
                              )}
                              <p>
                                <strong>Price:</strong> {price}
                              </p>
                              <div className="mt-2">
                                <strong>Room Options:</strong>
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                  {night.room_options.map(
                                    (option: any, optIdx: number) => {
                                      const details = getCategoryDetails(
                                        night.hotel,
                                        option.category_id
                                      );
                                      return (
                                        <div
                                          key={optIdx}
                                          className="border rounded p-2"
                                        >
                                          {details.imageUrl && (
                                            <img
                                              src={details.imageUrl}
                                              alt={details.name}
                                              className="w-full h-24 object-cover mb-2"
                                            />
                                          )}
                                          <p className="font-bold">
                                            {option.category_name}
                                          </p>
                                          <p>Bed Capacity: {option.bed_capacity}</p>
                                          <p>
                                            Available: {option.available_count}
                                          </p>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                      {availableArrangements.halfBoardTrue.optimal_sequence.overall_notes && (
                        <div>
                          <strong>Notes:</strong>{" "}
                          {availableArrangements.halfBoardTrue.optimal_sequence.overall_notes.join(
                            "; "
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* You can remove the SAMPLE_ROOMS placeholder if not needed */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Continue to Confirmation
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation (Summary) */}
        {currentStep === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            <div>
              <h3>Selected Arrangement:</h3>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(selectedArrangement, null, 2)}
              </pre>
            </div>
            <div className="mt-4">
              <h3>Pricing Information:</h3>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(pricingData, null, 2)}
              </pre>
            </div>
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

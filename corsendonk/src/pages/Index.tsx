import React, { useState } from "react";
import { ArrangementForm } from "@/components/booking/ArrangementForm";
import { RoomPicker } from "@/components/booking/RoomPicker";
import { BookingSummary } from "@/components/booking/BookingSummary";

export interface BookingFormData {
  startDate: string; // formatted as DD-MM-YYYY
  arrangementLength: number;
  rooms: number;
  adults: number;
  children: number;
  travelMode: "walking" | "cycling";
  boardOption: "breakfast" | "halfboard";
}

export interface finalReservationData {
  travelMode: "walking" | "cycling";
  boardOption: string;
  selectedArrangement: {
    night_details: {
      date: string;
      hotel: string;
      board_type: string;
      notes: string[];
      chosen_rooms: {
        bed_capacity: number;
        category_id: string;
        category_name: string;
        occupant_countAdults?: number;
        occupant_countChildren?: number;
      }[];
      room_options: {
        available_count: number;
        bed_capacity: number;
        category_id: string;
        category_name: string;
        room_group: string;
      }[];
      restaurant_chosen: string;
    }[];
    overall_notes: string[];
    score: number;
    sequence: string[];
  };
  pricingData: {
    breakfast: {
      nightlyPricing: {
        date: string;
        hotel: string;
        pricing: {
          RateGroups: {
            Id: string;
            Ordering: number;
            SettlementAction: string;
            SettlementCurrencyCode: string;
            SettlementFlatValue: null | number;
            SettlementMaximumNights: null | number;
            SettlementMaximumTimeUnits: null | number;
            SettlementOffset: string;
            SettlementTrigger: string;
            SettlementType: string;
            SettlementValue: number;
          }[];
          Rates: {
            Id: string;
            RateGroupId: string;
            Ordering: number;
            CurrencyCode: string;
            Description: any;
            Name: any;
            IsPrivate: false;
          }[];
          CategoryPrices: {
            CategoryId: string;
            OccupancyPrices: {
              Occupancies: [{ AgeCategoryId: string; PersonCount: number }];
              RateGroupPrices: {
                MinRateId: string;
                MinPrice: {
                  TotalAmount: {
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      TaxValue: number;
                    }[];
                  };
                  AverageAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                };
                MaxPrice: {
                  TotalAmount: {
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      TaxValue: number;
                    }[];
                  };
                  AverageAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                };
              }[];
            }[];
          }[];
          ViolatedRestrictions: null;
        };
      }[];
    };
    halfboard: {
      nightlyPricing: {
        date: string;
        hotel: string;
        pricing: {
          RateGroups: {
            Id: string;
            Ordering: number;
            SettlementAction: string;
            SettlementCurrencyCode: string;
            SettlementFlatValue: null | number;
            SettlementMaximumNights: null | number;
            SettlementMaximumTimeUnits: null | number;
            SettlementOffset: string;
            SettlementTrigger: string;
            SettlementType: string;
            SettlementValue: number;
          }[];
          Rates: {
            Id: string;
            RateGroupId: string;
            Ordering: number;
            CurrencyCode: string;
            Description: any;
            Name: any;
            IsPrivate: false;
          }[];
          CategoryPrices: {
            CategoryId: string;
            OccupancyPrices: {
              Occupancies: { AgeCategoryId: string; PersonCount: number }[];
              RateGroupPrices: {
                MinRateId: string;
                MinPrice: {
                  TotalAmount: {
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      TaxValue: number;
                    }[];
                  };
                  AverageAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                };
                MaxPrice: {
                  TotalAmount: {
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      TaxValue: number;
                    }[];
                  };
                  AverageAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                  AverageServiceItemAmountPerFullTimeUnit: {
                    Breakdown: {
                      items: {
                        TaxRateCode: string;
                        NetValue: number;
                        TaxValue: number;
                      }[];
                    };
                    Currency: string;
                    GrossValue: number;
                    NetValue: number;
                    TaxValues: {
                      TaxRateCode: string;
                      Value: number;
                    }[];
                  };
                };
              }[];
            }[];
          }[];
          ViolatedRestrictions: null;
        };
      }[];
    };
  };
  rawConfig: any;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [finalReservationData, setFinalReservationData] =
    useState<finalReservationData>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleFormContinue = (data: BookingFormData) => {
    setBookingData(data);
    setCurrentStep(2);
  };

  const handleRoomSelectionContinue = (
    selectedArrangement: any,
    pricingData: any,
    totalPrice: number,
    boardOption: any,
    travelMode: "walking" | "cycling",
    rawConfig: any,
  ) => {
    setFinalReservationData({
      selectedArrangement,
      pricingData,
      boardOption,
      travelMode,
      rawConfig,
    });
    setTotalPrice(totalPrice);
    setCurrentStep(3);
  };

  const handleBookingSuccess = (reservationData: any) => {
    console.log("Booking successful!", reservationData);
    // You can redirect or display a final confirmation message here.
  };

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container py-8">
        {/* Progress Timeline */}
        {currentStep === 1 && (
          <ArrangementForm
            onContinue={handleFormContinue}
            bookingData={{
              arrangementLength: bookingData?.arrangementLength,
              startDate: bookingData?.startDate,
              adults: bookingData?.adults,
              children: bookingData?.children,
              rooms: bookingData?.rooms,
              travelMode: bookingData?.travelMode,
              boardOption: bookingData?.boardOption,
            }}
          />
        )}
        {currentStep === 2 && (
          <RoomPicker
            bookingData={bookingData}
            onBack={() => setCurrentStep(1)}
            onContinue={handleRoomSelectionContinue}
          />
        )}
        {currentStep == 3 && (
          <BookingSummary
            selectedArrangement={finalReservationData.selectedArrangement}
            pricingData={finalReservationData.pricingData}
            totalPrice={totalPrice}
            boardOption={finalReservationData.boardOption}
            travelMode={finalReservationData.travelMode}
            rawConfig={finalReservationData.rawConfig}
            onBack={() => setCurrentStep(2)}
            onBookingSuccess={handleBookingSuccess}
            onBackToStep2={() => setCurrentStep(2)}
            onBackToStep1={() => setCurrentStep(1)}
          />
        )}
      </main>
    </div>
  );
};

export default Index;

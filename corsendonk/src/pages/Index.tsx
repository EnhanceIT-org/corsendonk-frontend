import React, { useState } from "react";
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

export interface finalReservationData {
  optionalProducts: {
    lunch: boolean;
    bicycleRent: boolean;
    bicycleTransport: boolean;
  };
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
    optionalProducts: any,
    boardOption: any,
  ) => {
    setFinalReservationData({
      selectedArrangement,
      pricingData,
      optionalProducts,
      boardOption,
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
          <ArrangementForm onContinue={handleFormContinue} />
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
            totalPrice={totalPrice}
            boardOption={finalReservationData.boardOption}
            optionalProducts={finalReservationData.optionalProducts}
            onBack={() => setCurrentStep(2)}
            onBookingSuccess={handleBookingSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Index;

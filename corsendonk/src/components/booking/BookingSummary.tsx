import React, { useState, useEffect } from "react"; 
import { useTranslation } from 'react-i18next';
import { PersonalInformationForm } from "./PersonalInformationForm";
import { BookingDetails, getPriceForSingleRoom, getProductMeta } from "./BookingDetails"; 
import { Breadcrumb } from "./Breadcrumb";
import { RoomDetailModal } from "./RoomDetailModal";

interface BookingData {
  reservations: {
    date: string;
    board_type: string;
    hotel: string;
    notes: string[];
    restaurant_chosen: string;
    chosen_rooms: {
      bed_capacity: number;
      category_id: string;
      category_name: string;
      occupant_countAdults: number;
      occupant_countChildren: number;
    }[];
    extras: { [key: string]: boolean }; // Added extras to match RoomPicker's structure
    room_options: {
      available_count: number;
      bed_capacity: number;
      category_id: string;
      category_name: string;
      room_group: string;
    }[];
  }[];
  // optionalExtras removed - now part of reservations
  mealPlan: "breakfast" | "halfboard";
  total: number;
  pricing_data: {
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
      nightlyPricing: [
        {
          date: string;
          hotel: string;
          pricing: {
            RateGroups: [
              {
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
              },
            ];
            Rates: [
              {
                Id: string;
                RateGroupId: string;
                Ordering: number;
                CurrencyCode: string;
                Description: any;
                Name: any;
                IsPrivate: false;
              },
            ];
            CategoryPrices: [
              {
                CategoryId: string;
                OccupancyPrices: [
                  {
                    Occupancies: [
                      { AgeCategoryId: string; PersonCount: number },
                    ];
                    RateGroupPrices: [
                      {
                        MinRateId: string;
                        MinPrice: {
                          TotalAmount: {
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                TaxValue: number;
                              },
                            ];
                          };
                          AverageAmountPerTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageAmountPerFullTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageServiceItemAmountPerTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageServiceItemAmountPerFullTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                        };
                        MaxPrice: {
                          TotalAmount: {
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                TaxValue: number;
                              },
                            ];
                          };
                          AverageAmountPerTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageAmountPerFullTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageServiceItemAmountPerTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                          AverageServiceItemAmountPerFullTimeUnit: {
                            Breakdown: {
                              items: [
                                {
                                  TaxRateCode: string;
                                  NetValue: number;
                                  TaxValue: number;
                                },
                              ];
                            };
                            Currency: string;
                            GrossValue: number;
                            NetValue: number;
                            TaxValues: [
                              {
                                TaxRateCode: string;
                                Value: number;
                              },
                            ];
                          };
                        };
                      },
                    ];
                  },
                ];
              },
            ];
            ViolatedRestrictions: null;
          };
        },
      ];
    };
  };
  arrangementLength: number;
  travelMode: "walking" | "cycling";
  optionalProducts: { [hotel: string]: any }; // Added to fix type error
}

interface BookingSummaryProps {
  selectedArrangement: any; // Keep as any for now, but it matches selectedArrangementInterface from RoomPicker
  pricingData: any;
  totalPrice: number;
  boardOption: any;
  // optionalProducts prop removed
  travelMode: "walking" | "cycling";
  rawConfig: any;
  optionalProducts: { [hotel: string]: any };
  onBack: () => void;
  onBackToStep2: () => void;
  onBackToStep1: () => void;
  onBookingSuccess: (reservationData: any) => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedArrangement,
  pricingData,
  totalPrice,
  boardOption,
  travelMode,
  optionalProducts,
  onBack,
  onBackToStep1,
  onBackToStep2,
  onBookingSuccess,
  rawConfig,
}) => {
  const { t } = useTranslation(); // Instantiate hook
  const arrangementLength = selectedArrangement.night_details.length + 1; // 2 nights = 3 days, 3 nights = 4 days

  const [bookingData, setBookingData] = useState<BookingData>({
    reservations: selectedArrangement.night_details,
    pricing_data: pricingData,
    mealPlan: boardOption,
    total: totalPrice,
    arrangementLength: arrangementLength,
    travelMode: travelMode,
    optionalProducts,
  });

  // --- ADD THE ENTIRE useEffect HOOK BELOW ---
  useEffect(() => {
    // Create a deep copy to avoid mutating the original prop
    const enrichedReservations = JSON.parse(JSON.stringify(selectedArrangement.night_details));

    // Loop through each night to add calculated prices
    enrichedReservations.forEach((reservation: any) => {
      const boardKey = reservation.board_type === "HB" ? "halfboard" : "breakfast";
      const nightlyPricing = pricingData[boardKey];

      // 1. Add price to each chosen room
      reservation.chosen_rooms.forEach((room: any) => {
        const price = getPriceForSingleRoom(
          nightlyPricing,
          reservation.hotel,
          boardKey,
          room,
          reservation,
          travelMode,
          arrangementLength,
          reservation.restaurant_chosen,
        );
        room.price = price; // Add the calculated price to the room object
      });

      // 2. Add unit price to each selected extra
      reservation.chosen_rooms.forEach((room: any) => {
        if (room.extras) {
          Object.keys(room.extras).forEach((extraKey) => {
            if (room.extras[extraKey].selected) {
              const meta = getProductMeta(
                reservation.hotel,
                extraKey,
                arrangementLength as 3 | 4,
                optionalProducts
              );
              if (meta) {
                // Add the price-per-unit to the extra object
                room.extras[extraKey].unitPrice = meta.price;
              }
            }
          });
        }
      });
    });

    // Update the component's state with the new, price-rich data
    setBookingData(prevData => ({
      ...prevData,
      reservations: enrichedReservations,
    }));
  }, [selectedArrangement, pricingData, boardOption, travelMode, optionalProducts, arrangementLength]);
 
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [modalRoomData, setModalRoomData] = useState<any>(null);

  return (
    <main className="min-h-screen w-4/5 bg-gray-50 pb-32">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumb
          currentStep={3}
          title={t('breadcrumb.completeBooking', 'Complete your booking')}
          onNavigate={(step) => {
            if (step === 1) {
              onBackToStep1();
            } else if (step === 2) {
              onBackToStep2();
            }
          }}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <BookingDetails
              bookingData={bookingData}
              onShowRoomDetail={(room) => {
                setModalRoomData(room);
                setShowRoomDetailModal(true);
              }}
              optionalProducts={optionalProducts}
            />
          </div>
          <div className="lg:w-[400px]">
            <PersonalInformationForm
              bookingData={bookingData}
              travelMode={travelMode}
            />
          </div>
        </div>
      </div>
      {showRoomDetailModal && modalRoomData && (
        <RoomDetailModal
          room={modalRoomData}
          rawConfig={rawConfig}
          onClose={() => setShowRoomDetailModal(false)}
        />
      )}
    </main>
  );
};

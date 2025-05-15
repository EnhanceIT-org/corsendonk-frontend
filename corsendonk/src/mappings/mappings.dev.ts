export const ageCategoryMapping: Record<
  string,
  { adult: string; child: string }
> = {
  hotel1: {
    adult: "16487bf1-af39-46e0-aae5-b1d100cfeec9",
    child: "324ab00f-5da5-498b-a5d5-b1d100cfeec9",
  },
  hotel2: {
    adult: "37a0fb60-2212-450f-a17c-b1e900ba9722",
    child: "514dd72f-3b63-45d2-aad3-b1e900ba9722",
  },
  hotel3: {
    adult: "28a0d68d-d2d7-438a-af37-af6a009d86ac",
    child: "37119ed2-d0c3-4ce5-9abb-af6a009d86ac",
  },
};

export const BoardMapping: any = {
  hotel1: {
    walking: {
      "3D": {
        halfboard: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Walking package Half Board 3D
        breakfast: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Walking package Half Board 4D
        breakfast: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Cycling package Half Board 3D
        breakfast: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Cycling package Half Board 4D
        breakfast: "4b28a7cc-8ba5-466f-b641-b2d900e871df", // Cycling package Breakfast 4D
      },
    },
  },
  hotel2: {
    walking: {
      "3D": {
        halfboard: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Walking package Half Board 3D
        breakfast: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Walking package Half Board 4D
        breakfast: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Cycling package Half Board 3D
        breakfast: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Cycling package Half Board 4D
        breakfast: "9507a3dd-4874-4756-ad9d-b1e900ba9727", // Cycling package Breakfast 4D
      },
    },
  },
  hotel3: {
    walking: {
      "3D": {
        halfboard: {
          Bink: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Half Board 3D Bink
          Bardo: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Half Board 3D Bardo
        },
        breakfast: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Half Board 4D Bink
          Bardo: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Half Board 4D Bardo
        },
        breakfast: "21457484-37a2-4623-aea8-af6a009d86c1", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: {
          Bink: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Half Board 3D Bink
          Bardo: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Half Board 3D Bardo
        },
        breakfast: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Half Board 4D Bink
          Bardo: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Half Board 4D Bardo
        },
        breakfast: "21457484-37a2-4623-aea8-af6a009d86c1", // Cycling package Breakfast 4D
      },
    },
  },
};


export const HOTEL_NAME_MAPPING: { [key: string]: string } = {
  hotel1: "Priorij",
  hotel2: "Hooge Heyde",
  hotel3: "Turnova",
};

export const optionalProducts = [
  {
    key: "lunch",
    name: "Lunch pakket",
    price: {
      hotel1: 10,
      hotel2: 15,
      hotel3: 20,
    },
    chargingMethod: "PerPersonNight",
    availableFor: ["walking", "cycling"],
  },
  {
    key: "huisdier",
    name: "Huisdier op kamer",
    price: {
      hotel1: 10,
      hotel2: 15,
      hotel3: 20,
    },
    chargingMethod: "Once",
    availableFor: ["walking", "cycling"],
  },
  {
    key: "bicycleRent",
    name: "Fiets Verhuur",
    price: {
      hotel1: 20,
      hotel2: 25,
      hotel3: 30,
    },
    chargingMethod: "Once",
    availableFor: ["cycling"],
  },
];

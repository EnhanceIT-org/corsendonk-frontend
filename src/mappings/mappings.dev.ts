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
        halfboard: "415a1c0c-eada-459c-8c73-b2e000d30e19", // Walking package Half Board 3D
        breakfast: "307e4bad-c830-4241-a451-b2e000d2cf6e", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "af632a21-b198-4c53-ab0d-b2e000d31ec3", // Walking package Half Board 4D
        breakfast: "1a729aa2-91e2-4c1a-b1f2-b2e000d2eb19", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "2e09b9da-23a1-4cb2-b08f-b2e000d2a03d", // Cycling package Half Board 3D
        breakfast: "d5dfe981-5c68-4961-bb57-b2e000d26e14", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "fb92fe22-e6c2-4cbb-9e1c-b2e000d2b91b", // Cycling package Half Board 4D
        breakfast: "09e35118-8b71-42e4-a40d-b2e000d28a3e", // Cycling package Breakfast 4D
      },
    },
  },
  hotel2: {
    walking: {
      "3D": {
        halfboard: "6c4b4df0-b3d0-4665-8f27-b2e000d10047", // Walking package Half Board 3D
        breakfast: "362f52d3-8694-42ab-8359-b2e000d0c7cc", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "6a912261-a6cf-4da5-b89c-b2e000d1120e", // Walking package Half Board 4D
        breakfast: "d168912b-28fb-42d9-844d-b2e000d0dab7", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "095c81ac-7f60-4ca4-bddf-b2e000d09e25", // Cycling package Half Board 3D
        breakfast: "0157f383-7f12-4cf0-b131-b2e000d0468d", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "0a764ed7-6763-4aa6-8345-b2e000d0b07b", // Cycling package Half Board 4D
        breakfast: "c6fde8c1-5414-44d3-94b5-b2e000d08331", // Cycling package Breakfast 4D
      },
    },
  },
  hotel3: {
    walking: {
      "3D": {
        halfboard: {
          Bink: "e4ef3318-c3cb-41bd-8365-b2e000d5c430", // Walking package Half Board 3D Bink
          Bardo: "80dc36cc-b856-42cb-b9cc-b2e000d5b405", // Walking package Half Board 3D Bardo
        },
        breakfast: "34944b0a-aee3-43c9-a56f-b2e000d58ff2", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "290ace2f-6ead-497f-9217-b2e000d5f522", // Walking package Half Board 4D Bink
          Bardo: "aa52c43f-119d-4860-aae1-b2e000d5d96a", // Walking package Half Board 4D Bardo
        },
        breakfast: "b3bfab46-68e3-4d02-8ea0-b2e000d5a0bc", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: {
          Bink: "be990725-86c0-4907-beed-b2e000d534fc", // Cycling package Half Board 3D Bink
          Bardo: "fe6299f5-ef2d-4b1d-a69a-b2e000d5215c", // Cycling package Half Board 3D Bardo
        },
        breakfast: "00f3c32e-ae01-4446-8f48-b2e000d4f648", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "a3a3f0dd-1ccf-4742-8a35-b2e000d57a0c", // Cycling package Half Board 4D Bink
          Bardo: "e5c9bc07-07e3-4771-b28b-b2e000d54e39", // Cycling package Half Board 4D Bardo
        },
        breakfast: "d0e283e9-131e-472f-b127-b2e000d50d09", // Cycling package Breakfast 4D
      },
    },
  },
};


export const HOTEL_NAME_MAPPING: { [key: string]: string } = {
  hotel1: "Priorij",
  hotel2: "Hooge Heyde",
  hotel3: "Turnova",
};


export const lunchAdjustmentForChild: Record<string, number> = {
  hotel1: 7.50,
  hotel2: 8.50,
  hotel3: 8.50,
};
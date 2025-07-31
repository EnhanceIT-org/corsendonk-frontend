export const ageCategoryMapping: Record<
  string,
  { adult: string; child: string }
> = {
  hotel1: {
    adult: "32e02e9a-53c9-439a-8718-ae7000f2f342",
    child: "73435727-9f3a-49b7-ab8f-ae7000f2f342",
  },
  hotel2: {
    adult: "8bedb859-a9f1-40fb-aec6-b18e00f698c2",
    child: "2062df74-bcb4-4ee3-99ef-b18e00f698cc",
  },
  hotel3: {
    adult: "46d0861f-5e49-4a2e-b37e-b18d00d33c13",
    child: "4212c88e-c280-4b65-a69f-b18d00d33c28",
  },
};

export const BoardMapping: any = {
  hotel1: {
    walking: {
      "3D": {
        halfboard: "8800eb6d-0e04-4050-abfc-ae7000f2f347", // Walking package Half Board 3D
        breakfast: "a5687667-ba3d-40f3-9380-b27b016a290e", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "27249eea-e6ba-4bbc-aa81-b2a800d8d26c", // Walking package Half Board 4D
        breakfast: "7a0c6d4e-61cd-44d7-9b19-b2a800d8a9bf", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "7054672b-5324-474c-a71b-b27b016ad183", // Cycling package Half Board 3D
        breakfast: "bfae17fd-d945-4b3d-b27f-b27c015254dd", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "f8e2082d-d574-434b-9610-b2a800d88741", // Cycling package Half Board 4D
        breakfast: "624e3b1e-1a25-4bba-9231-b2a800d83845", // Cycling package Breakfast 4D
      },
    },
  },
  hotel2: {
    walking: {
      "3D": {
        halfboard: "acef6be3-5594-4056-99c1-b27c0153f853", // Walking package Half Board 3D
        breakfast: "8d65cfbd-c721-4f5c-a355-b18e00f698e0", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: "c8674e65-ba8e-46c6-8049-b2a800dd4193", // Walking package Half Board 4D
        breakfast: "6803c7dc-642d-40bf-b0d2-b2a800dd20f2", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: "f3efa627-9b59-4c39-baaa-b27c01584870", // Cycling package Half Board 3D
        breakfast: "8217396f-8db5-4e32-a69b-b27c01586992", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: "65810a7f-b0a3-41cf-a04b-b2a800dcf842", // Cycling package Half Board 4D
        breakfast: "95fe52ef-0ff1-4ab5-9a01-b2a800dcdd9b", // Cycling package Breakfast 4D
      },
    },
  },
  hotel3: {
    walking: {
      "3D": {
        halfboard: {
          Bink: "4b1be4b2-0699-42aa-bdbb-b27f00e382fb", // Walking package Half Board 3D Bink
          Bardo: "545c0c48-f31a-4cd8-ad96-b2c2012e96fb", // Walking package Half Board 3D Bardo
        },
        breakfast: "d10f8d15-4b06-4ea1-aa2a-b27f00e16550", // Walking package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "868b019a-b157-4180-bfa7-b2a800de8d3a", // Walking package Half Board 4D Bink
          Bardo: "81375e96-c998-40bd-99f4-b2c2012e7559", // Walking package Half Board 4D Bardo
        },
        breakfast: "507671c5-f360-49f8-bc98-b2a800de6a99", // Walking package Breakfast 4D
      },
    },
    cycling: {
      "3D": {
        halfboard: {
          Bink: "c00bb42d-20d1-4df6-a56f-b27f00e3e778", // Cycling package Half Board 3D Bink
          Bardo: "22e194ae-93d5-4e78-aef8-b2c2012eb41c", // Cycling package Half Board 3D Bardo
        },
        breakfast: "1186693d-57b7-41a2-9080-b27f00e3c985", // Cycling package Breakfast 3D
      },
      "4D": {
        halfboard: {
          Bink: "b5434197-6f08-4bcd-8c76-b2a800de513b", // Cycling package Half Board 4D Bink
          Bardo: "c0d76183-ebd3-4b55-9f02-b2c2012ef6b0", // Cycling package Half Board 4D Bardo
        },
        breakfast: "febe8205-217a-4640-80ae-b2a800de33ab", // Cycling package Breakfast 4D
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

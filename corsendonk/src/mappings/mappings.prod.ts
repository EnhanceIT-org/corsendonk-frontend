// age categories are fucked per hotel, basically everyone +12 is an adult
// maybe we should mention this on the frontend


//DONE
export const ageCategoryMapping: Record<
  string,
  { adult: string; child: string }
> = {
    hotel1: {
        adult: "e6c1575b-5c75-41b9-8667-adf200f7bc48", // Adults (No age limit)
        child: "aa6eeb7f-ab65-464c-9d4c-af3b00adedc8", // Child 3-5 years
      },
      hotel2: {
        adult: "30a5e937-e0ec-4888-946a-ae4a00d4dad6", // Adults (No age limit)
        child: "25ce1bd7-d5e7-4e5f-a617-af5500bf631c", // Child 6-12 years
      },
      hotel3: {
        adult: "e3bc5a6c-366e-4fd8-9273-ade400cf5657", // Adults (No age limit)
        child: "1707052e-2fbc-443d-a9a7-af6600bdc199", // Child 6-12 years
      },
};

//DONE
export const BoardMapping: any = {
    hotel1: {
      walking: {
        "3D": {
          halfboard: "6de6fd36-227f-4b77-a8c6-b29200d5d776", // Walking package Half Board 3D
          breakfast: "65e22f04-035d-4ae7-9ee4-b29200d10350", // Walking package Breakfast 3D
        },
        "4D": {
          halfboard: "764c3738-2f61-4b50-878b-b29200d76d2c", // Walking package Half Board 4D
          breakfast: "d61f12a1-3884-4937-8309-b29200d1fb53", // Walking package Breakfast 4D
        },
      },
      cycling: {
        "3D": {
          halfboard: "5865598e-9ad7-4721-962a-b29200d54e94", // Cycling package Half Board 3D
          breakfast: "3a21aa1f-3030-49b2-8552-b29200d0a88f", // Cycling package Breakfast 3D
        },
        "4D": {
          halfboard: "466b6ee1-112b-4e3f-9ccc-b29200d6776a", // Cycling package Half Board 4D
          breakfast: "136e256b-9ff4-4a45-9393-b29200d157a5", // Cycling package Breakfast 4D
        },
      },
    },
    hotel2: {
      walking: {
        "3D": {
          halfboard: "37d20aae-e6d8-4158-ad4f-b29200c164e0", // Walking package Half Board 3D
          breakfast: "91d65acf-3ade-427c-817a-b29200bfc460", // Walking package Breakfast 3D
        },
        "4D": {
          halfboard: "5300050f-df60-4fd0-91a0-b29200c21995", // Walking package Half Board 4D
          breakfast: "33296d26-c57e-4d38-b1c0-b29200c08dbb", // Walking package Breakfast 4D
        },
      },
      cycling: {
        "3D": {
          halfboard: "352a304c-3852-4026-835b-b29200c0fb08", // Cycling package Half Board 3D
          breakfast: "571c61af-2f38-41f0-ba8d-b29200bf60ea", // Cycling package Breakfast 3D
        },
        "4D": {
          halfboard: "356edf39-0043-4d21-88c7-b29200c1b63d", // Cycling package Half Board 4D
          breakfast: "7ac81c53-957c-464a-832e-b29200c03494", // Cycling package Breakfast 4D
        },
      },
    },
    hotel3: {
      walking: {
        "3D": {
          halfboard: "1dfa2775-e8ac-43aa-99eb-b2b800922b9a", // Walking package Half Board 3D
          breakfast: "019b1226-6a66-446a-aab2-b2b80092e066", // Walking package Breakfast 3D
        },
        "4D": {
          halfboard: "629f0a44-7a26-41cb-8561-b29200b86f94", // Walking package Half Board 4D
          breakfast: "151fe402-8ac3-4c0b-a85d-b29200b95fee", // Walking package Breakfast 4D
        },
      },
      cycling: {
        "3D": {
          halfboard: "111064ed-b2a0-4a30-8c2c-b2b80090a765", // Cycling package Half Board 3D
          breakfast: "d2235280-7807-4a75-82b1-b2b80091bf3c", // Cycling package Breakfast 3D
        },
        "4D": {
          halfboard: "07a69e53-df3a-420b-b0a8-b29200b38d28", // Cycling package Half Board 4D
          breakfast: "17c0be28-0560-4df2-97d1-b29200b8f8d3", // Cycling package Breakfast 4D
        },
      },
    },
  };


/**
 * Centralized product names so we only edit them here.
 * Keys match how we store 'selectedOptionalProducts' in code (e.g. lunch, bicycleRent, etc.).
 * You can add or rename as needed.
 */

//TO DO
export const PRODUCT_NAMES = {
  // Board types
  breakfast: "Breakfast (Package)",

  // Optional extras
  lunch: "Lunch package",
  koffernabreng: "Koffernabreng",
  bicycleRent: "Bicylce renting",           // wrong spelling on purpose
  bicycleTransport: "Bicycle transport cost",
};

/**
 * Centralized IDs (if each product has a unique ID per hotel).
 * This is used in computeOptionalProductsMapping or anywhere we push product IDs.
 */

//TO DO
export const OPTIONAL_PRODUCT_IDS: Record<
  string,
  { hotel1: string; hotel2: string; hotel3: string }
> = {
  lunch: {
    hotel1: "d78fcc90-f92a-4547-aba2-b27c0143c1ad",
    hotel2: "bf9c20d3-10d1-4e96-b42b-b27c0144c79f",
    hotel3: "96c6bc09-6ebd-4a67-9924-b27c0145acf1",
  },
  bicycleRent: {
    hotel1: "59b38a23-15a4-461d-bea6-b27c0143f0e9",
    hotel2: "ecc8e7d4-2a49-4326-a3b1-b27c0144f4bf",
    hotel3: "177ea362-600e-436b-b909-b27c01458da2",
  },
  bicycleTransport: {
    hotel1: "3dc76cb4-d72f-46b5-8cff-b27c014415ca",
    hotel2: "e1365138-e07e-4e5b-9222-b27c0145279f",
    hotel3: "91038565-d3dc-448d-9a04-b27c014559a2",
  },
  // Add more as needed...
};
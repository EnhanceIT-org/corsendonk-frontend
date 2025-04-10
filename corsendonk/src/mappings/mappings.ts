// src/mappings/mappings.ts
import * as devMappings from './mappings.dev';
import * as prodMappings from './mappings.prod';

const mappingEnv = import.meta.env.VITE_MAPPING_ENV || 'development';

// Keep this log - confirms Vite is reading the env var at build time
console.log(`[mappings.ts] Using mappings for environment: ${mappingEnv}`);

const useProductionMappings = mappingEnv === 'production';

// --- Conditional exports ---

let ageCategoryMappingExport, BoardMappingExport, PRODUCT_NAMES_EXPORT, OPTIONAL_PRODUCT_IDS_EXPORT, HOTEL_NAME_MAPPING_EXPORT;

if (useProductionMappings) {
  console.log('[mappings.ts] Exporting PRODUCTION mappings'); // <-- ADD THIS
  ageCategoryMappingExport = prodMappings.ageCategoryMapping;
  BoardMappingExport = prodMappings.BoardMapping;
  PRODUCT_NAMES_EXPORT = prodMappings.PRODUCT_NAMES;
  OPTIONAL_PRODUCT_IDS_EXPORT = prodMappings.OPTIONAL_PRODUCT_IDS;
  HOTEL_NAME_MAPPING_EXPORT = prodMappings.HOTEL_NAME_MAPPING;
} else {
  console.log('[mappings.ts] Exporting DEVELOPMENT mappings'); // <-- ADD THIS
  ageCategoryMappingExport = devMappings.ageCategoryMapping;
  BoardMappingExport = devMappings.BoardMapping;
  PRODUCT_NAMES_EXPORT = devMappings.PRODUCT_NAMES;
  OPTIONAL_PRODUCT_IDS_EXPORT = devMappings.OPTIONAL_PRODUCT_IDS;
  HOTEL_NAME_MAPPING_EXPORT = devMappings.HOTEL_NAME_MAPPING;
}

export const ageCategoryMapping = ageCategoryMappingExport;
export const BoardMapping = BoardMappingExport;
export const PRODUCT_NAMES = PRODUCT_NAMES_EXPORT;
export const OPTIONAL_PRODUCT_IDS = OPTIONAL_PRODUCT_IDS_EXPORT;
export const HOTEL_NAME_MAPPING = HOTEL_NAME_MAPPING_EXPORT;

// ADD Log the actual exported objects (optional, but helpful)
console.log('[mappings.ts] Exported BoardMapping:', JSON.stringify(BoardMapping, null, 2));
console.log('[mappings.ts] Exported PRODUCT_NAMES:', JSON.stringify(PRODUCT_NAMES, null, 2));
console.log('[mappings.ts] Exported ageCategoryMapping:', JSON.stringify(ageCategoryMapping, null, 2));
// src/mappings/mappings.ts
import * as devMappings from './mappings.dev';
import * as prodMappings from './mappings.prod';

const mappingEnv = import.meta.env.VITE_MAPPING_ENV || 'development';

// Keep this log - confirms Vite is reading the env var at build time
console.log(`[mappings.ts] Using mappings for environment: ${mappingEnv}`);

const useProductionMappings = mappingEnv === 'production';

// --- Conditional exports ---

let ageCategoryMappingExport, BoardMappingExport, optionalProductsExport, HOTEL_NAME_MAPPING_EXPORT;

if (useProductionMappings) {
  console.log('[mappings.ts] Exporting PRODUCTION mappings');
  ageCategoryMappingExport = prodMappings.ageCategoryMapping;
  BoardMappingExport = prodMappings.BoardMapping;
  optionalProductsExport = prodMappings.optionalProducts; // Export new structure
  HOTEL_NAME_MAPPING_EXPORT = prodMappings.HOTEL_NAME_MAPPING;
} else {
  console.log('[mappings.ts] Exporting DEVELOPMENT mappings');
  ageCategoryMappingExport = devMappings.ageCategoryMapping;
  BoardMappingExport = devMappings.BoardMapping;
  optionalProductsExport = devMappings.optionalProducts; // Export new structure
  HOTEL_NAME_MAPPING_EXPORT = devMappings.HOTEL_NAME_MAPPING;
}

export const ageCategoryMapping = ageCategoryMappingExport;
export const BoardMapping = BoardMappingExport;
export const optionalProducts = optionalProductsExport; // Export new structure
export const HOTEL_NAME_MAPPING = HOTEL_NAME_MAPPING_EXPORT;

// ADD Log the actual exported objects (optional, but helpful)
console.log('[mappings.ts] Exported BoardMapping:', JSON.stringify(BoardMapping, null, 2));
console.log('[mappings.ts] Exported optionalProducts:', JSON.stringify(optionalProducts, null, 2)); // Log new structure
console.log('[mappings.ts] Exported ageCategoryMapping:', JSON.stringify(ageCategoryMapping, null, 2));

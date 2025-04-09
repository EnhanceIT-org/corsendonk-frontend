// src/mappings/mappings.ts
import * as devMappings from './mappings.dev';
import * as prodMappings from './mappings.prod';

// Read the specific mapping variable, default to 'development' if not set
// Vite automatically exposes vars prefixed with VITE_
const mappingEnv = import.meta.env.VITE_MAPPING_ENV || 'development';

console.log(`Using mappings for environment: ${mappingEnv}`); // Add for debugging

const useProductionMappings = mappingEnv === 'production';

// --- Conditional exports ---
export const ageCategoryMapping = useProductionMappings
  ? prodMappings.ageCategoryMapping
  : devMappings.ageCategoryMapping;

export const BoardMapping = useProductionMappings
  ? prodMappings.BoardMapping
  : devMappings.BoardMapping;

export const PRODUCT_NAMES = useProductionMappings
  ? prodMappings.PRODUCT_NAMES
  : devMappings.PRODUCT_NAMES;

export const OPTIONAL_PRODUCT_IDS = useProductionMappings
  ? prodMappings.OPTIONAL_PRODUCT_IDS
  : devMappings.OPTIONAL_PRODUCT_IDS;
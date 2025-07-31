// src/mappings/mappings.ts
import * as devMappings from "./mappings.dev";
import * as prodMappings from "./mappings.prod";

const mappingEnv = import.meta.env.VITE_MAPPING_ENV || "development";

const useProductionMappings = mappingEnv === "production";

let ageCategoryMappingExport,
  BoardMappingExport,
  optionalProductsExport,
  HOTEL_NAME_MAPPING_EXPORT;

if (useProductionMappings) {
  ageCategoryMappingExport = prodMappings.ageCategoryMapping;
  BoardMappingExport = prodMappings.BoardMapping;
  optionalProductsExport = prodMappings.optionalProducts;
  HOTEL_NAME_MAPPING_EXPORT = prodMappings.HOTEL_NAME_MAPPING;
} else {
  ageCategoryMappingExport = devMappings.ageCategoryMapping;
  BoardMappingExport = devMappings.BoardMapping;
  optionalProductsExport = devMappings.optionalProducts;
  HOTEL_NAME_MAPPING_EXPORT = devMappings.HOTEL_NAME_MAPPING;
}

export const ageCategoryMapping = ageCategoryMappingExport;
export const BoardMapping = BoardMappingExport;
export const optionalProducts = optionalProductsExport;
export const HOTEL_NAME_MAPPING = HOTEL_NAME_MAPPING_EXPORT;

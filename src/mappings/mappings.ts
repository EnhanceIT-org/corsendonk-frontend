// src/mappings/mappings.ts
import * as devMappings from "./mappings.dev";
import * as prodMappings from "./mappings.prod";

const mappingEnv = import.meta.env.VITE_MAPPING_ENV || "development";

const useProductionMappings = mappingEnv === "production";

let ageCategoryMappingExport,
  BoardMappingExport,
  HOTEL_NAME_MAPPING_EXPORT,
  lunchAdjustmentForChildExport;

if (useProductionMappings) {
  ageCategoryMappingExport = prodMappings.ageCategoryMapping;
  BoardMappingExport = prodMappings.BoardMapping;
  HOTEL_NAME_MAPPING_EXPORT = prodMappings.HOTEL_NAME_MAPPING;
  lunchAdjustmentForChildExport = prodMappings.lunchAdjustmentForChild; 
} else {
  ageCategoryMappingExport = devMappings.ageCategoryMapping;
  BoardMappingExport = devMappings.BoardMapping;
  HOTEL_NAME_MAPPING_EXPORT = devMappings.HOTEL_NAME_MAPPING;
  lunchAdjustmentForChildExport = devMappings.lunchAdjustmentForChild; 
}

export const ageCategoryMapping = ageCategoryMappingExport;
export const BoardMapping = BoardMappingExport;
export const HOTEL_NAME_MAPPING = HOTEL_NAME_MAPPING_EXPORT;
export const lunchAdjustmentForChild = lunchAdjustmentForChildExport;
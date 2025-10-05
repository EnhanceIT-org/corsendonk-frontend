// src/mappings/mappings.ts
import * as devMappings from "./mappings.dev";
import * as prodMappings from "./mappings.prod";

const mappingEnv = import.meta.env.VITE_MAPPING_ENV || "development";

const useProductionMappings = mappingEnv === "production";

let ageCategoryMappingExport,
  BoardMappingExport,
  HOTEL_NAME_MAPPING_EXPORT,
  lunchAdjustmentForChildExport,
  lunchAdjustmentForChild3_5Export;

if (useProductionMappings) {
  ageCategoryMappingExport = prodMappings.ageCategoryMapping;
  BoardMappingExport = prodMappings.BoardMapping;
  HOTEL_NAME_MAPPING_EXPORT = prodMappings.HOTEL_NAME_MAPPING;
  lunchAdjustmentForChildExport = prodMappings.lunchAdjustmentForChild6_12;
  lunchAdjustmentForChild3_5Export = prodMappings.lunchAdjustmentForChild3_5;
} else {
  ageCategoryMappingExport = devMappings.ageCategoryMapping;
  BoardMappingExport = devMappings.BoardMapping;
  HOTEL_NAME_MAPPING_EXPORT = devMappings.HOTEL_NAME_MAPPING;
  lunchAdjustmentForChildExport = devMappings.lunchAdjustmentForChild6_12;
  lunchAdjustmentForChild3_5Export = devMappings.lunchAdjustmentForChild3_5;
}

export const ageCategoryMapping = ageCategoryMappingExport;
export const BoardMapping = BoardMappingExport;
export const HOTEL_NAME_MAPPING = HOTEL_NAME_MAPPING_EXPORT;
export const lunchAdjustmentForChild6_12 = lunchAdjustmentForChildExport;
export const lunchAdjustmentForChild3_5 = lunchAdjustmentForChild3_5Export;

export interface BaseDataPoint {
  REF_AREA_CODE: string;
  REF_AREA_NAME: string;
  TIME_PERIOD: number;
  OBS_STATUS_CODE: string;
  OBS_STATUS_NAME: string;
}

export interface NutrientBalanceData extends BaseDataPoint {
  OBS_VALUE_UNIT_KG: string;
}

export interface WaterUseData extends BaseDataPoint {
  WATER_TYPE_CODE: string;
  WATER_TYPE_NAME: string;
  OBS_VALUE_MIL_M3: string;
}

export interface EnergyUseData extends BaseDataPoint {
  OBS_VALUE_THOUSANDS: string;
}

export interface AgriculturalLandData extends BaseDataPoint {
  OBS_VALUE_THOUSAND_H2: string;
}

export type DatasetType = 'nutrient' | 'water' | 'energy' | 'agricultural';

export interface ProcessedDataPoint {
  country: string;
  countryCode: string;
  year: number;
  value: number;
  status: string;
}

export interface DatasetInfo {
  name: string;
  unit: string;
  description: string;
  color: string;
  icon: string;
  valueKey: string;
}

export const DATASET_CONFIG: Record<DatasetType, DatasetInfo> = {
  nutrient: {
    name: 'Nutrient Balance',
    unit: 'kg/ha',
    description: 'Agricultural nutrient balance per hectare',
    color: 'hsl(var(--forest-green))',
    icon: '🌱',
    valueKey: 'OBS_VALUE_UNIT_KG'
  },
  water: {
    name: 'Water Use',
    unit: 'Million m³',
    description: 'Total water consumption',
    color: 'hsl(var(--water-blue))',
    icon: '💧',
    valueKey: 'OBS_VALUE_MIL_M3'
  },
  energy: {
    name: 'Energy Use',
    unit: 'Thousands',
    description: 'Energy consumption in agriculture',
    color: 'hsl(var(--energy-orange))',
    icon: '⚡',
    valueKey: 'OBS_VALUE_THOUSANDS'
  },
  agricultural: {
    name: 'Agricultural Land',
    unit: 'Thousand hectares',
    description: 'Total agricultural land area',
    color: 'hsl(var(--golden-wheat))',
    icon: '🌾',
    valueKey: 'OBS_VALUE_THOUSAND_H2'
  }
};
import { 
  NutrientBalanceData, 
  WaterUseData, 
  EnergyUseData, 
  AgriculturalLandData, 
  ProcessedDataPoint, 
  DatasetType,
  DATASET_CONFIG 
} from '@/types/data';

// Parse numeric value from string, removing commas
export const parseNumericValue = (value: string): number => {
  return parseFloat(value.replace(/,/g, ''));
};

// Process any dataset type into unified format
export const processDataset = (
  data: (NutrientBalanceData | WaterUseData | EnergyUseData | AgriculturalLandData)[],
  datasetType: DatasetType
): ProcessedDataPoint[] => {
  const config = DATASET_CONFIG[datasetType];
  
  return data.map(item => ({
    country: item.REF_AREA_NAME,
    countryCode: item.REF_AREA_CODE,
    year: item.TIME_PERIOD,
    value: parseNumericValue((item as any)[config.valueKey]),
    status: item.OBS_STATUS_NAME
  }));
};

// Get unique years from dataset
export const getUniqueYears = (data: ProcessedDataPoint[]): number[] => {
  const years = [...new Set(data.map(d => d.year))];
  return years.sort((a, b) => a - b);
};

// Get unique countries from dataset
export const getUniqueCountries = (data: ProcessedDataPoint[]): { code: string; name: string }[] => {
  const countries = [...new Map(
    data.map(d => [d.countryCode, { code: d.countryCode, name: d.country }])
  ).values()];
  return countries.sort((a, b) => a.name.localeCompare(b.name));
};

// Filter data by year and country
export const filterData = (
  data: ProcessedDataPoint[],
  selectedYear?: number,
  selectedCountry?: string
): ProcessedDataPoint[] => {
  return data.filter(item => {
    const yearMatch = !selectedYear || item.year === selectedYear;
    const countryMatch = !selectedCountry || selectedCountry === 'all' || item.countryCode === selectedCountry;
    return yearMatch && countryMatch;
  });
};

// Get aggregate statistics
export const getDataStats = (data: ProcessedDataPoint[]) => {
  if (data.length === 0) return null;
  
  const values = data.map(d => d.value);
  const total = values.reduce((sum, val) => sum + val, 0);
  const avg = total / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  return {
    total: Math.round(total * 100) / 100,
    average: Math.round(avg * 100) / 100,
    maximum: max,
    minimum: min,
    count: data.length
  };
};

// Format number with commas and proper decimal places
export const formatValue = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Get color intensity for choropleth mapping
export const getColorIntensity = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};
import { 
  NutrientBalanceData, 
  WaterUseData, 
  EnergyUseData, 
  AgriculturalLandData, 
  ProcessedDataPoint, 
  DatasetType,
  DATASET_CONFIG 
} from '@/types/data';

// Parse numeric value from string or number, removing commas if string
export const parseNumericValue = (value: string | number): number => {
  if (typeof value === 'number') return value;
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
    data
      .filter(d => d.country && d.countryCode) // Filter out entries with missing data
      .map(d => [d.countryCode, { code: d.countryCode, name: d.country }])
  ).values()];
  
  return countries
    .filter(country => country && country.name) // Additional safety check
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

// Filter data by year and country
export const filterData = (
  data: ProcessedDataPoint[],
  selectedYear?: number,
  selectedCountry?: string
): ProcessedDataPoint[] => {
  if (!data || data.length === 0) return [];
  
  return data.filter(item => {
    // For "All Years" view, don't filter by year
    const yearMatch = !selectedYear || item.year === selectedYear;
    // For "All Countries" view, don't filter by country
    const countryMatch = !selectedCountry || selectedCountry === 'all' || item.countryCode === selectedCountry;
    return yearMatch && countryMatch && item.value != null;
  });
};

// Get aggregate statistics
export const getDataStats = (data: ProcessedDataPoint[]) => {
  if (!data || data.length === 0) return null;
  
  const validValues = data
    .map(d => d.value)
    .filter(val => val !== null && val !== undefined && !isNaN(val));
  
  if (validValues.length === 0) return null;
  
  const total = validValues.reduce((sum, val) => sum + val, 0);
  const avg = total / validValues.length;
  const max = Math.max(...validValues);
  const min = Math.min(...validValues);
  
  return {
    total: Number(total.toFixed(2)),
    average: Number(avg.toFixed(2)),
    maximum: Number(max.toFixed(2)),
    minimum: Number(min.toFixed(2)),
    count: validValues.length
  };
};

// Format number with commas and proper decimal places
export const formatValue = (value: number | undefined, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
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
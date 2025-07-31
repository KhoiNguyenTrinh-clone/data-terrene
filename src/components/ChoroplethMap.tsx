import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedDataPoint, DatasetType, DATASET_CONFIG } from '@/types/data';
import { NoDataPlaceholder } from './NoDataPlaceholder';

interface ChoroplethMapProps {
  data: ProcessedDataPoint[];
  activeDataset: DatasetType;
  selectedYear?: number;
}

export const ChoroplethMap = ({ data, activeDataset, selectedYear }: ChoroplethMapProps) => {
  // Filter data for the selected year (or all years if none selected)
  const filteredData = selectedYear 
    ? data.filter(d => d.year === selectedYear)
    : data;

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Global Distribution Map
            {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoDataPlaceholder 
            message="No data available for selected filters"
            icon="🗺️"
            height="h-80"
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate value ranges for color intensity
  const values = filteredData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const config = DATASET_CONFIG[activeDataset];

  // Group by country and calculate average/latest value
  const countryData = filteredData.reduce((acc, item) => {
    if (!acc[item.countryCode]) {
      acc[item.countryCode] = {
        name: item.country,
        code: item.countryCode,
        values: []
      };
    }
    acc[item.countryCode].values.push(item.value);
    return acc;
  }, {} as Record<string, { name: string; code: string; values: number[] }>);

  // Calculate representative value for each country (average)
  const processedCountries = Object.entries(countryData).map(([code, data]) => {
    const avgValue = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
    const intensity = (avgValue - minValue) / (maxValue - minValue);
    return {
      code,
      name: data.name,
      value: avgValue,
      intensity: isNaN(intensity) ? 0 : intensity
    };
  });

  // Sort by value for legend display
  processedCountries.sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Global Distribution Map
          {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg border border-border overflow-hidden">
          {/* Simulated World Map with Country Blocks */}
          <div className="absolute inset-4 grid grid-cols-8 grid-rows-6 gap-1">
            {Array.from({ length: 48 }, (_, i) => {
              const country = processedCountries[i % processedCountries.length];
              if (!country) return null;
              
              const opacity = 0.3 + (country.intensity * 0.7);
              
              return (
                <div
                  key={i}
                  className="rounded-sm border border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer relative group"
                  style={{
                    backgroundColor: config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))'),
                    opacity: opacity
                  }}
                  title={`${country.name}: ${country.value.toFixed(2)} ${config.unit}`}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    {country.name}: {country.value.toFixed(2)} {config.unit}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-xs font-medium mb-2">{config.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <span>Low</span>
              <div className="w-16 h-2 rounded" style={{
                background: `linear-gradient(to right, ${config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))')} / 0.3, ${config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))')})`
              }}></div>
              <span>High</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Range: {minValue.toFixed(1)} - {maxValue.toFixed(1)} {config.unit}
            </div>
          </div>

          {/* Dataset indicator */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{config.icon}</span>
              <div>
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
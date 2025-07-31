import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedDataPoint, DatasetType, DATASET_CONFIG } from '@/types/data';
import { NoDataPlaceholder } from './NoDataPlaceholder';

interface HeatTreeMapProps {
  data: ProcessedDataPoint[];
  activeDataset: DatasetType;
  selectedYear?: number;
}

export const HeatTreeMap = ({ data, activeDataset, selectedYear }: HeatTreeMapProps) => {
  // Filter data for the selected year (or all years if none selected)
  const filteredData = selectedYear 
    ? data.filter(d => d.year === selectedYear)
    : data;

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Global Heat Map
            {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoDataPlaceholder 
            message="No data available for current filter selection"
            icon="🗺️"
            height="h-80"
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate value ranges for heat intensity
  const values = filteredData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const config = DATASET_CONFIG[activeDataset];

  // Group by country and calculate representative value
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

  // Calculate representative value for each country and create heat map data
  const heatMapData = Object.entries(countryData).map(([code, data]) => {
    const avgValue = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
    const intensity = (avgValue - minValue) / (maxValue - minValue);
    return {
      code,
      name: data.name,
      value: avgValue,
      intensity: isNaN(intensity) ? 0 : intensity,
      size: Math.max(20, intensity * 100) // For tree map sizing
    };
  });

  // Sort by value for consistent positioning
  heatMapData.sort((a, b) => b.value - a.value);

  // Create tree map layout (simplified grid-based approach)
  const getTreeMapLayout = () => {
    const totalArea = 300 * 200; // Container dimensions
    const totalValue = heatMapData.reduce((sum, item) => sum + item.size, 0);
    
    return heatMapData.slice(0, 12).map((item, index) => {
      const proportion = item.size / totalValue;
      const area = totalArea * proportion * 12; // Amplify for visibility
      const width = Math.sqrt(area * 1.5); // Rectangle ratio
      const height = area / width;
      
      // Simple grid positioning
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = col * 75;
      const y = row * 65;
      
      return {
        ...item,
        x,
        y,
        width: Math.max(width, 40),
        height: Math.max(height, 25)
      };
    });
  };

  const treeMapLayout = getTreeMapLayout();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Global Heat & Tree Map
          {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Heat Map Grid */}
          <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-border overflow-hidden">
            <div className="absolute inset-4 grid grid-cols-8 grid-rows-4 gap-1">
              {Array.from({ length: 32 }, (_, i) => {
                const country = heatMapData[i % heatMapData.length];
                if (!country) return null;
                
                const opacity = 0.2 + (country.intensity * 0.8);
                
                return (
                  <div
                    key={i}
                    className="rounded transition-all duration-300 hover:scale-110 cursor-pointer relative group border border-white/20"
                    style={{
                      backgroundColor: config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))'),
                      opacity: opacity
                    }}
                    title={`${country.name}: ${country.value.toFixed(2)} ${config.unit}`}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                      {country.name}: {country.value.toFixed(1)} {config.unit}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Heat Map Legend */}
            <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded p-2 border border-border">
              <div className="text-xs font-medium mb-1">Intensity</div>
              <div className="flex items-center gap-1 text-xs">
                <span>Low</span>
                <div className="w-12 h-2 rounded" style={{
                  background: `linear-gradient(to right, ${config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))')} / 0.2, ${config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))')})`
                }}></div>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Tree Map */}
          <div className="relative h-48 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-border overflow-hidden">
            <svg width="100%" height="100%" className="absolute inset-0">
              {treeMapLayout.map((item, index) => (
                <g key={item.code}>
                  <rect
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    fill={config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))')}
                    opacity={0.3 + (item.intensity * 0.7)}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                  />
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-current"
                    style={{ fontSize: Math.min(item.width / 8, 10) }}
                  >
                    {item.name.slice(0, 8)}
                  </text>
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-current opacity-70"
                    style={{ fontSize: Math.min(item.width / 12, 8) }}
                  >
                    {item.value.toFixed(0)}
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Tree Map Legend */}
            <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded p-2 border border-border">
              <div className="text-xs font-medium">{config.name}</div>
              <div className="text-xs text-muted-foreground">Size = Value</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, AreaChart, Area, ReferenceLine } from 'recharts';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { filterData, formatValue } from '@/utils/dataUtils';
import { ChoroplethMap } from './ChoroplethMap';
import { NoDataPlaceholder } from './NoDataPlaceholder';

interface GeneralChartsProps {
  data: Record<DatasetType, ProcessedDataPoint[]>;
  selectedYear?: number;
  selectedCountry: string;
  activeDataset: DatasetType;
}

export const GeneralCharts = ({ data, selectedYear, selectedCountry, activeDataset }: GeneralChartsProps) => {
  // Prepare time series data
  const getTimeSeriesData = () => {
    const allYears = [...new Set(Object.values(data).flat().map(d => d.year))].sort();
    
    return allYears.map(year => {
      const yearData: any = { year };
      Object.entries(data).forEach(([datasetType, datasetData]) => {
        const yearlyData = datasetData.filter(d => d.year === year);
        const total = yearlyData.reduce((sum, d) => sum + d.value, 0);
        yearData[datasetType] = total;
      });
      return yearData;
    });
  };

  // Prepare country comparison data - Top 5 countries for active dataset
  const getCountryComparisonData = () => {
    if (!selectedYear) return [];
    
    const activeData = data[activeDataset];
    const countryTotals = activeData
      .filter(d => d.year === selectedYear)
      .reduce((acc, d) => {
        acc[d.country] = (acc[d.country] || 0) + d.value;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(countryTotals)
      .map(([country, value]) => ({ country, [activeDataset]: value }))
      .sort((a, b) => (b[activeDataset] as number) - (a[activeDataset] as number))
      .slice(0, 5); // Top 5 countries only
  };

  // Prepare scatter data
  const getScatterData = () => {
    const filteredData = filterData(
      Object.values(data).flat(),
      selectedYear,
      selectedCountry
    );
    
    return filteredData.map(d => ({
      x: d.year,
      y: d.value,
      z: d.value,
      country: d.country
    }));
  };

  const timeSeriesData = getTimeSeriesData();
  const countryData = getCountryComparisonData();
  const scatterData = getScatterData();
  
  // Get unique years for multi-year check
  const uniqueYears = [...new Set(Object.values(data).flat().map(d => d.year))];
  const hasMultipleYears = uniqueYears.length > 1;
  
  // Check if we have data for charts
  const hasCountryData = countryData.length > 0;
  const hasScatterData = scatterData.length > 0;
  
  // Get active dataset data for choropleth
  const activeDatasetData = data[activeDataset] || [];
  
  // Check for negative values in active dataset for scatter chart axis adjustment
  const hasNegativeValues = activeDatasetData.some(d => d.value < 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Special handling for scatter plot
      if (payload[0]?.payload?.country) {
        const data = payload[0].payload;
        return (
          <div className="rounded-lg shadow-md bg-white/90 backdrop-blur-sm p-3 text-sm border border-border">
            <p className="font-medium">{data.country}</p>
            <p>Year: {data.x}</p>
            <p style={{ color: DATASET_CONFIG[activeDataset].color }}>
              Value: {formatValue(data.y)} {DATASET_CONFIG[activeDataset].unit}
            </p>
          </div>
        );
      }

      // Default tooltip for other charts
      return (
        <div className="rounded-lg shadow-md bg-white/90 backdrop-blur-sm p-3 text-sm border border-border">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${formatValue(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Choropleth Map */}
      <ChoroplethMap 
        data={activeDatasetData}
        activeDataset={activeDataset}
        selectedYear={selectedYear}
      />

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Multi-Year Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMultipleYears || !selectedYear ? (
            <NoDataPlaceholder 
              message="Multi-year comparison unavailable - select a different year filter or ensure multiple years exist"
              icon="📈"
              height="h-72"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(DATASET_CONFIG).map(([key, config]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={3}
                    dot={{ fill: config.color, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: config.color, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Scatter Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Value Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasScatterData ? (
            <NoDataPlaceholder 
              message="No data points available for current selection"
              icon="🎯"
              height="h-72"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="y" stroke="hsl(var(--muted-foreground))" />
                {hasNegativeValues && (
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Scatter dataKey="y" fill={DATASET_CONFIG[activeDataset].color} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Country Comparison Bar Chart - Top 5 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Top Countries
            {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasCountryData || !selectedYear ? (
            <NoDataPlaceholder 
              message="Top countries unavailable - select a year to compare countries"
              icon="🏆"
              height="h-72"
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="country" 
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg shadow-md bg-white/90 backdrop-blur-sm p-3 text-sm border border-border">
                          <p className="font-medium">{data.country}</p>
                          <p style={{ color: payload[0].color }}>
                            Value: {formatValue(data[activeDataset])} {DATASET_CONFIG[activeDataset].unit}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey={activeDataset} 
                  fill={DATASET_CONFIG[activeDataset].color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Stacked Area Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Cumulative Resource Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length === 0 ? (
            <NoDataPlaceholder 
              message="No cumulative data available for current selection"
              icon="📊"
              height="h-80"
            />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(DATASET_CONFIG).map(([key, config]) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={config.color}
                    fill={config.color}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
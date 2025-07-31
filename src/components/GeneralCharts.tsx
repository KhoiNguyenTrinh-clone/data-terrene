import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, AreaChart, Area } from 'recharts';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { filterData, formatValue } from '@/utils/dataUtils';

interface GeneralChartsProps {
  data: Record<DatasetType, ProcessedDataPoint[]>;
  selectedYear?: number;
  selectedCountry: string;
}

export const GeneralCharts = ({ data, selectedYear, selectedCountry }: GeneralChartsProps) => {
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

  // Prepare country comparison data
  const getCountryComparisonData = () => {
    if (!selectedYear) return [];
    
    const countries = [...new Set(Object.values(data).flat().map(d => d.country))];
    
    return countries.map(country => {
      const countryData: any = { country };
      Object.entries(data).forEach(([datasetType, datasetData]) => {
        const filtered = datasetData.filter(d => d.year === selectedYear && d.country === country);
        const total = filtered.reduce((sum, d) => sum + d.value, 0);
        countryData[datasetType] = total;
      });
      return countryData;
    }).filter(d => Object.values(d).some(v => typeof v === 'number' && v > 0));
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
      {/* Time Series Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Time Series Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
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
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="y" stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="y" fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Country Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌍 Country Comparison
            {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="country" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(DATASET_CONFIG).map(([key, config]) => (
                <Bar key={key} dataKey={key} fill={config.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
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
        </CardContent>
      </Card>
    </div>
  );
};
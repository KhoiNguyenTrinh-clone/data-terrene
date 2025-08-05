import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { filterData, formatValue, getDataStats } from '@/utils/dataUtils';

interface HighlightedInsightsProps {
  activeDataset: DatasetType;
  data: ProcessedDataPoint[];
  selectedYear?: number;
  selectedCountry: string;
}

export const HighlightedInsights = ({
  activeDataset,
  data,
  selectedYear,
  selectedCountry
}: HighlightedInsightsProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = DATASET_CONFIG[activeDataset];
  
  // Trigger animation when dataset changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [activeDataset]);

  const filteredData = filterData(data, selectedYear, selectedCountry);
  const stats = getDataStats(filteredData);

  // Prepare pie chart data
  const getPieData = () => {
    const countryTotals = filteredData.reduce((acc, item) => {
      acc[item.country] = (acc[item.country] || 0) + item.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryTotals)
      .map(([country, value]) => ({ name: country, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 countries
  };

  // Prepare radar chart data for country comparison
  const getRadarData = () => {
    const countries = [...new Set(filteredData.map(d => d.country))].slice(0, 3);
    const years = [...new Set(filteredData.map(d => d.year))].sort();
    
    return years.map(year => {
      const yearData: any = { year };
      countries.forEach(country => {
        const countryData = filteredData.filter(d => d.country === country && d.year === year);
        const total = countryData.reduce((sum, d) => sum + d.value, 0);
        yearData[country] = total;
      });
      return yearData;
    });
  };

  const pieData = getPieData();
  const radarData = getRadarData();
  const colors = ['hsl(var(--primary))', 'hsl(var(--forest))', 'hsl(var(--water))', 'hsl(var(--energy))', 'hsl(var(--wheat))'];

  const getInsightText = () => {
    if (!stats) return "No data available for the current selection.";
    
    const topCountry = pieData[0]?.name;
    const topValue = pieData[0]?.value;
    
    if (activeDataset === 'nutrient') {
      return `Nutrient balance analysis reveals ${topCountry} leads with ${formatValue(topValue)} kg/ha. This indicates the country's agricultural efficiency in nutrient management, with an average balance of ${formatValue(stats.average)} kg/ha across all regions.`;
    }
    
    // Generic template for other datasets
    return `${config.name} analysis shows ${topCountry} has the highest consumption at ${formatValue(topValue)} ${config.unit}. The average across all regions is ${formatValue(stats.average)} ${config.unit}, with significant variation indicating different resource management strategies.`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // For Pie Chart
      if (payload[0].payload.name) {
        const data = payload[0].payload;
        return (
          <div className="rounded-lg shadow-md bg-white/90 backdrop-blur-sm p-3 text-sm border border-border">
            <p className="font-medium">{data.name}</p>
            <p style={{ color: payload[0].color }}>
              {formatValue(data.value)} {config.unit}
            </p>
          </div>
        );
      }
      // For Radar Chart
      return (
        <div className="rounded-lg shadow-md bg-white/90 backdrop-blur-sm p-3 text-sm border border-border">
          <p className="font-medium">Year: {payload[0].payload.year}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {entry.dataKey}: {formatValue(entry.value)} {config.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section 
      id="highlighted-insights"
      className={`space-y-8 transition-all duration-500 ${
        isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Key Insights: {config.name}
        </h2>
        <p className="text-muted-foreground mt-2">
          Highlighted visualizations and analysis for {config.name.toLowerCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D Donut Chart */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              Top Countries Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index] }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatValue(entry.value)} {config.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📡 Multi-Year Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="year" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                {radarData.length > 0 && Object.keys(radarData[0])
                  .filter(key => key !== 'year')
                  .map((country, index) => (
                    <Radar
                      key={country}
                      name={country}
                      dataKey={country}
                      stroke={colors[index]}
                      fill={colors[index]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insight Text Panel */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{config.icon}</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Analysis Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                {getInsightText()}
              </p>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatValue(stats.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="font-semibold">{formatValue(stats.average)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maximum</p>
                    <p className="font-semibold">{formatValue(stats.maximum)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum</p>
                    <p className="font-semibold">{formatValue(stats.minimum)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
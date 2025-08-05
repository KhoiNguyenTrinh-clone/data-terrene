import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { filterData, formatValue, getDataStats } from '@/utils/dataUtils';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";

interface DetailedVisualizationProps {
  datasetType?: DatasetType;
  data?: ProcessedDataPoint[];
  selectedYear?: number;
  selectedCountry?: string;
  isActive?: boolean;
}

export const DetailedVisualization = (props: DetailedVisualizationProps) => {
  // Log the raw props to diagnose the issue
  console.log('Raw props:', props);

  // Default values if props are undefined
  const {
    datasetType = 'nutrient',
    data = [],
    selectedYear,
    selectedCountry = 'all',
    isActive = false
  } = props || {};

  const config = DATASET_CONFIG[datasetType] || DATASET_CONFIG['nutrient'];
  const filteredData = filterData(data, selectedYear, selectedCountry);
  const stats = getDataStats(filteredData);

  // Prepare time series data for this specific dataset
  const getTimeSeriesData = () => {
    const years = [...new Set(data.map(d => d.year))].sort();
    
    return years.map(year => {
      const yearData = data.filter(d => d.year === year);
      const countries = [...new Set(yearData.map(d => d.country))];
      
      const result: any = { year };
      countries.forEach(country => {
        const countryData = yearData.filter(d => d.country === country);
        const total = countryData.reduce((sum, d) => sum + d.value, 0);
        result[country] = total;
      });
      
      return result;
    });
  };

  // Get energy gauge percentage (for energy dataset)
  const getEnergyGaugePercentage = () => {
    if (datasetType !== 'energy' || !stats) return 0;
    const maxPossible = stats.maximum * 1.2;
    return Math.min((stats.total / maxPossible) * 100, 100);
  };

  const timeSeriesData = getTimeSeriesData();
  const energyPercentage = getEnergyGaugePercentage();

  return (
    <section
      id={`${datasetType}-section`}
      className={`space-y-6 transition-all duration-500 ${
        isActive ? 'opacity-100' : 'opacity-70'
      }`}
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <span className="text-3xl">{config.icon}</span>
          {config.name} - Detailed Analysis
        </h2>
        <p className="text-muted-foreground mt-2">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Multi-Country Time Series */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Multi-Country Time Series</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                {timeSeriesData.length > 0 && Object.keys(timeSeriesData[0])
                  .filter(key => key !== 'year')
                  .slice(0, 3)
                  .map((country, index) => (
                    <Line
                      key={country}
                      type="monotone"
                      dataKey={country}
                      stroke={`hsl(${120 + index * 60}, 60%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Energy Gauge (only for energy dataset) */}
        {datasetType === 'energy' && (
          <Card>
            <CardHeader>
              <CardTitle>Energy Usage Gauge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-energy">
                  {energyPercentage.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">of maximum capacity</p>
              </div>
              <Progress value={energyPercentage} className="h-3" />
              {stats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Total:</span>
                    <span className="font-medium">{formatValue(stats.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Usage:</span>
                    <span className="font-medium">{formatValue(stats.maximum)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {formatValue(stats.total, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-3 bg-forest/5 rounded-lg">
                    <div className="text-2xl font-bold text-forest">
                      {formatValue(stats.average)}
                    </div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-energy/5 rounded-lg">
                    <div className="text-2xl font-bold text-energy">
                      {formatValue(stats.maximum)}
                    </div>
                    <div className="text-xs text-muted-foreground">Maximum</div>
                  </div>
                  <div className="text-center p-3 bg-water/5 rounded-lg">
                    <div className="text-2xl font-bold text-water">
                      {formatValue(stats.minimum)}
                    </div>
                    <div className="text-xs text-muted-foreground">Minimum</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">
                    {stats.count}
                  </div>
                  <div className="text-xs text-muted-foreground">Data Points</div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                No data available for current filters
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-2 text-xs border border-border">
      <p className="font-medium">Year: {label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.stroke || entry.color }}>
          {entry.name}: {formatValue(entry.value)} {DATASET_CONFIG[entry.dataKey]?.unit || ''}
        </p>
      ))}
    </div>
  );
};
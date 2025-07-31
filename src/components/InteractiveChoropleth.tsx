import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedDataPoint, DatasetType, DATASET_CONFIG } from '@/types/data';
import { NoDataPlaceholder } from './NoDataPlaceholder';
import { useState, useRef, useEffect } from 'react';

interface InteractiveChoroplethProps {
  data: ProcessedDataPoint[];
  activeDataset: DatasetType;
  selectedYear?: number;
  selectedCountry?: string;
}

export const InteractiveChoropleth = ({ 
  data, 
  activeDataset, 
  selectedYear, 
  selectedCountry 
}: InteractiveChoroplethProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter data for the selected year
  const filteredData = selectedYear 
    ? data.filter(d => d.year === selectedYear)
    : data;

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌍 Interactive Choropleth Map
            {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoDataPlaceholder 
            message="No data available for current filter selection"
            icon="🌍"
            height="h-96"
          />
        </CardContent>
      </Card>
    );
  }

  const config = DATASET_CONFIG[activeDataset];
  const values = filteredData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Group by country
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

  // Process countries with intensity values
  const processedCountries = Object.entries(countryData).map(([code, data]) => {
    const avgValue = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
    const intensity = (avgValue - minValue) / (maxValue - minValue);
    return {
      code,
      name: data.name,
      value: avgValue,
      intensity: isNaN(intensity) ? 0 : intensity,
      isSelected: selectedCountry && selectedCountry !== 'all' ? data.name === selectedCountry : false
    };
  });

  // Handle zoom to selected country
  useEffect(() => {
    if (selectedCountry && selectedCountry !== 'all') {
      const countryIndex = processedCountries.findIndex(c => c.name === selectedCountry);
      if (countryIndex !== -1) {
        // Calculate position for smooth animation to country
        const targetX = -(countryIndex % 8) * 40 + 100;
        const targetY = -Math.floor(countryIndex / 8) * 40 + 100;
        setTransform({ x: targetX, y: targetY, scale: 2 });
      }
    } else {
      // Reset to default view
      setTransform({ x: 0, y: 0, scale: 1 });
    }
  }, [selectedCountry, processedCountries]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain movement
    const maxOffset = 100;
    const constrainedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
    const constrainedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
    
    setTransform(prev => ({ ...prev, x: constrainedX, y: constrainedY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, transform.scale * delta));
    setTransform(prev => ({ ...prev, scale: newScale }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌍 Interactive Choropleth Map
          {selectedYear && <span className="text-sm text-muted-foreground">({selectedYear})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Interactive Map Container */}
          <div 
            ref={mapRef}
            className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Map Grid */}
            <div 
              className="absolute inset-4 grid grid-cols-8 grid-rows-6 gap-1 transition-transform duration-300 ease-out"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
              }}
            >
              {Array.from({ length: 48 }, (_, i) => {
                const country = processedCountries[i % processedCountries.length];
                if (!country) return null;
                
                const opacity = 0.3 + (country.intensity * 0.7);
                const isHighlighted = country.isSelected;
                
                return (
                  <div
                    key={i}
                    className={`rounded-sm border transition-all duration-300 hover:scale-105 cursor-pointer relative group ${
                      isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-white/20'
                    }`}
                    style={{
                      backgroundColor: config.color.replace('hsl(var(--', 'hsl(var(--').replace('))', '))'),
                      opacity: isHighlighted ? 1 : opacity,
                      transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title={`${country.name}: ${country.value.toFixed(2)} ${config.unit}`}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                      {country.name}: {country.value.toFixed(2)} {config.unit}
                    </div>
                    
                    {/* Selection indicator */}
                    {isHighlighted && (
                      <div className="absolute inset-0 border-2 border-primary rounded-sm animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button 
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                className="w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded border border-border flex items-center justify-center text-sm font-bold hover:bg-white dark:hover:bg-black transition-colors"
              >
                +
              </button>
              <button 
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }))}
                className="w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded border border-border flex items-center justify-center text-sm font-bold hover:bg-white dark:hover:bg-black transition-colors"
              >
                −
              </button>
              <button 
                onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
                className="w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded border border-border flex items-center justify-center text-xs hover:bg-white dark:hover:bg-black transition-colors"
              >
                ⌂
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-border">
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

            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-border">
              <div className="text-xs text-muted-foreground">
                Drag to pan • Scroll to zoom
                {selectedCountry && selectedCountry !== 'all' && (
                  <div className="text-primary font-medium">Focused on: {selectedCountry}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
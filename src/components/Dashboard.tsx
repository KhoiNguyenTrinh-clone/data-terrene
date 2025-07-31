import { useState, useEffect } from 'react';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { processDataset, getUniqueYears, getUniqueCountries } from '@/utils/dataUtils';
import { DashboardHeader } from './DashboardHeader';
import { DatasetCards } from './DatasetCards';
import { GeneralCharts } from './GeneralCharts';
import { HighlightedInsights } from './HighlightedInsights';
import { DetailedVisualization } from './DetailedVisualization';

// Import JSON data
import nutrientData from '@/data/nutrient_balance.json';
import waterData from '@/data/water_use.json';
import energyData from '@/data/energy_use.json';
import agriculturalData from '@/data/agricultural_land.json';

export const Dashboard = () => {
  const [activeDataset, setActiveDataset] = useState<DatasetType>('nutrient');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  
  const [processedData, setProcessedData] = useState<Record<DatasetType, ProcessedDataPoint[]>>({
    nutrient: [],
    water: [],
    energy: [],
    agricultural: []
  });
  
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableCountries, setAvailableCountries] = useState<{ code: string; name: string }[]>([]);

  // Process all datasets on mount
  useEffect(() => {
    const processed = {
      nutrient: processDataset(nutrientData as any, 'nutrient'),
      water: processDataset(waterData as any, 'water'),
      energy: processDataset(energyData as any, 'energy'),
      agricultural: processDataset(agriculturalData as any, 'agricultural')
    };
    
    setProcessedData(processed);
    
    // Get all unique years and countries across all datasets
    const allData = Object.values(processed).flat();
    const years = getUniqueYears(allData);
    const countries = getUniqueCountries(allData);
    
    setAvailableYears(years);
    setAvailableCountries(countries);
    
    // Set default year to most recent
    if (years.length > 0) {
      setSelectedYear(years[years.length - 1]);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader
        selectedYear={selectedYear}
        selectedCountry={selectedCountry}
        availableYears={availableYears}
        availableCountries={availableCountries}
        onYearChange={setSelectedYear}
        onCountryChange={setSelectedCountry}
      />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Dataset Cards */}
        <DatasetCards
          activeDataset={activeDataset}
          onDatasetChange={setActiveDataset}
          processedData={processedData}
          selectedYear={selectedYear}
          selectedCountry={selectedCountry}
          onCardClick={(datasetType) => scrollToSection(`${datasetType}-section`)}
        />
        
        {/* General Charts Section */}
        <section id="general-charts" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Global Agricultural Analytics
            </h2>
            <p className="text-muted-foreground mt-2">
              Comprehensive visualization of agricultural resource data across regions and time
            </p>
          </div>
          
          <GeneralCharts
            data={processedData}
            selectedYear={selectedYear}
            selectedCountry={selectedCountry}
            activeDataset={activeDataset}
          />
        </section>
        
        {/* Highlighted Insights */}
        <HighlightedInsights
          activeDataset={activeDataset}
          data={processedData[activeDataset]}
          selectedYear={selectedYear}
          selectedCountry={selectedCountry}
        />
        
        {/* Detailed Visualization for each dataset */}
        {Object.keys(DATASET_CONFIG).map((datasetType) => (
          <DetailedVisualization
            key={datasetType}
            datasetType={datasetType as DatasetType}
            data={processedData[datasetType as DatasetType]}
            selectedYear={selectedYear}
            selectedCountry={selectedCountry}
            isActive={activeDataset === datasetType}
          />
        ))}
      </main>
    </div>
  );
};
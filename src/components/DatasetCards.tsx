import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetType, ProcessedDataPoint, DATASET_CONFIG } from '@/types/data';
import { filterData, getDataStats, formatValue } from '@/utils/dataUtils';

interface DatasetCardsProps {
  activeDataset: DatasetType;
  onDatasetChange: (dataset: DatasetType) => void;
  processedData: Record<DatasetType, ProcessedDataPoint[]>;
  selectedYear?: number;
  selectedCountry: string;
  onCardClick: (datasetType: DatasetType) => void;
}

export const DatasetCards = ({
  activeDataset,
  onDatasetChange,
  processedData,
  selectedYear,
  selectedCountry,
  onCardClick
}: DatasetCardsProps) => {
  const datasets: DatasetType[] = ['nutrient', 'water', 'energy', 'agricultural'];

  const getAdjustedStats = (datasetType: DatasetType, rawStats: any) => {
    if (!rawStats) return null;

    // Handle special cases for nutrient and energy
    if (datasetType === 'nutrient' || datasetType === 'energy') {
      return {
        ...rawStats,
        total: Math.abs(rawStats.total), // Ensure positive values
        average: rawStats.total / (rawStats.count || 1), // Recalculate average
      };
    }

    return rawStats;
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {datasets.map((datasetType) => {
        const config = DATASET_CONFIG[datasetType];
        const filteredData = filterData(processedData[datasetType], selectedYear, selectedCountry);
        const rawStats = getDataStats(filteredData);
        const stats = getAdjustedStats(datasetType, rawStats);
        const isActive = activeDataset === datasetType;

        return (
          <Card
            key={datasetType}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              isActive 
                ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-card to-primary/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              onDatasetChange(datasetType);
              onCardClick(datasetType);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  {config.name}
                </CardTitle>
                {isActive && (
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {config.description}
              </p>
              
              {stats && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-sm font-medium">
                      {formatValue(stats.total, datasetType === 'nutrient' ? 2 : 0)} {config.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average:</span>
                    <span className="text-sm font-medium">
                      {formatValue(stats.average, datasetType === 'nutrient' ? 2 : 0)} {config.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Records:</span>
                    <span className="text-sm font-medium">{stats.count}</span>
                  </div>
                </div>
              )}
              
              {!stats && (
                <p className="text-sm text-muted-foreground italic">
                  No data for current filters
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};
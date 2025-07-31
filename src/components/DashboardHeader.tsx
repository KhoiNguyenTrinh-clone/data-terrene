import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardHeaderProps {
  selectedYear?: number;
  selectedCountry: string;
  availableYears: number[];
  availableCountries: { code: string; name: string }[];
  onYearChange: (year?: number) => void;
  onCountryChange: (country: string) => void;
}

export const DashboardHeader = ({
  selectedYear,
  selectedCountry,
  availableYears,
  availableCountries,
  onYearChange,
  onCountryChange
}: DashboardHeaderProps) => {
  return (
    <header className="bg-card border-b border-border shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-forest to-wheat bg-clip-text text-transparent">
              Agricultural Resource Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Global insights into nutrient balance, water usage, energy consumption, and land utilization
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 min-w-0 lg:min-w-[400px]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Year</label>
              <Select
                value={selectedYear?.toString() || 'all'}
                onValueChange={(value) => onYearChange(value === 'all' ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Country</label>
              <Select value={selectedCountry} onValueChange={onCountryChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {availableCountries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
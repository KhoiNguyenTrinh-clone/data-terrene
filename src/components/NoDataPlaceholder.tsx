import { Card, CardContent } from '@/components/ui/card';

interface NoDataPlaceholderProps {
  message: string;
  icon?: string;
  height?: string;
}

export const NoDataPlaceholder = ({ 
  message, 
  icon = "📊", 
  height = "h-64" 
}: NoDataPlaceholderProps) => {
  return (
    <Card className={`${height} flex items-center justify-center`}>
      <CardContent className="text-center space-y-4 py-8">
        <div className="animate-pulse bg-muted/30 rounded-lg p-6 transition-all duration-300">
          <div className="text-4xl mb-3 opacity-60">{icon}</div>
          <div className="w-32 h-4 bg-muted/50 rounded mx-auto mb-2 animate-pulse"></div>
          <div className="w-48 h-3 bg-muted/40 rounded mx-auto animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-muted-foreground text-sm mt-4 fade-in">{message}</p>
      </CardContent>
    </Card>
  );
};
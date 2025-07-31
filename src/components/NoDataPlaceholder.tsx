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
        <div className="animate-pulse">
          <div className="text-4xl mb-3 opacity-50">{icon}</div>
          <div className="w-32 h-4 bg-muted rounded mx-auto mb-2"></div>
          <div className="w-48 h-3 bg-muted/60 rounded mx-auto"></div>
        </div>
        <p className="text-muted-foreground text-sm mt-4">{message}</p>
      </CardContent>
    </Card>
  );
};
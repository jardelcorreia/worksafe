import { WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex flex-col items-center justify-center gap-4">
            <WifiOff className="h-12 w-12 text-destructive" />
            <span>Você está offline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Parece que você perdeu a conexão com a internet. Verifique sua conexão e tente novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

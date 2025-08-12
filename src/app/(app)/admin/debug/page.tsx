
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { debugUpload } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function DebugPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestUpload = async () => {
    setLoading(true);
    setResult(null);
    console.log("Iniciando teste de upload a partir do cliente...");
    const testResult = await debugUpload();
    setResult(testResult);
    setLoading(false);

    toast({
      title: testResult.success ? 'Sucesso no Teste' : 'Falha no Teste',
      description: testResult.message,
      variant: testResult.success ? 'default' : 'destructive',
      duration: 10000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Página de Depuração do Storage</CardTitle>
        <CardDescription>
          Use esta página para realizar um teste de upload simples e isolado para o Firebase Storage.
          Isso ajuda a verificar se as configurações de CORS e as permissões básicas estão corretas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTestUpload} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            'Iniciar Teste de Upload Simples'
          )}
        </Button>

        {result && (
          <div className="mt-4 rounded-md border p-4">
            <h4 className="font-semibold">Resultado do Teste:</h4>
            <p className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.success ? 'SUCESSO' : 'FALHA'}
            </p>
            <p className="text-sm text-muted-foreground mt-2 break-all">{result.message}</p>
             {!result.success && (
                <p className="text-xs text-muted-foreground mt-2">
                    Verifique o console do navegador e o console do servidor (terminal onde o Next.js está rodando) para mais detalhes do erro.
                </p>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

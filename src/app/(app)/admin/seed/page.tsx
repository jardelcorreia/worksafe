
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedRiskTypes } from '@/lib/seed';
import { Database } from 'lucide-react';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedRiskTypes();
      if (result.success) {
        if (result.count > 0) {
            toast({
              title: 'Sucesso!',
              description: `${result.count} novos tipos de risco foram cadastrados.`,
            });
        } else {
             toast({
              title: 'Nenhuma alteração',
              description: 'Todos os tipos de risco padrão já estavam cadastrados no banco de dados.',
            });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({
        title: 'Erro ao popular o banco de dados',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Popular Dados Iniciais</CardTitle>
        <CardDescription>
          Esta ação irá cadastrar uma lista pré-definida de tipos de risco no banco de dados. 
          Use isso para a configuração inicial do sistema. Itens duplicados não serão adicionados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
           <Database className="w-12 h-12 text-primary" />
           <p className="text-center text-muted-foreground">
            Clique no botão abaixo para adicionar as situações de risco padrão ao sistema.
            Isso pode levar alguns instantes.
           </p>
           <Button onClick={handleSeed} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Tipos de Risco'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

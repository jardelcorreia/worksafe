
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedRiskTypes, seedAuditors } from '@/lib/seed';
import { Database, Users } from 'lucide-react';

export default function SeedPage() {
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [loadingAuditors, setLoadingAuditors] = useState(false);
  const { toast } = useToast();

  const handleSeedRisks = async () => {
    setLoadingRisks(true);
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
        title: 'Erro ao popular os tipos de risco',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingRisks(false);
    }
  };
  
  const handleSeedAuditors = async () => {
    setLoadingAuditors(true);
    try {
      const result = await seedAuditors();
      if (result.success) {
        if (result.count > 0) {
            toast({
              title: 'Sucesso!',
              description: `${result.count} novos auditores foram cadastrados.`,
            });
        } else {
             toast({
              title: 'Nenhuma alteração',
              description: 'Todos os auditores padrão já estavam cadastrados no banco de dados.',
            });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({
        title: 'Erro ao popular os auditores',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingAuditors(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Popular Dados Iniciais</CardTitle>
          <CardDescription>
            Use estas ações para a configuração inicial do sistema. Itens duplicados não serão adicionados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
               <Database className="w-12 h-12 text-primary" />
               <p className="text-center text-muted-foreground">
                Clique no botão abaixo para adicionar as situações de risco padrão ao sistema.
               </p>
               <Button onClick={handleSeedRisks} disabled={loadingRisks}>
                {loadingRisks ? 'Cadastrando...' : 'Cadastrar Tipos de Risco'}
              </Button>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
               <Users className="w-12 h-12 text-primary" />
               <p className="text-center text-muted-foreground">
                Clique no botão abaixo para adicionar a lista de auditores padrão ao sistema.
               </p>
               <Button onClick={handleSeedAuditors} disabled={loadingAuditors}>
                {loadingAuditors ? 'Cadastrando...' : 'Cadastrar Auditores'}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { addRiskType, deleteRiskType } from '@/lib/actions';
import { riskTypes as initialRiskTypes } from '@/lib/data';
import { riskTypeSchema } from '@/lib/types';
import type { RiskType } from '@/lib/types';

export default function RiskTypesPage() {
  const { toast } = useToast();
  const [riskTypes, setRiskTypes] = useState<RiskType[]>(initialRiskTypes);

  const form = useForm<z.infer<typeof riskTypeSchema>>({
    resolver: zodResolver(riskTypeSchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleAddRiskType(values: z.infer<typeof riskTypeSchema>) {
    const newRiskType = { id: Date.now().toString(), name: values.name };
    setRiskTypes((prev) => [...prev, newRiskType]);
    form.reset();
    const result = await addRiskType(newRiskType);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar tipo de risco.',
        variant: 'destructive',
      });
      setRiskTypes((prev) => prev.filter((rt) => rt.id !== newRiskType.id));
    } else {
        toast({
            title: 'Sucesso',
            description: 'Tipo de Risco adicionado com sucesso.',
        });
    }
  }

  async function handleDeleteRiskType(id: string) {
    const originalRiskTypes = riskTypes;
    setRiskTypes((prev) => prev.filter((rt) => rt.id !== id));
    const result = await deleteRiskType(id);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir tipo de risco.',
        variant: 'destructive',
      });
      setRiskTypes(originalRiskTypes);
    } else {
      toast({
        title: 'Sucesso',
        description: 'Tipo de Risco excluído com sucesso.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Tipos de Risco</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddRiskType)}
              className="flex items-end gap-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Nome do Tipo de Risco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Vazamento Químico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adicionando...' : 'Adicionar Tipo de Risco'}
              </Button>
            </form>
          </Form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskTypes.map((riskType) => (
                  <TableRow key={riskType.id}>
                    <TableCell>{riskType.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRiskType(riskType.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

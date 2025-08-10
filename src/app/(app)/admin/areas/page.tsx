
'use client';

import { useState, useEffect } from 'react';
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
import { addArea, deleteArea, fetchAreas } from '@/lib/actions';
import { areaSchema } from '@/lib/types';
import type { Area } from '@/lib/types';

export default function AreasPage() {
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    async function getAreas() {
        setLoading(true);
        const areasData = await fetchAreas();
        setAreas(areasData);
        setLoading(false);
    }
    getAreas();
  }, [])

  async function handleAddArea(values: z.infer<typeof areaSchema>) {
    const result = await addArea(values);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar área.',
        variant: 'destructive',
      });
    } else {
      toast({
          title: 'Sucesso',
          description: 'Área adicionada com sucesso.',
      });
      form.reset();
      const areasData = await fetchAreas();
      setAreas(areasData);
    }
  }

  async function handleDeleteArea(id: string) {
    const result = await deleteArea(id);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir área.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Área excluída com sucesso.',
      });
      const areasData = await fetchAreas();
      setAreas(areasData);
    }
  }
  
  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Áreas</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Carregando áreas...</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Áreas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddArea)}
              className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Nome da Área</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lingotamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adicionando...' : 'Adicionar Área'}
              </Button>
            </form>
          </Form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteArea(area.id)}
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

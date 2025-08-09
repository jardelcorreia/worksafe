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
import { addAuditor, deleteAuditor } from '@/lib/actions';
import { auditors as initialAuditors } from '@/lib/data';
import { auditorSchema } from '@/lib/types';
import type { Auditor } from '@/lib/types';

export default function AuditorsPage() {
  const { toast } = useToast();
  const [auditors, setAuditors] =
    useState<Auditor[]>(initialAuditors);

  const form = useForm<z.infer<typeof auditorSchema>>({
    resolver: zodResolver(auditorSchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleAddAuditor(values: z.infer<typeof auditorSchema>) {
    const newAuditor = { id: Date.now().toString(), name: values.name };
    setAuditors((prev) => [...prev, newAuditor]);
    form.reset();
    const result = await addAuditor(newAuditor);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar auditor.',
        variant: 'destructive',
      });
      setAuditors((prev) => prev.filter((a) => a.id !== newAuditor.id));
    } else {
        toast({
            title: 'Sucesso',
            description: 'Auditor adicionado com sucesso.',
        });
    }
  }

  async function handleDeleteAuditor(id: string) {
    const originalAuditors = auditors;
    setAuditors((prev) => prev.filter((a) => a.id !== id));
    const result = await deleteAuditor(id);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir auditor.',
        variant: 'destructive',
      });
      setAuditors(originalAuditors);
    } else {
      toast({
        title: 'Sucesso',
        description: 'Auditor excluído com sucesso.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Auditores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddAuditor)}
              className="flex items-end gap-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Nome do Auditor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adicionando...' : 'Adicionar Auditor'}
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
                {auditors.map((auditor) => (
                  <TableRow key={auditor.id}>
                    <TableCell>{auditor.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAuditor(auditor.id)}
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

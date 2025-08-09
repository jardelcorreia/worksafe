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
import { addAuditor, deleteAuditor, fetchAuditors } from '@/lib/actions';
import { auditorSchema } from '@/lib/types';
import type { Auditor } from '@/lib/types';

export default function AuditorsPage() {
  const { toast } = useToast();
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof auditorSchema>>({
    resolver: zodResolver(auditorSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    async function getAuditors() {
        setLoading(true);
        const auditorsData = await fetchAuditors();
        setAuditors(auditorsData);
        setLoading(false);
    }
    getAuditors();
  }, []);

  async function handleAddAuditor(values: z.infer<typeof auditorSchema>) {
    const result = await addAuditor(values);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar auditor.',
        variant: 'destructive',
      });
    } else {
        toast({
            title: 'Sucesso',
            description: 'Auditor adicionado com sucesso.',
        });
        form.reset();
        const auditorsData = await fetchAuditors();
        setAuditors(auditorsData);
    }
  }

  async function handleDeleteAuditor(id: string) {
    const result = await deleteAuditor(id);
    if (!result.success) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir auditor.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Auditor excluído com sucesso.',
      });
      const auditorsData = await fetchAuditors();
      setAuditors(auditorsData);
    }
  }
  
  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Auditores</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Carregando auditores...</p>
            </CardContent>
        </Card>
    )
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

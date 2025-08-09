'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { auditors } from '@/lib/data';
import { auditorSchema } from '@/lib/types';
import type { Auditor } from '@/lib/types';
import { useState } from 'react';

export default function AuditorsPage() {
  const { toast } = useToast();
  const [optimisticAuditors, setOptimisticAuditors] = useState<Auditor[]>(auditors);

  const form = useForm<z.infer<typeof auditorSchema>>({
    resolver: zodResolver(auditorSchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleAddAuditor(values: z.infer<typeof auditorSchema>) {
    const newAuditor = { id: Date.now().toString(), name: values.name };
    setOptimisticAuditors((prev) => [...prev, newAuditor]);
    const result = await addAuditor(values);
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add auditor.',
        variant: 'destructive',
      });
      setOptimisticAuditors((prev) => prev.filter((a) => a.id !== newAuditor.id));
    }
  }

  async function handleDeleteAuditor(id: string) {
    const originalAuditors = optimisticAuditors;
    setOptimisticAuditors((prev) => prev.filter((a) => a.id !== id));
    const result = await deleteAuditor(id);
    if (!result.success) {
      toast({
        title: 'Error',
        description: 'Failed to delete auditor.',
        variant: 'destructive',
      });
      setOptimisticAuditors(originalAuditors);
    } else {
       toast({
        title: 'Success',
        description: 'Auditor deleted successfully.',
      });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add New Auditor</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <FormLabel>Auditor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adding...' : 'Add Auditor'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manage Auditors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticAuditors.map((auditor) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
